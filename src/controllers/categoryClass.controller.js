// controllers/categoryClass.controller.js
const CategoryClass = require('../models/CategoryClass');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const categoryClassCtrl = {};

/**
 * @route POST /api/category-class
 * @description Crea una nueva categoría de clase
 * @access Private (Requiere JWT)
 */
categoryClassCtrl.create = async (req, res) => {
    try {
        const { name } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la categoría de clase es requerido.' });
        }

        const newCategoryClass = new CategoryClass({ name });
        const savedCategoryClass = await newCategoryClass.save();

        // Agregar información de status legible
        const categoryClassWithStatus = {
            ...savedCategoryClass.toObject(),
            statusText: savedCategoryClass.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Categoría de clase creada exitosamente',
            categoryClass: categoryClassWithStatus
        });

    } catch (error) {
        console.error('Error al crear categoría de clase:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de la categoría de clase');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear categoría de clase', error: error.message });
    }
};

/**
 * @route GET /api/category-class
 * @description Lista todas las categorías de clase
 * @access Private (Requiere JWT)
 */
categoryClassCtrl.list = async (req, res) => {
    try {
        const categoryClasses = await CategoryClass.find().lean();

        // Agregar información de status legible
        const categoryClassesWithStatus = categoryClasses.map(categoryClass => ({
            ...categoryClass,
            statusText: categoryClass.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(categoryClassesWithStatus);
    } catch (error) {
        console.error('Error al listar categorías de clase:', error);
        res.status(500).json({ message: 'Error interno al listar categorías de clase', error: error.message });
    }
};

/**
 * @route GET /api/category-class/:id
 * @description Obtiene una categoría de clase por su ID
 * @access Private (Requiere JWT)
 */
categoryClassCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }

        const categoryClass = await CategoryClass.findById(id).lean();

        if (!categoryClass) {
            return res.status(404).json({ message: 'Categoría de clase no encontrada.' });
        }

        // Agregar información de status legible
        const categoryClassWithStatus = {
            ...categoryClass,
            statusText: categoryClass.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(categoryClassWithStatus);
    } catch (error) {
        console.error('Error al obtener categoría de clase por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener categoría de clase', error: error.message });
    }
};

/**
 * @route PUT /api/category-class/:id
 * @description Actualiza los datos de una categoría de clase por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
categoryClassCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }

        // Validar que se proporcione al menos un campo
        if (!name) {
            return res.status(400).json({ message: 'Se requiere el campo name para actualizar la categoría de clase.' });
        }

        // Validar que el nombre no esté vacío
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la categoría de clase no puede estar vacío.' });
        }

        const updateFields = { name: name.trim() };

        const updatedCategoryClass = await CategoryClass.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedCategoryClass) {
            return res.status(404).json({ message: 'Categoría de clase no encontrada para actualizar.' });
        }

        // Agregar información de status legible
        const categoryClassWithStatus = {
            ...updatedCategoryClass,
            statusText: updatedCategoryClass.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Categoría de clase actualizada exitosamente',
            categoryClass: categoryClassWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar categoría de clase:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de la categoría de clase');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar categoría de clase', error: error.message });
    }
};

/**
 * @route PATCH /api/category-class/:id/activate
 * @description Activa una categoría de clase (cambia status a 1)
 * @access Private (Requiere JWT)
 */
categoryClassCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }

        const categoryClass = await CategoryClass.findById(id);
        
        if (!categoryClass) {
            return res.status(404).json({ message: 'Categoría de clase no encontrada.' });
        }

        // Verificar si ya está activa
        if (categoryClass.status === 1) {
            return res.status(400).json({ message: 'La categoría de clase ya está activa.' });
        }

        const updatedCategoryClass = await CategoryClass.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Categoría de clase activada exitosamente',
            categoryClass: {
                ...updatedCategoryClass,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar categoría de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar categoría de clase', error: error.message });
    }
};

/**
 * @route PATCH /api/category-class/:id/anular
 * @description Anula una categoría de clase (cambia status a 2)
 * @access Private (Requiere JWT)
 */
categoryClassCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }

        const categoryClass = await CategoryClass.findById(id);
        
        if (!categoryClass) {
            return res.status(404).json({ message: 'Categoría de clase no encontrada.' });
        }

        // Verificar si ya está anulada
        if (categoryClass.status === 2) {
            return res.status(400).json({ message: 'La categoría de clase ya está anulada.' });
        }

        const updatedCategoryClass = await CategoryClass.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Categoría de clase anulada exitosamente',
            categoryClass: {
                ...updatedCategoryClass,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular categoría de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular categoría de clase', error: error.message });
    }
};

module.exports = categoryClassCtrl;

