// controllers/paymentMethods.controller.js
const PaymentMethod = require('../models/PaymentMethod'); // Importa el modelo PaymentMethod
const utilsFunctions = require('../utils/utilsFunctions'); // Asumo que tienes esta utilidad
const mongoose = require('mongoose'); // Necesario para mongoose.Types.ObjectId.isValid

const paymentMethodCtrl = {};

/**
 * @route POST /api/payment-methods
 * @description Crea un nuevo método de pago
 * @access Private (Requiere JWT)
 */
paymentMethodCtrl.create = async (req, res) => {
    try {
        const { name, type, description } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del método de pago es requerido.' });
        }

        const newPaymentMethod = new PaymentMethod({ name, type, description });
        const savedPaymentMethod = await newPaymentMethod.save();

        // Agregar información de status legible
        const paymentMethodWithStatus = {
            ...savedPaymentMethod.toObject(),
            statusText: savedPaymentMethod.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Método de pago creado exitosamente',
            paymentMethod: paymentMethodWithStatus
        });

    } catch (error) {
        console.error('Error al crear método de pago:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del método de pago');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear método de pago', error: error.message });
    }
};

/**
 * @route GET /api/payment-methods
 * @description Lista todos los métodos de pago
 * @access Private (Requiere JWT)
 */
paymentMethodCtrl.list = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find().lean(); // .lean() para objetos JS simples

        // Agregar información de status legible
        const paymentMethodsWithStatus = paymentMethods.map(method => ({
            ...method,
            statusText: method.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(paymentMethodsWithStatus);
    } catch (error) {
        console.error('Error al listar métodos de pago:', error);
        res.status(500).json({ message: 'Error interno al listar métodos de pago', error: error.message });
    }
};

/**
 * @route GET /api/payment-methods/:id
 * @description Obtiene un método de pago por su ID
 * @access Private (Requiere JWT)
 */
paymentMethodCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }

        const paymentMethod = await PaymentMethod.findById(id).lean();

        if (!paymentMethod) {
            return res.status(404).json({ message: 'Método de pago no encontrado.' });
        }

        // Agregar información de status legible
        const paymentMethodWithStatus = {
            ...paymentMethod,
            statusText: paymentMethod.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(paymentMethodWithStatus);
    } catch (error) {
        console.error('Error al obtener método de pago por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener método de pago', error: error.message });
    }
};

/**
 * @route PUT /api/payment-methods/:id
 * @description Actualiza los datos de un método de pago por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
paymentMethodCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }

        // Al menos un campo debe ser proporcionado para la actualización
        if (!name && !type && !description) {
            return res.status(400).json({ message: 'Se requiere al menos un campo (name, type, description) para actualizar el método de pago.' });
        }
        
        // Crear un objeto con solo los campos presentes en req.body
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (type !== undefined) updateFields.type = type;
        if (description !== undefined) updateFields.description = description;

        // Validar que el nombre no esté vacío si se proporciona
        if (updateFields.name !== undefined && (typeof updateFields.name !== 'string' || updateFields.name.trim() === '')) {
            return res.status(400).json({ message: 'El nombre del método de pago no puede estar vacío.' });
        }

        const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).lean();

        if (!updatedPaymentMethod) {
            return res.status(404).json({ message: 'Método de pago no encontrado para actualizar.' });
        }

        // Agregar información de status legible
        const paymentMethodWithStatus = {
            ...updatedPaymentMethod,
            statusText: updatedPaymentMethod.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Método de pago actualizado exitosamente',
            paymentMethod: paymentMethodWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar método de pago:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del método de pago');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar método de pago', error: error.message });
    }
};

/**
 * @route PATCH /api/payment-methods/:id/activate
 * @description Activa un método de pago (cambia status a 1)
 * @access Private (Requiere JWT)
 */
paymentMethodCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }

        const paymentMethod = await PaymentMethod.findById(id);
        
        if (!paymentMethod) {
            return res.status(404).json({ message: 'Método de pago no encontrado.' });
        }

        // Verificar si ya está activo
        if (paymentMethod.status === 1) {
            return res.status(400).json({ message: 'El método de pago ya está activo.' });
        }

        const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
            id, 
            { status: 1 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Método de pago activado exitosamente',
            paymentMethod: {
                ...updatedPaymentMethod,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar método de pago:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar método de pago', error: error.message });
    }
};

/**
 * @route PATCH /api/payment-methods/:id/deactivate
 * @description Desactiva un método de pago (cambia status a 2)
 * @access Private (Requiere JWT)
 */
paymentMethodCtrl.deactivate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }

        const paymentMethod = await PaymentMethod.findById(id);
        
        if (!paymentMethod) {
            return res.status(404).json({ message: 'Método de pago no encontrado.' });
        }

        // Verificar si ya está desactivado
        if (paymentMethod.status === 2) {
            return res.status(400).json({ message: 'El método de pago ya está desactivado.' });
        }

        const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
            id, 
            { status: 2 }, 
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({
            message: 'Método de pago desactivado exitosamente',
            paymentMethod: {
                ...updatedPaymentMethod,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al desactivar método de pago:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al desactivar método de pago', error: error.message });
    }
};

/**
 * @route DELETE /api/payment-methods/:id
 * @description Elimina un método de pago por su ID
 * @access Private (Requiere JWT)
 */
paymentMethodCtrl.remove = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }

        // *** IMPORTANTE: Considera verificar si este método de pago está en uso ***
        // Dado que este modelo se refiere en otras colecciones (como Income),
        // eliminar un método de pago en uso puede causar problemas de integridad referencial.
        // Ejemplo de verificación (requeriría importar el modelo Income aquí):
        // const Income = require('../models/Income');
        // const incomeUsingPaymentMethod = await Income.findOne({ idPaymentMethod: id });
        // if (incomeUsingPaymentMethod) {
        //     return res.status(409).json({ message: 'No se puede eliminar este método de pago porque está siendo utilizado en registros de ingresos.' });
        // }
        // También verifica en cualquier otro modelo que lo use.

        const deletedPaymentMethod = await PaymentMethod.findByIdAndDelete(id);

        if (!deletedPaymentMethod) {
            return res.status(404).json({ message: 'Método de pago no encontrado para eliminar.' });
        }

        res.status(200).json({ message: 'Método de pago eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar método de pago:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de método de pago inválido.' });
        }
        res.status(500).json({ message: 'Error interno al eliminar método de pago', error: error.message });
    }
};

module.exports = paymentMethodCtrl;