// controllers/penalizaciones.controller.js
const Penalizacion = require('../models/Penalizacion');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const penalizacionCtrl = {};

/**
 * @route POST /api/penalties
 * @description Crea una nueva penalización
 * @access Private (Requiere JWT)
 */
penalizacionCtrl.create = async (req, res) => {
    try {
        const { name } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la penalización es requerido.' });
        }

        const newPenalizacion = new Penalizacion({ name });
        const savedPenalizacion = await newPenalizacion.save();

        // Agregar información de status legible
        const penalizacionWithStatus = {
            ...savedPenalizacion.toObject(),
            statusText: savedPenalizacion.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Penalización creada exitosamente',
            penalizacion: penalizacionWithStatus
        });

    } catch (error) {
        console.error('Error al crear penalización:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de la penalización');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear penalización', error: error.message });
    }
};

/**
 * @route GET /api/penalties
 * @description Lista todas las penalizaciones
 * @access Private (Requiere JWT)
 */
penalizacionCtrl.list = async (req, res) => {
    try {
        const penalizaciones = await Penalizacion.find().lean();

        // Agregar información de status legible
        const penalizacionesWithStatus = penalizaciones.map(penalizacion => ({
            ...penalizacion,
            statusText: penalizacion.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(penalizacionesWithStatus);
    } catch (error) {
        console.error('Error al listar penalizaciones:', error);
        res.status(500).json({ message: 'Error interno al listar penalizaciones', error: error.message });
    }
};

/**
 * @route GET /api/penalties/:id
 * @description Obtiene una penalización por su ID
 * @access Private (Requiere JWT)
 */
penalizacionCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }

        const penalizacion = await Penalizacion.findById(id).lean();

        if (!penalizacion) {
            return res.status(404).json({ message: 'Penalización no encontrada.' });
        }

        // Agregar información de status legible
        const penalizacionWithStatus = {
            ...penalizacion,
            statusText: penalizacion.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(penalizacionWithStatus);
    } catch (error) {
        console.error('Error al obtener penalización por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener penalización', error: error.message });
    }
};

/**
 * @route PUT /api/penalties/:id
 * @description Actualiza los datos de una penalización por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
penalizacionCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }

        // Validar que se proporcione al menos un campo
        if (!name) {
            return res.status(400).json({ message: 'Se requiere el campo name para actualizar la penalización.' });
        }

        // Validar que el nombre no esté vacío
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la penalización no puede estar vacío.' });
        }

        const updateFields = { name: name.trim() };

        const updatedPenalizacion = await Penalizacion.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedPenalizacion) {
            return res.status(404).json({ message: 'Penalización no encontrada para actualizar.' });
        }

        // Agregar información de status legible
        const penalizacionWithStatus = {
            ...updatedPenalizacion,
            statusText: updatedPenalizacion.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Penalización actualizada exitosamente',
            penalizacion: penalizacionWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar penalización:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de la penalización');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar penalización', error: error.message });
    }
};

/**
 * @route PATCH /api/penalties/:id/activate
 * @description Activa una penalización (cambia status a 1)
 * @access Private (Requiere JWT)
 */
penalizacionCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }

        const penalizacion = await Penalizacion.findById(id);
        
        if (!penalizacion) {
            return res.status(404).json({ message: 'Penalización no encontrada.' });
        }

        // Verificar si ya está activa
        if (penalizacion.status === 1) {
            return res.status(400).json({ message: 'La penalización ya está activa.' });
        }

        const updatedPenalizacion = await Penalizacion.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Penalización activada exitosamente',
            penalizacion: {
                ...updatedPenalizacion,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar penalización:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar penalización', error: error.message });
    }
};

/**
 * @route PATCH /api/penalties/:id/anular
 * @description Anula una penalización (cambia status a 2)
 * @access Private (Requiere JWT)
 */
penalizacionCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }

        const penalizacion = await Penalizacion.findById(id);
        
        if (!penalizacion) {
            return res.status(404).json({ message: 'Penalización no encontrada.' });
        }

        // Verificar si ya está anulada
        if (penalizacion.status === 2) {
            return res.status(400).json({ message: 'La penalización ya está anulada.' });
        }

        const updatedPenalizacion = await Penalizacion.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Penalización anulada exitosamente',
            penalizacion: {
                ...updatedPenalizacion,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular penalización:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de penalización inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular penalización', error: error.message });
    }
};

module.exports = penalizacionCtrl;

