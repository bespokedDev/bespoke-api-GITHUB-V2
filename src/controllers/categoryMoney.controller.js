// controllers/categoryMoney.controller.js
const CategoryMoney = require('../models/CategoryMoney');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const categoryMoneyCtrl = {};

/**
 * @route POST /api/category-money
 * @description Crea una nueva categoría de dinero
 * @access Private (Requiere JWT)
 */
categoryMoneyCtrl.create = async (req, res) => {
    try {
        const { name } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la categoría de dinero es requerido.' });
        }

        const newCategoryMoney = new CategoryMoney({ name });
        const savedCategoryMoney = await newCategoryMoney.save();

        // Agregar información de status legible
        const categoryMoneyWithStatus = {
            ...savedCategoryMoney.toObject(),
            statusText: savedCategoryMoney.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Categoría de dinero creada exitosamente',
            categoryMoney: categoryMoneyWithStatus
        });

    } catch (error) {
        console.error('Error al crear categoría de dinero:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de la categoría de dinero');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear categoría de dinero', error: error.message });
    }
};

/**
 * @route GET /api/category-money
 * @description Lista todas las categorías de dinero
 * @access Private (Requiere JWT)
 */
categoryMoneyCtrl.list = async (req, res) => {
    try {
        const categoriesMoney = await CategoryMoney.find().lean();

        // Agregar información de status legible
        const categoriesMoneyWithStatus = categoriesMoney.map(categoryMoney => ({
            ...categoryMoney,
            statusText: categoryMoney.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(categoriesMoneyWithStatus);
    } catch (error) {
        console.error('Error al listar categorías de dinero:', error);
        res.status(500).json({ message: 'Error interno al listar categorías de dinero', error: error.message });
    }
};

/**
 * @route GET /api/category-money/:id
 * @description Obtiene una categoría de dinero por su ID
 * @access Private (Requiere JWT)
 */
categoryMoneyCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }

        const categoryMoney = await CategoryMoney.findById(id).lean();

        if (!categoryMoney) {
            return res.status(404).json({ message: 'Categoría de dinero no encontrada.' });
        }

        // Agregar información de status legible
        const categoryMoneyWithStatus = {
            ...categoryMoney,
            statusText: categoryMoney.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(categoryMoneyWithStatus);
    } catch (error) {
        console.error('Error al obtener categoría de dinero por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener categoría de dinero', error: error.message });
    }
};

/**
 * @route PUT /api/category-money/:id
 * @description Actualiza los datos de una categoría de dinero por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
categoryMoneyCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }

        // Validar que se proporcione al menos un campo
        if (!name) {
            return res.status(400).json({ message: 'Se requiere el campo name para actualizar la categoría de dinero.' });
        }

        // Validar que el nombre no esté vacío
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la categoría de dinero no puede estar vacío.' });
        }

        const updateFields = { name: name.trim() };

        const updatedCategoryMoney = await CategoryMoney.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedCategoryMoney) {
            return res.status(404).json({ message: 'Categoría de dinero no encontrada para actualizar.' });
        }

        // Agregar información de status legible
        const categoryMoneyWithStatus = {
            ...updatedCategoryMoney,
            statusText: updatedCategoryMoney.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Categoría de dinero actualizada exitosamente',
            categoryMoney: categoryMoneyWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar categoría de dinero:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de la categoría de dinero');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar categoría de dinero', error: error.message });
    }
};

/**
 * @route PATCH /api/category-money/:id/activate
 * @description Activa una categoría de dinero (cambia status a 1)
 * @access Private (Requiere JWT)
 */
categoryMoneyCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }

        const categoryMoney = await CategoryMoney.findById(id);
        
        if (!categoryMoney) {
            return res.status(404).json({ message: 'Categoría de dinero no encontrada.' });
        }

        // Verificar si ya está activa
        if (categoryMoney.status === 1) {
            return res.status(400).json({ message: 'La categoría de dinero ya está activa.' });
        }

        const updatedCategoryMoney = await CategoryMoney.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Categoría de dinero activada exitosamente',
            categoryMoney: {
                ...updatedCategoryMoney,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar categoría de dinero:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar categoría de dinero', error: error.message });
    }
};

/**
 * @route PATCH /api/category-money/:id/anular
 * @description Anula una categoría de dinero (cambia status a 2)
 * @access Private (Requiere JWT)
 */
categoryMoneyCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }

        const categoryMoney = await CategoryMoney.findById(id);
        
        if (!categoryMoney) {
            return res.status(404).json({ message: 'Categoría de dinero no encontrada.' });
        }

        // Verificar si ya está anulada
        if (categoryMoney.status === 2) {
            return res.status(400).json({ message: 'La categoría de dinero ya está anulada.' });
        }

        const updatedCategoryMoney = await CategoryMoney.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Categoría de dinero anulada exitosamente',
            categoryMoney: {
                ...updatedCategoryMoney,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular categoría de dinero:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de categoría de dinero inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular categoría de dinero', error: error.message });
    }
};

module.exports = categoryMoneyCtrl;

