// controllers/contentClass.controller.js
const ContentClass = require('../models/ContentClass');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const contentClassCtrl = {};

/**
 * @route POST /api/content-class
 * @description Crea un nuevo contenido de clase
 * @access Private (Requiere JWT)
 */
contentClassCtrl.create = async (req, res) => {
    try {
        const { name } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del contenido de clase es requerido.' });
        }

        const newContentClass = new ContentClass({ name });
        const savedContentClass = await newContentClass.save();

        // Agregar información de status legible
        const contentClassWithStatus = {
            ...savedContentClass.toObject(),
            statusText: savedContentClass.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Contenido de clase creado exitosamente',
            contentClass: contentClassWithStatus
        });

    } catch (error) {
        console.error('Error al crear contenido de clase:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del contenido de clase');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear contenido de clase', error: error.message });
    }
};

/**
 * @route GET /api/content-class
 * @description Lista todos los contenidos de clase
 * @access Private (Requiere JWT)
 */
contentClassCtrl.list = async (req, res) => {
    try {
        const contentClasses = await ContentClass.find().lean();

        // Agregar información de status legible
        const contentClassesWithStatus = contentClasses.map(contentClass => ({
            ...contentClass,
            statusText: contentClass.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(contentClassesWithStatus);
    } catch (error) {
        console.error('Error al listar contenidos de clase:', error);
        res.status(500).json({ message: 'Error interno al listar contenidos de clase', error: error.message });
    }
};

/**
 * @route GET /api/content-class/:id
 * @description Obtiene un contenido de clase por su ID
 * @access Private (Requiere JWT)
 */
contentClassCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }

        const contentClass = await ContentClass.findById(id).lean();

        if (!contentClass) {
            return res.status(404).json({ message: 'Contenido de clase no encontrado.' });
        }

        // Agregar información de status legible
        const contentClassWithStatus = {
            ...contentClass,
            statusText: contentClass.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(contentClassWithStatus);
    } catch (error) {
        console.error('Error al obtener contenido de clase por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener contenido de clase', error: error.message });
    }
};

/**
 * @route PUT /api/content-class/:id
 * @description Actualiza los datos de un contenido de clase por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
contentClassCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }

        // Validar que se proporcione al menos un campo
        if (!name) {
            return res.status(400).json({ message: 'Se requiere el campo name para actualizar el contenido de clase.' });
        }

        // Validar que el nombre no esté vacío
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del contenido de clase no puede estar vacío.' });
        }

        const updateFields = { name: name.trim() };

        const updatedContentClass = await ContentClass.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedContentClass) {
            return res.status(404).json({ message: 'Contenido de clase no encontrado para actualizar.' });
        }

        // Agregar información de status legible
        const contentClassWithStatus = {
            ...updatedContentClass,
            statusText: updatedContentClass.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Contenido de clase actualizado exitosamente',
            contentClass: contentClassWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar contenido de clase:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del contenido de clase');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar contenido de clase', error: error.message });
    }
};

/**
 * @route PATCH /api/content-class/:id/activate
 * @description Activa un contenido de clase (cambia status a 1)
 * @access Private (Requiere JWT)
 */
contentClassCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }

        const contentClass = await ContentClass.findById(id);
        
        if (!contentClass) {
            return res.status(404).json({ message: 'Contenido de clase no encontrado.' });
        }

        // Verificar si ya está activo
        if (contentClass.status === 1) {
            return res.status(400).json({ message: 'El contenido de clase ya está activo.' });
        }

        const updatedContentClass = await ContentClass.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Contenido de clase activado exitosamente',
            contentClass: {
                ...updatedContentClass,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar contenido de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar contenido de clase', error: error.message });
    }
};

/**
 * @route PATCH /api/content-class/:id/anular
 * @description Anula un contenido de clase (cambia status a 2)
 * @access Private (Requiere JWT)
 */
contentClassCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }

        const contentClass = await ContentClass.findById(id);
        
        if (!contentClass) {
            return res.status(404).json({ message: 'Contenido de clase no encontrado.' });
        }

        // Verificar si ya está anulado
        if (contentClass.status === 2) {
            return res.status(400).json({ message: 'El contenido de clase ya está anulado.' });
        }

        const updatedContentClass = await ContentClass.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Contenido de clase anulado exitosamente',
            contentClass: {
                ...updatedContentClass,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular contenido de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de contenido de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular contenido de clase', error: error.message });
    }
};

module.exports = contentClassCtrl;

