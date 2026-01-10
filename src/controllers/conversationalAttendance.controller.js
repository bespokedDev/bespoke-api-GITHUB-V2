// controllers/conversationalAttendance.controller.js
const ConversationalAttendance = require('../models/ConversationalAttendance');
const Enrollment = require('../models/Enrollment');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const conversationalAttendanceCtrl = {};

/**
 * @route POST /api/conversational-attendance
 * @description Crea un nuevo conversational attendance
 * @access Private (Requiere JWT)
 */
conversationalAttendanceCtrl.create = async (req, res) => {
    try {
        const { description, idEnrollment } = req.body;

        // Validaciones básicas
        if (!description || typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ message: 'La descripción es requerida y debe ser un string no vacío.' });
        }

        if (!idEnrollment) {
            return res.status(400).json({ message: 'El campo idEnrollment es requerido.' });
        }

        // Validar que idEnrollment sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(idEnrollment)) {
            return res.status(400).json({ message: 'ID de enrollment inválido.' });
        }

        // Validar que el enrollment exista
        const enrollment = await Enrollment.findById(idEnrollment);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment no encontrado.' });
        }

        const newConversationalAttendance = new ConversationalAttendance({
            description: description.trim(),
            idEnrollment: idEnrollment
        });

        const savedConversationalAttendance = await newConversationalAttendance.save();

        // Popular el enrollment en la respuesta
        const populatedConversationalAttendance = await ConversationalAttendance.findById(savedConversationalAttendance._id)
            .populate('idEnrollment', 'alias enrollmentType language startDate endDate status')
            .lean();

        // Agregar información de status legible
        const conversationalAttendanceWithStatus = {
            ...populatedConversationalAttendance,
            statusText: populatedConversationalAttendance.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(201).json({
            message: 'Conversational attendance creado exitosamente',
            conversationalAttendance: conversationalAttendanceWithStatus
        });

    } catch (error) {
        console.error('Error al crear conversational attendance:', error);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear conversational attendance', error: error.message });
    }
};

/**
 * @route GET /api/conversational-attendance
 * @description Lista todos los conversational attendance
 * @access Private (Requiere JWT)
 */
conversationalAttendanceCtrl.list = async (req, res) => {
    try {
        const conversationalAttendances = await ConversationalAttendance.find()
            .populate('idEnrollment', 'alias enrollmentType language startDate endDate status')
            .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente (más recientes primero)
            .lean();

        // Agregar información de status legible
        const conversationalAttendancesWithStatus = conversationalAttendances.map(attendance => ({
            ...attendance,
            statusText: attendance.status === 1 ? 'Activo' : 'Anulado'
        }));

        res.status(200).json(conversationalAttendancesWithStatus);
    } catch (error) {
        console.error('Error al listar conversational attendance:', error);
        res.status(500).json({ message: 'Error interno al listar conversational attendance', error: error.message });
    }
};

/**
 * @route GET /api/conversational-attendance/:id
 * @description Obtiene un conversational attendance por su ID
 * @access Private (Requiere JWT)
 */
conversationalAttendanceCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }

        const conversationalAttendance = await ConversationalAttendance.findById(id)
            .populate('idEnrollment', 'alias enrollmentType language startDate endDate status')
            .lean();

        if (!conversationalAttendance) {
            return res.status(404).json({ message: 'Conversational attendance no encontrado.' });
        }

        // Agregar información de status legible
        const conversationalAttendanceWithStatus = {
            ...conversationalAttendance,
            statusText: conversationalAttendance.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json(conversationalAttendanceWithStatus);
    } catch (error) {
        console.error('Error al obtener conversational attendance por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener conversational attendance', error: error.message });
    }
};

/**
 * @route PUT /api/conversational-attendance/:id
 * @description Actualiza los datos de un conversational attendance por su ID (sin cambiar status)
 * @access Private (Requiere JWT)
 */
conversationalAttendanceCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, idEnrollment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }

        // Validar que se proporcione al menos un campo para actualizar
        if (!description && !idEnrollment) {
            return res.status(400).json({ message: 'Se requiere al menos un campo (description o idEnrollment) para actualizar el conversational attendance.' });
        }

        const updateFields = {};

        // Validar y agregar description si se proporciona
        if (description !== undefined) {
            if (typeof description !== 'string' || description.trim() === '') {
                return res.status(400).json({ message: 'La descripción no puede estar vacía.' });
            }
            updateFields.description = description.trim();
        }

        // Validar y agregar idEnrollment si se proporciona
        if (idEnrollment !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(idEnrollment)) {
                return res.status(400).json({ message: 'ID de enrollment inválido.' });
            }

            // Validar que el enrollment exista
            const enrollment = await Enrollment.findById(idEnrollment);
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment no encontrado.' });
            }

            updateFields.idEnrollment = idEnrollment;
        }

        const updatedConversationalAttendance = await ConversationalAttendance.findByIdAndUpdate(
            id, 
            updateFields, 
            { new: true, runValidators: true }
        )
        .populate('idEnrollment', 'alias enrollmentType language startDate endDate status')
        .lean();

        if (!updatedConversationalAttendance) {
            return res.status(404).json({ message: 'Conversational attendance no encontrado para actualizar.' });
        }

        // Agregar información de status legible
        const conversationalAttendanceWithStatus = {
            ...updatedConversationalAttendance,
            statusText: updatedConversationalAttendance.status === 1 ? 'Activo' : 'Anulado'
        };

        res.status(200).json({
            message: 'Conversational attendance actualizado exitosamente',
            conversationalAttendance: conversationalAttendanceWithStatus
        });

    } catch (error) {
        console.error('Error al actualizar conversational attendance:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar conversational attendance', error: error.message });
    }
};

/**
 * @route PATCH /api/conversational-attendance/:id/activate
 * @description Activa un conversational attendance (cambia status a 1)
 * @access Private (Requiere JWT)
 */
conversationalAttendanceCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }

        const conversationalAttendance = await ConversationalAttendance.findById(id);

        if (!conversationalAttendance) {
            return res.status(404).json({ message: 'Conversational attendance no encontrado.' });
        }

        // Verificar si ya está activo
        if (conversationalAttendance.status === 1) {
            return res.status(400).json({ message: 'El conversational attendance ya está activo.' });
        }

        const updatedConversationalAttendance = await ConversationalAttendance.findByIdAndUpdate(
            id,
            { status: 1 },
            { new: true, runValidators: true }
        )
        .populate('idEnrollment', 'alias enrollmentType language startDate endDate status')
        .lean();

        res.status(200).json({
            message: 'Conversational attendance activado exitosamente',
            conversationalAttendance: {
                ...updatedConversationalAttendance,
                statusText: 'Activo'
            }
        });

    } catch (error) {
        console.error('Error al activar conversational attendance:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al activar conversational attendance', error: error.message });
    }
};

/**
 * @route PATCH /api/conversational-attendance/:id/anular
 * @description Anula un conversational attendance (cambia status a 2)
 * @access Private (Requiere JWT)
 */
conversationalAttendanceCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }

        const conversationalAttendance = await ConversationalAttendance.findById(id);

        if (!conversationalAttendance) {
            return res.status(404).json({ message: 'Conversational attendance no encontrado.' });
        }

        // Verificar si ya está anulado
        if (conversationalAttendance.status === 2) {
            return res.status(400).json({ message: 'El conversational attendance ya está anulado.' });
        }

        const updatedConversationalAttendance = await ConversationalAttendance.findByIdAndUpdate(
            id,
            { status: 2 },
            { new: true, runValidators: true }
        )
        .populate('idEnrollment', 'alias enrollmentType language startDate endDate status')
        .lean();

        res.status(200).json({
            message: 'Conversational attendance anulado exitosamente',
            conversationalAttendance: {
                ...updatedConversationalAttendance,
                statusText: 'Anulado'
            }
        });

    } catch (error) {
        console.error('Error al anular conversational attendance:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de conversational attendance inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al anular conversational attendance', error: error.message });
    }
};

module.exports = conversationalAttendanceCtrl;
