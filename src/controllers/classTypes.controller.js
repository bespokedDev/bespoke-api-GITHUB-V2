// controllers/classTypes.controller.js
const ClassType = require('../models/ClassType');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const classTypeCtrl = {};

/**
 * @route POST /api/class-types
 * @description Crea un nuevo tipo de clase
 * @access Private (Requiere JWT)
 */
classTypeCtrl.create = async (req, res) => {
    try {
        const { name } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del tipo de clase es requerido.' });
        }

        const newClassType = new ClassType({ name });
        const savedClassType = await newClassType.save();

        // Agregar información de status legible
        const classTypeWithStatus = {
            ...savedClassType.toObject(),
            statusText: savedClassType.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Tipo de clase creado exitosamente',
            classType: classTypeWithStatus
        });

    } catch (error) {
        console.error('Error al crear tipo de clase:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del tipo de clase');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear tipo de clase', error: error.message });
    }
};

/**
 * @route GET /api/class-types
 * @description Lista todos los tipos de clase
 * @access Private (Requiere JWT)
 */
classTypeCtrl.list = async (req, res) => {
    try {
        const classTypes = await ClassType.find().lean();

        // Agregar información de status legible
        const classTypesWithStatus = classTypes.map(classType => ({
            ...classType,
            statusText: classType.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(classTypesWithStatus);
    } catch (error) {
        console.error('Error al listar tipos de clase:', error);
        res.status(500).json({ message: 'Error interno al listar tipos de clase', error: error.message });
    }
};

/**
 * @route GET /api/class-types/:id
 * @description Obtiene un tipo de clase por su ID
 * @access Private (Requiere JWT)
 */
classTypeCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }

        const classType = await ClassType.findById(id).lean();

        if (!classType) {
            return res.status(404).json({ message: 'Tipo de clase no encontrado.' });
        }

        // Agregar información de status legible
        const classTypeWithStatus = {
            ...classType,
            statusText: classType.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(classTypeWithStatus);
    } catch (error) {
        console.error('Error al obtener tipo de clase por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener tipo de clase', error: error.message });
    }
};

/**
 * @route PUT /api/class-types/:id
 * @description Actualiza los datos de un tipo de clase por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
classTypeCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }

        // Validar que se proporcione al menos un campo
        if (!name) {
            return res.status(400).json({ message: 'Se requiere el campo name para actualizar el tipo de clase.' });
        }

        // Validar que el nombre no esté vacío
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del tipo de clase no puede estar vacío.' });
        }

        const updateFields = { name: name.trim() };

        const updatedClassType = await ClassType.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedClassType) {
            return res.status(404).json({ message: 'Tipo de clase no encontrado para actualizar.' });
        }

        // Agregar información de status legible
        const classTypeWithStatus = {
            ...updatedClassType,
            statusText: updatedClassType.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Tipo de clase actualizado exitosamente',
            classType: classTypeWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar tipo de clase:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del tipo de clase');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar tipo de clase', error: error.message });
    }
};

/**
 * @route PATCH /api/class-types/:id/activate
 * @description Activa un tipo de clase (cambia status a 1)
 * @access Private (Requiere JWT)
 */
classTypeCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }

        const classType = await ClassType.findById(id);
        
        if (!classType) {
            return res.status(404).json({ message: 'Tipo de clase no encontrado.' });
        }

        // Verificar si ya está activo
        if (classType.status === 1) {
            return res.status(400).json({ message: 'El tipo de clase ya está activo.' });
        }

        const updatedClassType = await ClassType.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Tipo de clase activado exitosamente',
            classType: {
                ...updatedClassType,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar tipo de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar tipo de clase', error: error.message });
    }
};

/**
 * @route PATCH /api/class-types/:id/anular
 * @description Anula un tipo de clase (cambia status a 2)
 * @access Private (Requiere JWT)
 */
classTypeCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }

        const classType = await ClassType.findById(id);
        
        if (!classType) {
            return res.status(404).json({ message: 'Tipo de clase no encontrado.' });
        }

        // Verificar si ya está anulado
        if (classType.status === 2) {
            return res.status(400).json({ message: 'El tipo de clase ya está anulado.' });
        }

        const updatedClassType = await ClassType.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Tipo de clase anulado exitosamente',
            classType: {
                ...updatedClassType,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular tipo de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular tipo de clase', error: error.message });
    }
};

module.exports = classTypeCtrl;

