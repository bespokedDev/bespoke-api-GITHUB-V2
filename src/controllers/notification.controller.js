// controllers/notification.controller.js
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');
const Penalizacion = require('../models/Penalizacion');
const Enrollment = require('../models/Enrollment');
const Professor = require('../models/Professor');
const Student = require('../models/Student');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const notificationCtrl = {};

/**
 * @route POST /api/notifications
 * @description Crea una nueva notificación
 * @access Private (Requiere JWT - Solo admin)
 */
notificationCtrl.create = async (req, res) => {
    try {
        const { idCategoryNotification, notification_description, idPenalization, idEnrollment, idProfessor, idStudent } = req.body;

        // Validar campos requeridos
        if (!idCategoryNotification || !notification_description) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                required: ['idCategoryNotification', 'notification_description'],
                received: Object.keys(req.body)
            });
        }

        // Validar que notification_description sea un string no vacío
        if (typeof notification_description !== 'string' || notification_description.trim() === '') {
            return res.status(400).json({
                message: 'El campo notification_description debe ser un string no vacío'
            });
        }

        // Validar que idCategoryNotification sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(idCategoryNotification)) {
            return res.status(400).json({
                message: 'ID de categoría de notificación inválido'
            });
        }

        // Validar que la categoría de notificación existe
        const categoryNotification = await CategoryNotification.findById(idCategoryNotification);
        if (!categoryNotification) {
            return res.status(404).json({
                message: 'Categoría de notificación no encontrada'
            });
        }

        // Validar idPenalization si se proporciona
        if (idPenalization !== undefined && idPenalization !== null) {
            if (!mongoose.Types.ObjectId.isValid(idPenalization)) {
                return res.status(400).json({
                    message: 'ID de penalización inválido'
                });
            }
            const penalization = await Penalizacion.findById(idPenalization);
            if (!penalization) {
                return res.status(404).json({
                    message: 'Penalización no encontrada'
                });
            }
        }

        // Validar idEnrollment si se proporciona
        if (idEnrollment !== undefined && idEnrollment !== null) {
            if (!mongoose.Types.ObjectId.isValid(idEnrollment)) {
                return res.status(400).json({
                    message: 'ID de enrollment inválido'
                });
            }
            const enrollment = await Enrollment.findById(idEnrollment);
            if (!enrollment) {
                return res.status(404).json({
                    message: 'Enrollment no encontrado'
                });
            }
        }

        // Validar idProfessor si se proporciona
        if (idProfessor !== undefined && idProfessor !== null) {
            if (!mongoose.Types.ObjectId.isValid(idProfessor)) {
                return res.status(400).json({
                    message: 'ID de profesor inválido'
                });
            }
            const professor = await Professor.findById(idProfessor);
            if (!professor) {
                return res.status(404).json({
                    message: 'Profesor no encontrado'
                });
            }
        }

        // Validar idStudent si se proporciona (ahora es un array)
        let studentIdsArray = [];
        if (idStudent !== undefined && idStudent !== null) {
            // Asegurar que sea un array
            const studentIds = Array.isArray(idStudent) ? idStudent : [idStudent];
            
            // Validar que todos los IDs sean válidos
            for (const studentId of studentIds) {
                if (!mongoose.Types.ObjectId.isValid(studentId)) {
                    return res.status(400).json({
                        message: `ID de estudiante inválido: ${studentId}`
                    });
                }
                // Validar que el estudiante existe
                const student = await Student.findById(studentId);
                if (!student) {
                    return res.status(404).json({
                        message: `Estudiante no encontrado: ${studentId}`
                    });
                }
                studentIdsArray.push(studentId);
            }
        }

        // Crear la nueva notificación
        const newNotification = new Notification({
            idCategoryNotification: idCategoryNotification,
            notification_description: notification_description.trim(),
            idPenalization: idPenalization || null,
            idEnrollment: idEnrollment || null,
            idProfessor: idProfessor || null,
            idStudent: studentIdsArray.length > 0 ? studentIdsArray : [],
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        });

        const savedNotification = await newNotification.save();

        // Popular todas las referencias en la respuesta
        const populatedNotification = await Notification.findById(savedNotification._id)
            .populate('idCategoryNotification', 'category_notification_description')
            .populate('idPenalization', 'name description')
            .populate('idEnrollment', 'alias language enrollmentType')
            .populate('idProfessor', 'name email phone')
            .populate('idStudent', 'name studentCode email')
            .lean();

        res.status(201).json({
            message: 'Notificación creada exitosamente',
            notification: populatedNotification
        });
    } catch (error) {
        console.error('Error al crear notificación:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'notificación');
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
            message: 'Error interno al crear notificación',
            error: error.message
        });
    }
};

/**
 * @route GET /api/notifications
 * @description Lista todas las notificaciones con filtros opcionales
 * @access Private (Requiere JWT - Solo admin)
 */
notificationCtrl.list = async (req, res) => {
    try {
        const { idCategoryNotification, idPenalization, idEnrollment, idProfessor, idStudent, isActive } = req.query;
        const query = {};

        // Filtro por idCategoryNotification
        if (idCategoryNotification) {
            if (!mongoose.Types.ObjectId.isValid(idCategoryNotification)) {
                return res.status(400).json({
                    message: 'ID de categoría de notificación inválido'
                });
            }
            query.idCategoryNotification = idCategoryNotification;
        }

        // Filtro por idPenalization
        if (idPenalization) {
            if (!mongoose.Types.ObjectId.isValid(idPenalization)) {
                return res.status(400).json({
                    message: 'ID de penalización inválido'
                });
            }
            query.idPenalization = idPenalization;
        }

        // Filtro por idEnrollment
        if (idEnrollment) {
            if (!mongoose.Types.ObjectId.isValid(idEnrollment)) {
                return res.status(400).json({
                    message: 'ID de enrollment inválido'
                });
            }
            query.idEnrollment = idEnrollment;
        }

        // Filtro por idProfessor
        if (idProfessor) {
            if (!mongoose.Types.ObjectId.isValid(idProfessor)) {
                return res.status(400).json({
                    message: 'ID de profesor inválido'
                });
            }
            query.idProfessor = idProfessor;
        }

        // Filtro por idStudent (ahora es un array, buscar si contiene el ID)
        if (idStudent) {
            if (!mongoose.Types.ObjectId.isValid(idStudent)) {
                return res.status(400).json({
                    message: 'ID de estudiante inválido'
                });
            }
            query.idStudent = { $in: [mongoose.Types.ObjectId(idStudent)] };
        }

        // Filtro por isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true;
        }

        const notifications = await Notification.find(query)
            .populate('idCategoryNotification', 'category_notification_description')
            .populate('idPenalization', 'name description')
            .populate('idEnrollment', 'alias language enrollmentType')
            .populate('idProfessor', 'name email phone')
            .populate('idStudent', 'name studentCode email')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            message: 'Notificaciones obtenidas exitosamente',
            count: notifications.length,
            notifications: notifications
        });
    } catch (error) {
        console.error('Error al listar notificaciones:', error);
        res.status(500).json({
            message: 'Error interno al listar notificaciones',
            error: error.message
        });
    }
};

/**
 * @route GET /api/notifications/:id
 * @description Obtiene una notificación por su ID
 * @access Private (Requiere JWT - Solo admin)
 */
notificationCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        const notification = await Notification.findById(id)
            .populate('idCategoryNotification', 'category_notification_description')
            .populate('idPenalization', 'name description')
            .populate('idEnrollment', 'alias language enrollmentType')
            .populate('idProfessor', 'name email phone')
            .populate('idStudent', 'name studentCode email')
            .lean();

        if (!notification) {
            return res.status(404).json({
                message: 'Notificación no encontrada'
            });
        }

        res.status(200).json({
            message: 'Notificación obtenida exitosamente',
            notification: notification
        });
    } catch (error) {
        console.error('Error al obtener notificación:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        res.status(500).json({
            message: 'Error interno al obtener notificación',
            error: error.message
        });
    }
};

/**
 * @route PUT /api/notifications/:id
 * @description Actualiza una notificación por su ID
 * @access Private (Requiere JWT - Solo admin)
 */
notificationCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { idCategoryNotification, notification_description, idPenalization, idEnrollment, idProfessor, idStudent, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        const existingNotification = await Notification.findById(id);
        if (!existingNotification) {
            return res.status(404).json({
                message: 'Notificación no encontrada'
            });
        }

        const updateFields = {};

        if (idCategoryNotification !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(idCategoryNotification)) {
                return res.status(400).json({
                    message: 'ID de categoría de notificación inválido'
                });
            }
            const categoryNotification = await CategoryNotification.findById(idCategoryNotification);
            if (!categoryNotification) {
                return res.status(404).json({
                    message: 'Categoría de notificación no encontrada'
                });
            }
            updateFields.idCategoryNotification = idCategoryNotification;
        }

        if (notification_description !== undefined) {
            if (typeof notification_description !== 'string' || notification_description.trim() === '') {
                return res.status(400).json({
                    message: 'El campo notification_description debe ser un string no vacío'
                });
            }
            updateFields.notification_description = notification_description.trim();
        }

        if (idPenalization !== undefined) {
            if (idPenalization === null) {
                updateFields.idPenalization = null;
            } else {
                if (!mongoose.Types.ObjectId.isValid(idPenalization)) {
                    return res.status(400).json({
                        message: 'ID de penalización inválido'
                    });
                }
                const penalization = await Penalizacion.findById(idPenalization);
                if (!penalization) {
                    return res.status(404).json({
                        message: 'Penalización no encontrada'
                    });
                }
                updateFields.idPenalization = idPenalization;
            }
        }

        if (idEnrollment !== undefined) {
            if (idEnrollment === null) {
                updateFields.idEnrollment = null;
            } else {
                if (!mongoose.Types.ObjectId.isValid(idEnrollment)) {
                    return res.status(400).json({
                        message: 'ID de enrollment inválido'
                    });
                }
                const enrollment = await Enrollment.findById(idEnrollment);
                if (!enrollment) {
                    return res.status(404).json({
                        message: 'Enrollment no encontrado'
                    });
                }
                updateFields.idEnrollment = idEnrollment;
            }
        }

        if (idProfessor !== undefined) {
            if (idProfessor === null) {
                updateFields.idProfessor = null;
            } else {
                if (!mongoose.Types.ObjectId.isValid(idProfessor)) {
                    return res.status(400).json({
                        message: 'ID de profesor inválido'
                    });
                }
                const professor = await Professor.findById(idProfessor);
                if (!professor) {
                    return res.status(404).json({
                        message: 'Profesor no encontrado'
                    });
                }
                updateFields.idProfessor = idProfessor;
            }
        }

        if (idStudent !== undefined) {
            if (idStudent === null || (Array.isArray(idStudent) && idStudent.length === 0)) {
                updateFields.idStudent = [];
            } else {
                // Asegurar que sea un array
                const studentIds = Array.isArray(idStudent) ? idStudent : [idStudent];
                const studentIdsArray = [];
                
                // Validar que todos los IDs sean válidos y existan
                for (const studentId of studentIds) {
                    if (!mongoose.Types.ObjectId.isValid(studentId)) {
                        return res.status(400).json({
                            message: `ID de estudiante inválido: ${studentId}`
                        });
                    }
                    const student = await Student.findById(studentId);
                    if (!student) {
                        return res.status(404).json({
                            message: `Estudiante no encontrado: ${studentId}`
                        });
                    }
                    studentIdsArray.push(studentId);
                }
                updateFields.idStudent = studentIdsArray;
            }
        }

        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    message: 'El campo isActive debe ser un valor booleano (true o false)'
                });
            }
            updateFields.isActive = isActive;
        }

        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        // Popular todas las referencias en la respuesta
        const populatedNotification = await Notification.findById(updatedNotification._id)
            .populate('idCategoryNotification', 'category_notification_description')
            .populate('idPenalization', 'name description')
            .populate('idEnrollment', 'alias language enrollmentType')
            .populate('idProfessor', 'name email phone')
            .populate('idStudent', 'name studentCode email')
            .lean();

        res.status(200).json({
            message: 'Notificación actualizada exitosamente',
            notification: populatedNotification
        });
    } catch (error) {
        console.error('Error al actualizar notificación:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'notificación');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al actualizar notificación',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/notifications/:id/anular
 * @description Anula una notificación (establece isActive a false)
 * @access Private (Requiere JWT - Solo admin)
 */
notificationCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({
                message: 'Notificación no encontrada'
            });
        }

        if (notification.isActive === false) {
            return res.status(400).json({
                message: 'La notificación ya está anulada'
            });
        }

        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true, runValidators: true }
        )
            .populate('idCategoryNotification', 'category_notification_description')
            .populate('idPenalization', 'name description')
            .populate('idEnrollment', 'alias language enrollmentType')
            .populate('idProfessor', 'name email phone')
            .populate('idStudent', 'name studentCode email')
            .lean();

        res.status(200).json({
            message: 'Notificación anulada exitosamente',
            notification: updatedNotification
        });
    } catch (error) {
        console.error('Error al anular notificación:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al anular notificación',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/notifications/:id/activate
 * @description Activa una notificación (establece isActive a true)
 * @access Private (Requiere JWT - Solo admin)
 */
notificationCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({
                message: 'Notificación no encontrada'
            });
        }

        if (notification.isActive === true) {
            return res.status(400).json({
                message: 'La notificación ya está activada'
            });
        }

        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true, runValidators: true }
        )
            .populate('idCategoryNotification', 'category_notification_description')
            .populate('idPenalization', 'name description')
            .populate('idEnrollment', 'alias language enrollmentType')
            .populate('idProfessor', 'name email phone')
            .populate('idStudent', 'name studentCode email')
            .lean();

        res.status(200).json({
            message: 'Notificación activada exitosamente',
            notification: updatedNotification
        });
    } catch (error) {
        console.error('Error al activar notificación:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al activar notificación',
            error: error.message
        });
    }
};

module.exports = notificationCtrl;

