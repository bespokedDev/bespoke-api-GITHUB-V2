// controllers/professorBonus.controller.js
const ProfessorBonus = require('../models/ProfessorBonus');
const Professor = require('../models/Professor');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');
const moment = require('moment');

const professorBonusCtrl = {};

/**
 * @route POST /api/professor-bonuses
 * @description Crea un nuevo bono para un profesor
 * @access Private (Requiere JWT)
 */
professorBonusCtrl.create = async (req, res) => {
    try {
        const { professorId, amount, description, bonusDate, month } = req.body;

        // Validar professorId
        if (!professorId || !mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'ID de profesor inválido o no proporcionado.' });
        }
        const professorExists = await Professor.findById(professorId);
        if (!professorExists) {
            return res.status(404).json({ message: 'Profesor no encontrado con el ID proporcionado.' });
        }

        // Validar amount
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'El monto del bono debe ser un número positivo.' });
        }

        // Validar y formatear month (YYYY-MM)
        let formattedMonth = month;
        if (!formattedMonth) {
            // Si no se proporciona, usar el mes actual
            formattedMonth = moment().format('YYYY-MM');
        } else if (!String(formattedMonth).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'El formato del mes debe ser YYYY-MM (ej. "2025-01").' });
        }

        // Validar y formatear bonusDate
        let formattedBonusDate = bonusDate;
        if (!formattedBonusDate) {
            formattedBonusDate = new Date();
        } else if (typeof formattedBonusDate === 'string') {
            formattedBonusDate = new Date(formattedBonusDate);
        }

        // Obtener userId del token (si está disponible)
        const userId = req.user?.id || null;

        // Crear el nuevo bono
        const newBonus = new ProfessorBonus({
            professorId,
            amount,
            description: description || null,
            bonusDate: formattedBonusDate,
            month: formattedMonth,
            userId,
            status: 1 // Activo por defecto
        });

        const savedBonus = await newBonus.save();

        // Popular los datos referenciados para la respuesta
        const populatedBonus = await ProfessorBonus.findById(savedBonus._id)
            .populate('professorId', 'name ciNumber email')
            .populate('userId', 'name email role')
            .lean();

        res.status(201).json({
            message: 'Bono de profesor creado exitosamente',
            bonus: populatedBonus
        });

    } catch (error) {
        console.error('Error al crear bono de profesor:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'bono de profesor');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Datos de bono inválidos', errors });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Formato de ID inválido en la solicitud.' });
        }

        res.status(500).json({ message: 'Error interno al crear bono de profesor', error: error.message });
    }
};

/**
 * @route GET /api/professor-bonuses
 * @description Lista todos los bonos de profesores
 * @access Private (Requiere JWT)
 */
professorBonusCtrl.list = async (req, res) => {
    try {
        const { professorId, month, status } = req.query;
        const filter = {};

        if (professorId) {
            if (!mongoose.Types.ObjectId.isValid(professorId)) {
                return res.status(400).json({ message: 'ID de profesor inválido.' });
            }
            filter.professorId = professorId;
        }

        if (month) {
            if (!String(month).match(/^\d{4}-\d{2}$/)) {
                return res.status(400).json({ message: 'El formato del mes debe ser YYYY-MM (ej. "2025-01").' });
            }
            filter.month = month;
        }

        if (status !== undefined) {
            const statusNum = parseInt(status);
            if (statusNum !== 1 && statusNum !== 2) {
                return res.status(400).json({ message: 'El estado debe ser 1 (activo) o 2 (anulado).' });
            }
            filter.status = statusNum;
        }

        const bonuses = await ProfessorBonus.find(filter)
            .populate('professorId', 'name ciNumber email')
            .populate('userId', 'name email role')
            .sort({ bonusDate: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            message: 'Bonos de profesores obtenidos exitosamente',
            bonuses,
            total: bonuses.length
        });
    } catch (error) {
        console.error('Error al listar bonos de profesores:', error);
        res.status(500).json({ message: 'Error interno al listar bonos de profesores', error: error.message });
    }
};

/**
 * @route GET /api/professor-bonuses/:id
 * @description Obtiene un bono por su ID
 * @access Private (Requiere JWT)
 */
professorBonusCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de bono inválido.' });
        }

        const bonus = await ProfessorBonus.findById(id)
            .populate('professorId', 'name ciNumber email')
            .populate('userId', 'name email role')
            .lean();

        if (!bonus) {
            return res.status(404).json({ message: 'Bono no encontrado.' });
        }

        res.status(200).json({
            message: 'Bono obtenido exitosamente',
            bonus
        });
    } catch (error) {
        console.error('Error al obtener bono por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de bono inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener bono', error: error.message });
    }
};

/**
 * @route GET /api/professor-bonuses/professor/:professorId
 * @description Obtiene todos los bonos de un profesor específico
 * @access Private (Requiere JWT)
 */
professorBonusCtrl.getBonusesByProfessorId = async (req, res) => {
    try {
        const { professorId } = req.params;
        const { month, status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'ID de profesor inválido.' });
        }

        const filter = { professorId };

        if (month) {
            if (!String(month).match(/^\d{4}-\d{2}$/)) {
                return res.status(400).json({ message: 'El formato del mes debe ser YYYY-MM (ej. "2025-01").' });
            }
            filter.month = month;
        }

        if (status !== undefined) {
            const statusNum = parseInt(status);
            if (statusNum !== 1 && statusNum !== 2) {
                return res.status(400).json({ message: 'El estado debe ser 1 (activo) o 2 (anulado).' });
            }
            filter.status = statusNum;
        }

        const bonuses = await ProfessorBonus.find(filter)
            .populate('professorId', 'name ciNumber email')
            .populate('userId', 'name email role')
            .sort({ bonusDate: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            message: 'Bonos del profesor obtenidos exitosamente',
            bonuses,
            total: bonuses.length
        });
    } catch (error) {
        console.error('Error al obtener bonos por ID de profesor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de profesor inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener bonos por profesor', error: error.message });
    }
};

/**
 * @route PUT /api/professor-bonuses/:id
 * @description Actualiza un bono de profesor
 * @access Private (Requiere JWT)
 */
professorBonusCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, bonusDate, month, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de bono inválido.' });
        }

        const bonus = await ProfessorBonus.findById(id);
        if (!bonus) {
            return res.status(404).json({ message: 'Bono no encontrado.' });
        }

        // Actualizar campos si se proporcionan
        if (amount !== undefined) {
            if (typeof amount !== 'number' || amount <= 0) {
                return res.status(400).json({ message: 'El monto del bono debe ser un número positivo.' });
            }
            bonus.amount = amount;
        }

        if (description !== undefined) {
            bonus.description = description || null;
        }

        if (bonusDate !== undefined) {
            bonus.bonusDate = typeof bonusDate === 'string' ? new Date(bonusDate) : bonusDate;
        }

        if (month !== undefined) {
            if (!String(month).match(/^\d{4}-\d{2}$/)) {
                return res.status(400).json({ message: 'El formato del mes debe ser YYYY-MM (ej. "2025-01").' });
            }
            bonus.month = month;
        }

        if (status !== undefined) {
            const statusNum = parseInt(status);
            if (statusNum !== 1 && statusNum !== 2) {
                return res.status(400).json({ message: 'El estado debe ser 1 (activo) o 2 (anulado).' });
            }
            bonus.status = statusNum;
        }

        const updatedBonus = await bonus.save();

        // Popular los datos referenciados para la respuesta
        const populatedBonus = await ProfessorBonus.findById(updatedBonus._id)
            .populate('professorId', 'name ciNumber email')
            .populate('userId', 'name email role')
            .lean();

        res.status(200).json({
            message: 'Bono actualizado exitosamente',
            bonus: populatedBonus
        });
    } catch (error) {
        console.error('Error al actualizar bono:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Datos de bono inválidos', errors });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Formato de ID inválido en la solicitud.' });
        }
        res.status(500).json({ message: 'Error interno al actualizar bono', error: error.message });
    }
};

/**
 * @route DELETE /api/professor-bonuses/:id
 * @description Elimina un bono de profesor (anula cambiando status a 2)
 * @access Private (Requiere JWT)
 */
professorBonusCtrl.remove = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de bono inválido.' });
        }

        const bonus = await ProfessorBonus.findById(id);
        if (!bonus) {
            return res.status(404).json({ message: 'Bono no encontrado.' });
        }

        // Anular el bono en lugar de eliminarlo físicamente
        bonus.status = 2;
        await bonus.save();

        res.status(200).json({ message: 'Bono anulado exitosamente.' });
    } catch (error) {
        console.error('Error al anular bono:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de bono inválido.' });
        }
        res.status(500).json({ message: 'Error interno al anular bono', error: error.message });
    }
};

module.exports = professorBonusCtrl;

