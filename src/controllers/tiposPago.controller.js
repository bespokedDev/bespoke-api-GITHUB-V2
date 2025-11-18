// controllers/tiposPago.controller.js
const TipoPago = require('../models/TipoPago');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const tipoPagoCtrl = {};

/**
 * @route POST /api/payment-types
 * @description Crea un nuevo tipo de pago
 * @access Private (Requiere JWT)
 */
tipoPagoCtrl.create = async (req, res) => {
    try {
        const { name } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del tipo de pago es requerido.' });
        }

        const newTipoPago = new TipoPago({ name });
        const savedTipoPago = await newTipoPago.save();

        // Agregar información de status legible
        const tipoPagoWithStatus = {
            ...savedTipoPago.toObject(),
            statusText: savedTipoPago.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Tipo de pago creado exitosamente',
            paymentType: tipoPagoWithStatus
        });

    } catch (error) {
        console.error('Error al crear tipo de pago:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del tipo de pago');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear tipo de pago', error: error.message });
    }
};

/**
 * @route GET /api/payment-types
 * @description Lista todos los tipos de pago
 * @access Private (Requiere JWT)
 */
tipoPagoCtrl.list = async (req, res) => {
    try {
        const tiposPago = await TipoPago.find().lean();

        // Agregar información de status legible
        const tiposPagoWithStatus = tiposPago.map(tipo => ({
            ...tipo,
            statusText: tipo.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(tiposPagoWithStatus);
    } catch (error) {
        console.error('Error al listar tipos de pago:', error);
        res.status(500).json({ message: 'Error interno al listar tipos de pago', error: error.message });
    }
};

/**
 * @route GET /api/payment-types/:id
 * @description Obtiene un tipo de pago por su ID
 * @access Private (Requiere JWT)
 */
tipoPagoCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }

        const tipoPago = await TipoPago.findById(id).lean();

        if (!tipoPago) {
            return res.status(404).json({ message: 'Tipo de pago no encontrado.' });
        }

        // Agregar información de status legible
        const tipoPagoWithStatus = {
            ...tipoPago,
            statusText: tipoPago.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(tipoPagoWithStatus);
    } catch (error) {
        console.error('Error al obtener tipo de pago por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener tipo de pago', error: error.message });
    }
};

/**
 * @route PUT /api/payment-types/:id
 * @description Actualiza los datos de un tipo de pago por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
tipoPagoCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }

        // Validar que se proporcione al menos un campo
        if (!name) {
            return res.status(400).json({ message: 'Se requiere el campo name para actualizar el tipo de pago.' });
        }

        // Validar que el nombre no esté vacío
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del tipo de pago no puede estar vacío.' });
        }

        const updateFields = { name: name.trim() };

        const updatedTipoPago = await TipoPago.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedTipoPago) {
            return res.status(404).json({ message: 'Tipo de pago no encontrado para actualizar.' });
        }

        // Agregar información de status legible
        const tipoPagoWithStatus = {
            ...updatedTipoPago,
            statusText: updatedTipoPago.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Tipo de pago actualizado exitosamente',
            paymentType: tipoPagoWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar tipo de pago:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del tipo de pago');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar tipo de pago', error: error.message });
    }
};

/**
 * @route PATCH /api/payment-types/:id/activate
 * @description Activa un tipo de pago (cambia status a 1)
 * @access Private (Requiere JWT)
 */
tipoPagoCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }

        const tipoPago = await TipoPago.findById(id);
        
        if (!tipoPago) {
            return res.status(404).json({ message: 'Tipo de pago no encontrado.' });
        }

        // Verificar si ya está activo
        if (tipoPago.status === 1) {
            return res.status(400).json({ message: 'El tipo de pago ya está activo.' });
        }

        const updatedTipoPago = await TipoPago.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Tipo de pago activado exitosamente',
            paymentType: {
                ...updatedTipoPago,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar tipo de pago:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar tipo de pago', error: error.message });
    }
};

/**
 * @route PATCH /api/payment-types/:id/anular
 * @description Anula un tipo de pago (cambia status a 2)
 * @access Private (Requiere JWT)
 */
tipoPagoCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }

        const tipoPago = await TipoPago.findById(id);
        
        if (!tipoPago) {
            return res.status(404).json({ message: 'Tipo de pago no encontrado.' });
        }

        // Verificar si ya está anulado
        if (tipoPago.status === 2) {
            return res.status(400).json({ message: 'El tipo de pago ya está anulado.' });
        }

        const updatedTipoPago = await TipoPago.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Tipo de pago anulado exitosamente',
            paymentType: {
                ...updatedTipoPago,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular tipo de pago:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de pago inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular tipo de pago', error: error.message });
    }
};

module.exports = tipoPagoCtrl;

