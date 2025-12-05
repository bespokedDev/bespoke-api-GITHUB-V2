// controllers/classObjectives.controller.js
const ClassObjective = require('../models/ClassObjective');
const Enrollment = require('../models/Enrollment');
const ContentClass = require('../models/ContentClass');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const classObjectiveCtrl = {};

/**
 * @route POST /api/class-objectives
 * @description Crea un nuevo objetivo de clase
 * @access Private (Requiere JWT)
 */
classObjectiveCtrl.create = async (req, res) => {
    try {
        const { enrollmentId, category, teachersNote, objective, objectiveDate, objectiveAchieved } = req.body;

        // Validaciones básicas
        if (!enrollmentId || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
            return res.status(400).json({ message: 'ID de enrollment inválido o no proporcionado.' });
        }

        if (!category || !mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ message: 'ID de categoría (content-class) inválido o no proporcionado.' });
        }

        if (!objective || typeof objective !== 'string' || objective.trim() === '') {
            return res.status(400).json({ message: 'El campo objective es requerido y no puede estar vacío.' });
        }

        if (!objectiveDate) {
            return res.status(400).json({ message: 'El campo objectiveDate es requerido.' });
        }

        // Validar que el enrollment existe
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment no encontrado.' });
        }

        // Validar que la categoría existe
        const contentClass = await ContentClass.findById(category);
        if (!contentClass) {
            return res.status(404).json({ message: 'Categoría (content-class) no encontrada.' });
        }

        // Convertir objectiveDate a Date si viene como string
        const dateObj = objectiveDate instanceof Date ? objectiveDate : new Date(objectiveDate);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ message: 'El campo objectiveDate debe ser una fecha válida.' });
        }

        const newObjective = new ClassObjective({
            enrollmentId,
            category,
            teachersNote: teachersNote || null,
            objective: objective.trim(),
            objectiveDate: dateObj,
            objectiveAchieved: objectiveAchieved || false
        });

        const savedObjective = await newObjective.save();

        // Popular los campos de referencia para la respuesta
        const populatedObjective = await ClassObjective.findById(savedObjective._id)
            .populate('enrollmentId', 'alias language enrollmentType')
            .populate('category', 'name')
            .lean();

        res.status(201).json({
            message: 'Objetivo de clase creado exitosamente',
            objective: populatedObjective
        });

    } catch (error) {
        console.error('Error al crear objetivo de clase:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear objetivo de clase', error: error.message });
    }
};

/**
 * @route GET /api/class-objectives
 * @description Lista todos los objetivos de clase con información básica
 * @access Private (Requiere JWT)
 */
classObjectiveCtrl.list = async (req, res) => {
    try {
        // Opcional: filtrar por enrollmentId si se proporciona como query parameter
        const { enrollmentId, startDate, endDate } = req.query;
        const filter = {};
        
        if (enrollmentId) {
            if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
                return res.status(400).json({ message: 'ID de enrollment inválido.' });
            }
            filter.enrollmentId = enrollmentId;
        }

        // Filtrar por periodo de fechas si se proporcionan
        if (startDate || endDate) {
            filter.objectiveDate = {};
            
            // Validar formato de fecha DD/MM/YYYY
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            
            if (startDate) {
                if (!dateRegex.test(startDate)) {
                    return res.status(400).json({ message: 'La fecha de inicio debe estar en formato DD/MM/YYYY (ej: 31/12/2025)' });
                }
                // Convertir DD/MM/YYYY a Date
                const [day, month, year] = startDate.split('/');
                const startDateObj = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
                filter.objectiveDate.$gte = startDateObj;
            }
            
            if (endDate) {
                if (!dateRegex.test(endDate)) {
                    return res.status(400).json({ message: 'La fecha de fin debe estar en formato DD/MM/YYYY (ej: 31/12/2025)' });
                }
                // Convertir DD/MM/YYYY a Date
                const [day, month, year] = endDate.split('/');
                const endDateObj = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
                filter.objectiveDate.$lte = endDateObj;
            }
        }

        // Solo mostrar objetivos activos por defecto (a menos que se especifique lo contrario)
        const { includeInactive } = req.query;
        if (includeInactive !== 'true') {
            filter.isActive = true;
        }

        const objectives = await ClassObjective.find(filter)
            .populate('enrollmentId', 'alias language enrollmentType')
            .populate('category', 'name')
            .sort({ objectiveDate: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            message: 'Objetivos de clase obtenidos exitosamente',
            objectives: objectives,
            total: objectives.length
        });
    } catch (error) {
        console.error('Error al listar objetivos de clase:', error);
        res.status(500).json({ message: 'Error interno al listar objetivos de clase', error: error.message });
    }
};

/**
 * @route GET /api/class-objectives/:id
 * @description Obtiene un objetivo de clase por su ID con detalle completo
 * @access Private (Requiere JWT)
 */
classObjectiveCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de objetivo de clase inválido.' });
        }

        const objective = await ClassObjective.findById(id)
            .populate('enrollmentId', 'alias language enrollmentType startDate endDate')
            .populate('category', 'name status')
            .lean();

        if (!objective) {
            return res.status(404).json({ message: 'Objetivo de clase no encontrado.' });
        }

        res.status(200).json({
            message: 'Objetivo de clase obtenido exitosamente',
            objective: objective
        });
    } catch (error) {
        console.error('Error al obtener objetivo de clase por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de objetivo de clase inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener objetivo de clase', error: error.message });
    }
};

/**
 * @route PUT /api/class-objectives/:id
 * @description Actualiza los datos de un objetivo de clase
 * @access Private (Requiere JWT)
 */
classObjectiveCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, teachersNote, objective, objectiveDate, objectiveAchieved } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de objetivo de clase inválido.' });
        }

        // Verificar que el objetivo existe
        const existingObjective = await ClassObjective.findById(id);
        if (!existingObjective) {
            return res.status(404).json({ message: 'Objetivo de clase no encontrado.' });
        }

        // Construir objeto de actualización solo con los campos proporcionados
        const updateFields = {};

        if (category !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({ message: 'ID de categoría (content-class) inválido.' });
            }
            // Validar que la categoría existe
            const contentClass = await ContentClass.findById(category);
            if (!contentClass) {
                return res.status(404).json({ message: 'Categoría (content-class) no encontrada.' });
            }
            updateFields.category = category;
        }

        if (teachersNote !== undefined) {
            updateFields.teachersNote = teachersNote === null || teachersNote === '' ? null : teachersNote.trim();
        }

        if (objective !== undefined) {
            if (typeof objective !== 'string' || objective.trim() === '') {
                return res.status(400).json({ message: 'El campo objective no puede estar vacío.' });
            }
            updateFields.objective = objective.trim();
        }

        if (objectiveDate !== undefined) {
            const dateObj = objectiveDate instanceof Date ? objectiveDate : new Date(objectiveDate);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({ message: 'El campo objectiveDate debe ser una fecha válida.' });
            }
            updateFields.objectiveDate = dateObj;
        }

        if (objectiveAchieved !== undefined) {
            if (typeof objectiveAchieved !== 'boolean') {
                return res.status(400).json({ message: 'El campo objectiveAchieved debe ser un valor booleano (true o false).' });
            }
            updateFields.objectiveAchieved = objectiveAchieved;
        }

        const updatedObjective = await ClassObjective.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        )
        .populate('enrollmentId', 'alias language enrollmentType')
        .populate('category', 'name')
        .lean();

        res.status(200).json({
            message: 'Objetivo de clase actualizado exitosamente',
            objective: updatedObjective
        });

    } catch (error) {
        console.error('Error al actualizar objetivo de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de objetivo de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar objetivo de clase', error: error.message });
    }
};

/**
 * @route PATCH /api/class-objectives/:id/anular
 * @description Anula un objetivo de clase (establece isActive a false)
 * @access Private (Requiere JWT)
 */
classObjectiveCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de objetivo de clase inválido.' });
        }

        const objective = await ClassObjective.findById(id);
        
        if (!objective) {
            return res.status(404).json({ message: 'Objetivo de clase no encontrado.' });
        }

        // Verificar si ya está anulado
        if (objective.isActive === false) {
            return res.status(400).json({ message: 'El objetivo de clase ya está anulado.' });
        }

        const updatedObjective = await ClassObjective.findByIdAndUpdate(
            id, 
            { isActive: false }, 
            { new: true, runValidators: true }
        )
        .populate('enrollmentId', 'alias language enrollmentType')
        .populate('category', 'name')
        .lean();

        res.status(200).json({
            message: 'Objetivo de clase anulado exitosamente',
            objective: updatedObjective
        });

    } catch (error) {
        console.error('Error al anular objetivo de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de objetivo de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular objetivo de clase', error: error.message });
    }
};

module.exports = classObjectiveCtrl;

