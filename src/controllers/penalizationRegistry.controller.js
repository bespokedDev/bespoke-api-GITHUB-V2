// controllers/penalizationRegistry.controller.js
const PenalizationRegistry = require('../models/PenalizationRegistry');
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');
const Penalizacion = require('../models/Penalizacion');
const Enrollment = require('../models/Enrollment');
const Professor = require('../models/Professor');
const Student = require('../models/Student');
const User = require('../models/User');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const penalizationRegistryCtrl = {};

/**
 * @route POST /api/penalization-registry
 * @description Crea un nuevo registro de penalización
 * @access Private (Requiere JWT)
 * 
 * Campos requeridos:
 * - penalization_description (string): Descripción de la penalización (OBLIGATORIO)
 * 
 * Campos opcionales:
 * - idPenalizacion (ObjectId): ID del tipo de penalización
 * - idpenalizationLevel (object): { tipo: string, nivel: number }
 * - enrollmentId (ObjectId): ID del enrollment
 * - professorId (ObjectId): ID del profesor
 * - studentId (ObjectId): ID del estudiante
 * - penalizationMoney (number): Monto de dinero
 * - lateFee (number): Días de lateFee
 * - endDate (Date): Fecha de fin
 * - support_file (string): Archivo de soporte
 * - notification (number): 0 = no crear notificación, 1 = crear notificación (requiere notification_description si es 1)
 * - notification_description (string): Descripción de la notificación (requerida si notification = 1)
 */
penalizationRegistryCtrl.create = async (req, res) => {
    try {
        const {
            idPenalizacion,
            idpenalizationLevel,
            enrollmentId,
            professorId,
            studentId,
            userId,
            penalization_description,
            penalizationMoney,
            lateFee,
            endDate,
            support_file,
            notification,
            notification_description
        } = req.body;

        // Validar campo obligatorio
        if (!penalization_description || typeof penalization_description !== 'string' || penalization_description.trim() === '') {
            return res.status(400).json({
                message: 'El campo penalization_description es requerido y debe ser un string no vacío.'
            });
        }

        // Validar notification (debe ser 0 o 1)
        const shouldCreateNotification = notification === 1;
        if (notification !== undefined && notification !== null && notification !== 0 && notification !== 1) {
            return res.status(400).json({
                message: 'El campo notification debe ser 0 o 1.'
            });
        }

        // Si se quiere crear notificación, validar notification_description
        if (shouldCreateNotification) {
            if (!notification_description || typeof notification_description !== 'string' || notification_description.trim() === '') {
                return res.status(400).json({
                    message: 'El campo notification_description es requerido cuando notification = 1.'
                });
            }
        }

        // Validar idPenalizacion si se proporciona
        if (idPenalizacion !== undefined && idPenalizacion !== null) {
            if (!mongoose.Types.ObjectId.isValid(idPenalizacion)) {
                return res.status(400).json({
                    message: 'ID de penalización inválido.'
                });
            }
            const penalizacionExists = await Penalizacion.findById(idPenalizacion);
            if (!penalizacionExists) {
                return res.status(404).json({
                    message: 'Tipo de penalización no encontrado.'
                });
            }
        }

        // Validar idpenalizationLevel si se proporciona
        if (idpenalizationLevel !== undefined && idpenalizationLevel !== null) {
            if (typeof idpenalizationLevel !== 'object' || Array.isArray(idpenalizationLevel)) {
                return res.status(400).json({
                    message: 'El campo idpenalizationLevel debe ser un objeto con tipo y nivel.'
                });
            }

            if (!idpenalizationLevel.tipo || typeof idpenalizationLevel.tipo !== 'string' || idpenalizationLevel.tipo.trim() === '') {
                return res.status(400).json({
                    message: 'El campo idpenalizationLevel.tipo es requerido y debe ser un string no vacío.'
                });
            }

            if (idpenalizationLevel.nivel === undefined || idpenalizationLevel.nivel === null) {
                return res.status(400).json({
                    message: 'El campo idpenalizationLevel.nivel es requerido.'
                });
            }

            const nivelNumber = Number(idpenalizationLevel.nivel);
            if (isNaN(nivelNumber) || nivelNumber < 1 || !Number.isInteger(nivelNumber)) {
                return res.status(400).json({
                    message: 'El campo idpenalizationLevel.nivel debe ser un número entero mayor o igual a 1.'
                });
            }
        }

        // Validar enrollmentId si se proporciona
        if (enrollmentId !== undefined && enrollmentId !== null) {
            if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
                return res.status(400).json({
                    message: 'ID de enrollment inválido.'
                });
            }
            const enrollmentExists = await Enrollment.findById(enrollmentId);
            if (!enrollmentExists) {
                return res.status(404).json({
                    message: 'Enrollment no encontrado.'
                });
            }
        }

        // Validar professorId si se proporciona
        if (professorId !== undefined && professorId !== null) {
            if (!mongoose.Types.ObjectId.isValid(professorId)) {
                return res.status(400).json({
                    message: 'ID de profesor inválido.'
                });
            }
            const professorExists = await Professor.findById(professorId);
            if (!professorExists) {
                return res.status(404).json({
                    message: 'Profesor no encontrado.'
                });
            }
        }

        // Validar studentId si se proporciona
        if (studentId !== undefined && studentId !== null) {
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    message: 'ID de estudiante inválido.'
                });
            }
            const studentExists = await Student.findById(studentId);
            if (!studentExists) {
                return res.status(404).json({
                    message: 'Estudiante no encontrado.'
                });
            }
        }

        // Validar userId si se proporciona
        if (userId !== undefined && userId !== null) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    message: 'ID de usuario inválido.'
                });
            }
            const userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({
                    message: 'Usuario no encontrado.'
                });
            }
        }

        // Validar penalizationMoney si se proporciona
        if (penalizationMoney !== undefined && penalizationMoney !== null) {
            const moneyValue = Number(penalizationMoney);
            if (isNaN(moneyValue) || moneyValue < 0) {
                return res.status(400).json({
                    message: 'El campo penalizationMoney debe ser un número mayor o igual a 0.'
                });
            }
        }

        // Validar lateFee si se proporciona
        if (lateFee !== undefined && lateFee !== null) {
            const lateFeeValue = Number(lateFee);
            if (isNaN(lateFeeValue) || lateFeeValue < 0 || !Number.isInteger(lateFeeValue)) {
                return res.status(400).json({
                    message: 'El campo lateFee debe ser un número entero mayor o igual a 0.'
                });
            }
        }

        // Validar endDate si se proporciona
        if (endDate !== undefined && endDate !== null) {
            const dateValue = new Date(endDate);
            if (isNaN(dateValue.getTime())) {
                return res.status(400).json({
                    message: 'El campo endDate debe ser una fecha válida.'
                });
            }
        }

        // Construir objeto de registro de penalización
        const registryData = {
            penalization_description: penalization_description.trim()
        };

        if (idPenalizacion !== undefined && idPenalizacion !== null) {
            registryData.idPenalizacion = idPenalizacion;
        }

        if (idpenalizationLevel !== undefined && idpenalizationLevel !== null) {
            registryData.idpenalizationLevel = {
                tipo: idpenalizationLevel.tipo.trim(),
                nivel: Number(idpenalizationLevel.nivel)
            };
        }

        if (enrollmentId !== undefined && enrollmentId !== null) {
            registryData.enrollmentId = enrollmentId;
        }

        if (professorId !== undefined && professorId !== null) {
            registryData.professorId = professorId;
        }

        if (studentId !== undefined && studentId !== null) {
            registryData.studentId = studentId;
        }

        if (userId !== undefined && userId !== null) {
            registryData.userId = userId;
        }

        if (penalizationMoney !== undefined && penalizationMoney !== null) {
            registryData.penalizationMoney = Number(penalizationMoney);
        }

        if (lateFee !== undefined && lateFee !== null) {
            registryData.lateFee = Number(lateFee);
        }

        if (endDate !== undefined && endDate !== null) {
            registryData.endDate = new Date(endDate);
        }

        if (support_file !== undefined && support_file !== null) {
            registryData.support_file = typeof support_file === 'string' ? support_file.trim() : support_file;
        }

        // Crear el registro de penalización
        const newPenalizationRegistry = new PenalizationRegistry(registryData);
        const savedPenalizationRegistry = await newPenalizationRegistry.save();

        let createdNotification = null;

        // Crear notificación si se solicita (notification = 1)
        if (shouldCreateNotification) {
            try {
                // Obtener o crear categoría de notificación "Penalización"
                let categoryNotification = await CategoryNotification.findOne({
                    category_notification_description: 'Penalización'
                });

                if (!categoryNotification) {
                    categoryNotification = new CategoryNotification({
                        category_notification_description: 'Penalización',
                        isActive: true
                    });
                    await categoryNotification.save();
                }

                // Preparar datos de la notificación
                const notificationData = {
                    idCategoryNotification: categoryNotification._id,
                    notification_description: notification_description.trim(),
                    idPenalization: savedPenalizationRegistry.idPenalizacion || null,
                    isActive: true
                };

                // Agregar referencias del registro de penalización a la notificación
                if (savedPenalizationRegistry.enrollmentId) {
                    notificationData.idEnrollment = savedPenalizationRegistry.enrollmentId;
                }

                if (savedPenalizationRegistry.professorId) {
                    notificationData.idProfessor = savedPenalizationRegistry.professorId;
                }

                if (savedPenalizationRegistry.studentId) {
                    // idStudent es un array en el modelo Notification
                    notificationData.idStudent = [savedPenalizationRegistry.studentId];
                }

                if (savedPenalizationRegistry.userId) {
                    notificationData.userId = savedPenalizationRegistry.userId;
                }

                // Crear la notificación
                const newNotification = new Notification(notificationData);
                createdNotification = await newNotification.save();

                console.log(`[PENALIZATION REGISTRY] Notificación creada para registro de penalización ${savedPenalizationRegistry._id}`);
            } catch (notificationError) {
                console.error('[PENALIZATION REGISTRY] Error al crear notificación:', notificationError);
                // No fallar la creación del registro si falla la notificación
                // El registro ya se guardó, solo logueamos el error
            }
        }

        // Preparar respuesta
        const response = {
            message: 'Registro de penalización creado exitosamente',
            penalizationRegistry: savedPenalizationRegistry.toObject()
        };

        if (createdNotification) {
            response.notification = createdNotification.toObject();
            response.message += ' y notificación creada exitosamente';
        }

        res.status(201).json(response);

    } catch (error) {
        console.error('Error al crear registro de penalización:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'registro de penalización');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Error de validación',
                errors: validationErrors
            });
        }

        res.status(500).json({
            message: 'Error interno al crear registro de penalización',
            error: error.message
        });
    }
};

/**
 * @route GET /api/penalization-registry/user/my-penalizations
 * @description Lista todos los registros de penalización del usuario autenticado (student, professor o admin)
 * @access Private (Requiere JWT - Cualquier usuario autenticado)
 * 
 * Busca registros de penalización según el tipo de usuario:
 * - Si es student: busca en studentId y también en enrollments donde el student esté en studentIds
 * - Si es professor: busca en professorId y también en enrollments donde el professor sea el profesor
 * - Si es admin: busca en userId
 */
penalizationRegistryCtrl.getMyPenalizations = async (req, res) => {
    try {
        const userType = req.user?.userType || req.user?.role; // userType o role del token
        const userId = req.user?.id; // ID del usuario del token

        if (!userId) {
            return res.status(400).json({
                message: 'ID de usuario no encontrado en el token'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'ID de usuario inválido en el token'
            });
        }

        let query = {};

        // Construir query según el tipo de usuario
        if (userType === 'student') {
            // Buscar registros donde:
            // 1. El studentId coincida directamente
            // 2. O el enrollmentId tenga al estudiante en su array studentIds
            const studentObjectId = mongoose.Types.ObjectId(userId);
            
            // Primero, obtener todos los enrollments donde el estudiante esté en studentIds
            const enrollmentsWithStudent = await Enrollment.find({
                'studentIds.studentId': studentObjectId
            }).select('_id').lean();

            const enrollmentIds = enrollmentsWithStudent.map(e => e._id);

            // Construir query: studentId directo O enrollmentId que contenga al estudiante
            query.$or = [
                { studentId: studentObjectId },
                { enrollmentId: { $in: enrollmentIds } }
            ];
        } else if (userType === 'professor') {
            // Buscar registros donde:
            // 1. El professorId coincida directamente
            // 2. O el enrollmentId tenga al profesor como profesor
            const professorObjectId = mongoose.Types.ObjectId(userId);
            
            // Primero, obtener todos los enrollments donde el profesor sea el profesor
            const enrollmentsWithProfessor = await Enrollment.find({
                professorId: professorObjectId
            }).select('_id').lean();

            const enrollmentIds = enrollmentsWithProfessor.map(e => e._id);

            // Construir query: professorId directo O enrollmentId que tenga al profesor
            query.$or = [
                { professorId: professorObjectId },
                { enrollmentId: { $in: enrollmentIds } }
            ];
        } else if (userType === 'admin') {
            // Buscar registros donde el usuario admin coincida
            query.userId = mongoose.Types.ObjectId(userId);
        } else {
            return res.status(400).json({
                message: 'Tipo de usuario no válido o no encontrado en el token'
            });
        }

        // Buscar registros de penalización con populate de todas las referencias
        const penalizations = await PenalizationRegistry.find(query)
            .populate('idPenalizacion', 'name penalizationLevels status')
            .populate('enrollmentId', 'alias language enrollmentType status professorId studentIds planId')
            .populate('professorId', 'name email phone status')
            .populate('studentId', 'name studentCode email status')
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 }) // Más recientes primero
            .lean();

        res.status(200).json({
            message: 'Registros de penalización obtenidos exitosamente',
            count: penalizations.length,
            userType: userType,
            userId: userId,
            penalizations: penalizations
        });
    } catch (error) {
        console.error('Error al obtener registros de penalización del usuario:', error);
        res.status(500).json({
            message: 'Error interno al obtener registros de penalización',
            error: error.message
        });
    }
};

module.exports = penalizationRegistryCtrl;

