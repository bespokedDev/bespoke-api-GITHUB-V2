// controllers/categoryNotification.controller.js
const CategoryNotification = require('../models/CategoryNotification');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const categoryNotificationCtrl = {};

/**
 * @route POST /api/category-notifications
 * @description Crea una nueva categoría de notificación
 * @access Private (Requiere JWT - Solo admin)
 */
categoryNotificationCtrl.create = async (req, res) => {
    try {
        const { category_notification_description } = req.body;

        // Validar campos requeridos
        if (!category_notification_description) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                required: ['category_notification_description'],
                received: Object.keys(req.body)
            });
        }

        // Validar que category_notification_description sea un string no vacío
        if (typeof category_notification_description !== 'string' || category_notification_description.trim() === '') {
            return res.status(400).json({
                message: 'El campo category_notification_description debe ser un string no vacío'
            });
        }

        // Crear la nueva categoría de notificación
        const newCategoryNotification = new CategoryNotification({
            category_notification_description: category_notification_description.trim(),
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        });

        const savedCategoryNotification = await newCategoryNotification.save();

        res.status(201).json({
            message: 'Categoría de notificación creada exitosamente',
            categoryNotification: savedCategoryNotification
        });
    } catch (error) {
        console.error('Error al crear categoría de notificación:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'categoría de notificación');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Error de validación',
                errors: validationErrors
            });
        }

        res.status(500).json({
            message: 'Error interno al crear categoría de notificación',
            error: error.message
        });
    }
};

/**
 * @route GET /api/category-notifications
 * @description Lista todas las categorías de notificación con filtros opcionales
 * @access Private (Requiere JWT - Solo admin)
 */
categoryNotificationCtrl.list = async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};

        // Filtro por isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true;
        }

        const categoryNotifications = await CategoryNotification.find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            message: 'Categorías de notificación obtenidas exitosamente',
            count: categoryNotifications.length,
            categoryNotifications: categoryNotifications
        });
    } catch (error) {
        console.error('Error al listar categorías de notificación:', error);
        res.status(500).json({
            message: 'Error interno al listar categorías de notificación',
            error: error.message
        });
    }
};

/**
 * @route GET /api/category-notifications/:id
 * @description Obtiene una categoría de notificación por su ID
 * @access Private (Requiere JWT - Solo admin)
 */
categoryNotificationCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        const categoryNotification = await CategoryNotification.findById(id).lean();

        if (!categoryNotification) {
            return res.status(404).json({
                message: 'Categoría de notificación no encontrada'
            });
        }

        res.status(200).json({
            message: 'Categoría de notificación obtenida exitosamente',
            categoryNotification: categoryNotification
        });
    } catch (error) {
        console.error('Error al obtener categoría de notificación:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        res.status(500).json({
            message: 'Error interno al obtener categoría de notificación',
            error: error.message
        });
    }
};

/**
 * @route PUT /api/category-notifications/:id
 * @description Actualiza una categoría de notificación por su ID
 * @access Private (Requiere JWT - Solo admin)
 */
categoryNotificationCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_notification_description, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        const existingCategoryNotification = await CategoryNotification.findById(id);
        if (!existingCategoryNotification) {
            return res.status(404).json({
                message: 'Categoría de notificación no encontrada'
            });
        }

        const updateFields = {};

        if (category_notification_description !== undefined) {
            if (typeof category_notification_description !== 'string' || category_notification_description.trim() === '') {
                return res.status(400).json({
                    message: 'El campo category_notification_description debe ser un string no vacío'
                });
            }
            updateFields.category_notification_description = category_notification_description.trim();
        }

        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    message: 'El campo isActive debe ser un valor booleano (true o false)'
                });
            }
            updateFields.isActive = isActive;
        }

        const updatedCategoryNotification = await CategoryNotification.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Categoría de notificación actualizada exitosamente',
            categoryNotification: updatedCategoryNotification
        });
    } catch (error) {
        console.error('Error al actualizar categoría de notificación:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'categoría de notificación');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al actualizar categoría de notificación',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/category-notifications/:id/anular
 * @description Anula una categoría de notificación (establece isActive a false)
 * @access Private (Requiere JWT - Solo admin)
 */
categoryNotificationCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        const categoryNotification = await CategoryNotification.findById(id);

        if (!categoryNotification) {
            return res.status(404).json({
                message: 'Categoría de notificación no encontrada'
            });
        }

        if (categoryNotification.isActive === false) {
            return res.status(400).json({
                message: 'La categoría de notificación ya está anulada'
            });
        }

        const updatedCategoryNotification = await CategoryNotification.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Categoría de notificación anulada exitosamente',
            categoryNotification: updatedCategoryNotification
        });
    } catch (error) {
        console.error('Error al anular categoría de notificación:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al anular categoría de notificación',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/category-notifications/:id/activate
 * @description Activa una categoría de notificación (establece isActive a true)
 * @access Private (Requiere JWT - Solo admin)
 */
categoryNotificationCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        const categoryNotification = await CategoryNotification.findById(id);

        if (!categoryNotification) {
            return res.status(404).json({
                message: 'Categoría de notificación no encontrada'
            });
        }

        if (categoryNotification.isActive === true) {
            return res.status(400).json({
                message: 'La categoría de notificación ya está activada'
            });
        }

        const updatedCategoryNotification = await CategoryNotification.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Categoría de notificación activada exitosamente',
            categoryNotification: updatedCategoryNotification
        });
    } catch (error) {
        console.error('Error al activar categoría de notificación:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al activar categoría de notificación',
            error: error.message
        });
    }
};

module.exports = categoryNotificationCtrl;

