// controllers/professorType.controller.js
const ProfessorType = require('../models/ProfessorType');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const professorTypeCtrl = {};

/**
 * @route POST /api/professor-types
 * @description Crea un nuevo tipo de profesor
 * @access Private (Requiere JWT)
 */
professorTypeCtrl.create = async (req, res) => {
    try {
        const { rates } = req.body;

        // Validaciones básicas
        if (!rates || typeof rates !== 'object') {
            return res.status(400).json({ message: 'El campo rates es requerido y debe ser un objeto.' });
        }

        const { single, couple, group } = rates;

        // Validar que todos los campos de rates estén presentes
        if (single === undefined || couple === undefined || group === undefined) {
            return res.status(400).json({ 
                message: 'Los campos single, couple y group son requeridos en rates.' 
            });
        }

        // Validar que sean números y mayores o iguales a 0
        if (typeof single !== 'number' || single < 0) {
            return res.status(400).json({ 
                message: 'El campo single debe ser un número mayor o igual a 0.' 
            });
        }

        if (typeof couple !== 'number' || couple < 0) {
            return res.status(400).json({ 
                message: 'El campo couple debe ser un número mayor o igual a 0.' 
            });
        }

        if (typeof group !== 'number' || group < 0) {
            return res.status(400).json({ 
                message: 'El campo group debe ser un número mayor o igual a 0.' 
            });
        }

        const newProfessorType = new ProfessorType({
            rates: {
                single,
                couple,
                group
            }
        });

        const savedProfessorType = await newProfessorType.save();

        // Agregar información de status legible
        const professorTypeWithStatus = {
            ...savedProfessorType.toObject(),
            statusText: savedProfessorType.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Tipo de profesor creado exitosamente',
            professorType: professorTypeWithStatus
        });

    } catch (error) {
        console.error('Error al crear tipo de profesor:', error);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear tipo de profesor', error: error.message });
    }
};

/**
 * @route GET /api/professor-types
 * @description Lista todos los tipos de profesor
 * @access Private (Requiere JWT)
 */
professorTypeCtrl.list = async (req, res) => {
    try {
        const professorTypes = await ProfessorType.find().lean();

        // Agregar información de status legible
        const professorTypesWithStatus = professorTypes.map(professorType => ({
            ...professorType,
            statusText: professorType.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(professorTypesWithStatus);
    } catch (error) {
        console.error('Error al listar tipos de profesor:', error);
        res.status(500).json({ message: 'Error interno al listar tipos de profesor', error: error.message });
    }
};

/**
 * @route GET /api/professor-types/:id
 * @description Obtiene un tipo de profesor por su ID
 * @access Private (Requiere JWT)
 */
professorTypeCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }

        const professorType = await ProfessorType.findById(id).lean();

        if (!professorType) {
            return res.status(404).json({ message: 'Tipo de profesor no encontrado.' });
        }

        // Agregar información de status legible
        const professorTypeWithStatus = {
            ...professorType,
            statusText: professorType.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(professorTypeWithStatus);
    } catch (error) {
        console.error('Error al obtener tipo de profesor por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener tipo de profesor', error: error.message });
    }
};

/**
 * @route PUT /api/professor-types/:id
 * @description Actualiza los datos de un tipo de profesor por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
professorTypeCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { rates } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }

        // Validar que se proporcione el campo rates
        if (!rates || typeof rates !== 'object') {
            return res.status(400).json({ message: 'Se requiere el campo rates para actualizar el tipo de profesor.' });
        }

        const { single, couple, group } = rates;

        // Validar que todos los campos estén presentes
        if (single === undefined || couple === undefined || group === undefined) {
            return res.status(400).json({ 
                message: 'Los campos single, couple y group son requeridos en rates.' 
            });
        }

        // Validar que sean números y mayores o iguales a 0
        if (typeof single !== 'number' || single < 0) {
            return res.status(400).json({ 
                message: 'El campo single debe ser un número mayor o igual a 0.' 
            });
        }

        if (typeof couple !== 'number' || couple < 0) {
            return res.status(400).json({ 
                message: 'El campo couple debe ser un número mayor o igual a 0.' 
            });
        }

        if (typeof group !== 'number' || group < 0) {
            return res.status(400).json({ 
                message: 'El campo group debe ser un número mayor o igual a 0.' 
            });
        }

        const updateFields = {
            rates: {
                single,
                couple,
                group
            }
        };

        const updatedProfessorType = await ProfessorType.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedProfessorType) {
            return res.status(404).json({ message: 'Tipo de profesor no encontrado para actualizar.' });
        }

        // Agregar información de status legible
        const professorTypeWithStatus = {
            ...updatedProfessorType,
            statusText: updatedProfessorType.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Tipo de profesor actualizado exitosamente',
            professorType: professorTypeWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar tipo de profesor:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar tipo de profesor', error: error.message });
    }
};

/**
 * @route PATCH /api/professor-types/:id/activate
 * @description Activa un tipo de profesor (cambia status a 1)
 * @access Private (Requiere JWT)
 */
professorTypeCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }

        const professorType = await ProfessorType.findById(id);
        
        if (!professorType) {
            return res.status(404).json({ message: 'Tipo de profesor no encontrado.' });
        }

        // Verificar si ya está activo
        if (professorType.status === 1) {
            return res.status(400).json({ message: 'El tipo de profesor ya está activo.' });
        }

        const updatedProfessorType = await ProfessorType.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Tipo de profesor activado exitosamente',
            professorType: {
                ...updatedProfessorType,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar tipo de profesor:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar tipo de profesor', error: error.message });
    }
};

/**
 * @route PATCH /api/professor-types/:id/anular
 * @description Anula un tipo de profesor (cambia status a 2)
 * @access Private (Requiere JWT)
 */
professorTypeCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }

        const professorType = await ProfessorType.findById(id);
        
        if (!professorType) {
            return res.status(404).json({ message: 'Tipo de profesor no encontrado.' });
        }

        // Verificar si ya está anulado
        if (professorType.status === 2) {
            return res.status(400).json({ message: 'El tipo de profesor ya está anulado.' });
        }

        const updatedProfessorType = await ProfessorType.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Tipo de profesor anulado exitosamente',
            professorType: {
                ...updatedProfessorType,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular tipo de profesor:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular tipo de profesor', error: error.message });
    }
};

module.exports = professorTypeCtrl;
