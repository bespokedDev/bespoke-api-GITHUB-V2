// controllers/bonus.controller.js
const Bonus = require('../models/Bonus');
const Professor = require('../models/Professor'); // Necesitamos este modelo para validar idProfessor
const Payout = require('../models/Payout');     // Necesitamos este modelo para validar idPayout (si existe)
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');

const utilsFunctions = require('../utils/utilsFunctions'); // Asumo que tienes esta utilidad
const mongoose = require('mongoose');

const bonusCtrl = {};

/**
 * @route POST /api/bonuses
 * @description Crea un nuevo registro de abono
 * @access Private (Requiere JWT)
 */
bonusCtrl.create = async (req, res) => {
    try {
        const { amount, reason, idPayout, idProfessor } = req.body;

        // 1. Validar idProfessor
        if (!idProfessor || !mongoose.Types.ObjectId.isValid(idProfessor)) {
            return res.status(400).json({ message: 'ID de profesor inválido o no proporcionado.' });
        }
        const professorExists = await Professor.findById(idProfessor);
        if (!professorExists) {
            return res.status(404).json({ message: 'Profesor no encontrado con el ID proporcionado.' });
        }

        // 2. Validar idPayout (si se proporciona)
        if (idPayout) {
            if (!mongoose.Types.ObjectId.isValid(idPayout)) {
                return res.status(400).json({ message: 'ID de pago (Payout) inválido.' });
            }
            const payoutExists = await Payout.findById(idPayout);
            if (!payoutExists) {
                return res.status(404).json({ message: 'Pago (Payout) no encontrado con el ID proporcionado.' });
            }
        }

        // 3. Crear y guardar el nuevo abono
        const newBonus = new Bonus({
            amount,
            reason,
            idPayout: idPayout || null, // Asegura que sea null si no se envía
            idProfessor
        });

        const savedBonus = await newBonus.save();

        // 4. Crear notificación para el profesor
        try {
            // Obtener o crear categoría de notificación "Administrativa"
            const categoryNotificationId = '6941c9b30646c9359c7f9f68';
            if (!mongoose.Types.ObjectId.isValid(categoryNotificationId)) {
                throw new Error('ID de categoría de notificación inválido');
            }

            let categoryNotification = await CategoryNotification.findById(categoryNotificationId);
            if (!categoryNotification) {
                categoryNotification = new CategoryNotification({
                    _id: new mongoose.Types.ObjectId(categoryNotificationId),
                    category_notification_description: 'Administrativa',
                    isActive: true
                });
                await categoryNotification.save();
            }

            // Construir descripción de la notificación
            let notificationDescription = `Se ha generado un bono de $${parseFloat(amount).toFixed(2)} para el profesor.`;
            if (reason && reason.trim() !== '') {
                notificationDescription += ` Razón: ${reason.trim()}.`;
            }

            // Crear notificación
            const newNotification = new Notification({
                idCategoryNotification: categoryNotification._id,
                notification_description: notificationDescription,
                idPenalization: null,
                idEnrollment: null,
                idProfessor: new mongoose.Types.ObjectId(idProfessor),
                idStudent: [],
                userId: null,
                isActive: true
            });

            await newNotification.save();
            console.log(`[BONUS] Notificación creada para profesor ${idProfessor} por bono de $${parseFloat(amount).toFixed(2)}`);
        } catch (notificationError) {
            // No fallar la creación del bonus si falla la notificación
            console.error(`[BONUS] Error creando notificación para profesor ${idProfessor}:`, notificationError.message);
            // Continuar con el proceso, el bonus ya se guardó
        }

        // 5. Popular los datos referenciados para la respuesta
        const populatedBonus = await Bonus.findById(savedBonus._id)
                                          .populate('idProfessor', 'name ciNumber email') // Popula campos relevantes del profesor
                                          .populate('idPayout', 'month total')       // Popula campos relevantes del pago (si aplica)
                                          .lean(); // Convertir a POJO para la respuesta

        res.status(201).json({
            message: 'Abono creado exitosamente',
            bonus: populatedBonus
        });

    } catch (error) {
        console.error('Error al crear abono:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'abono');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'ValidationError') {
            // Mongoose Validation Error (ej. 'amount' no es un número)
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Datos de abono inválidos', errors });
        }
        if (error.name === 'CastError') {
            // Error de casteo de ObjectID (ej. ID de profesor mal formado)
            return res.status(400).json({ message: 'Formato de ID inválido en la solicitud.' });
        }

        res.status(500).json({ message: 'Error interno al crear abono', error: error.message });
    }
};

/**
 * @route GET /api/bonuses
 * @description Lista todos los abonos con sus datos referenciados
 * @access Private (Requiere JWT)
 */
bonusCtrl.list = async (req, res) => {
    try {
        const bonuses = await Bonus.find()
                                   .populate('idProfessor', 'name ciNumber email')
                                   .populate('idPayout', 'month total')
                                   .lean(); // Convertir a POJO para la respuesta

        res.status(200).json(bonuses);
    } catch (error) {
        console.error('Error al listar abonos:', error);
        res.status(500).json({ message: 'Error interno al listar abonos', error: error.message });
    }
};

/**
 * @route GET /api/bonuses/:id
 * @description Obtiene un abono por su ID con sus datos referenciados
 * @access Private (Requiere JWT)
 */
bonusCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de abono inválido.' });
        }

        const bonus = await Bonus.findById(id)
                                 .populate('idProfessor', 'name ciNumber email')
                                 .populate('idPayout', 'month total')
                                 .lean(); // Convertir a POJO para la respuesta

        if (!bonus) {
            return res.status(404).json({ message: 'Abono no encontrado.' });
        }

        res.status(200).json(bonus);
    } catch (error) {
        console.error('Error al obtener abono por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de abono inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener abono', error: error.message });
    }
};

/**
 * @route GET /api/bonuses/professor/:idProfessor
 * @description Obtiene todos los abonos asociados a un profesor específico
 * @access Private (Requiere JWT)
 */
bonusCtrl.getBonusesByProfessorId = async (req, res) => {
    try {
        const { idProfessor } = req.params;

        if (!mongoose.Types.ObjectId.isValid(idProfessor)) {
            return res.status(400).json({ message: 'ID de profesor inválido.' });
        }

        const bonuses = await Bonus.find({ idProfessor: idProfessor })
                                   .populate('idProfessor', 'name ciNumber email')
                                   .populate('idPayout', 'month total')
                                   .lean();

        if (!bonuses || bonuses.length === 0) {
            return res.status(404).json({ message: 'No se encontraron abonos para este profesor.' });
        }

        res.status(200).json(bonuses);
    } catch (error) {
        console.error('Error al obtener abonos por ID de profesor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de profesor inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener abonos por profesor', error: error.message });
    }
};


/**
 * @route DELETE /api/bonuses/:id
 * @description Elimina un registro de abono por su ID
 * @access Private (Requiere JWT)
 */
bonusCtrl.remove = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de abono inválido.' });
        }

        const deletedBonus = await Bonus.findByIdAndDelete(id);

        if (!deletedBonus) {
            return res.status(404).json({ message: 'Abono no encontrado para eliminar.' });
        }

        res.status(200).json({ message: 'Abono eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar abono:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de abono inválido.' });
        }
        res.status(500).json({ message: 'Error interno al eliminar abono', error: error.message });
    }
};

module.exports = bonusCtrl;