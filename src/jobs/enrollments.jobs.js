// jobs/enrollments.jobs.js
const cron = require('node-cron');
const Enrollment = require('../models/Enrollment');
const Penalizacion = require('../models/Penalizacion');
const PenalizationRegistry = require('../models/PenalizationRegistry');
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');
const Plan = require('../models/Plans');
const Student = require('../models/Student');
const mongoose = require('mongoose');

/**
 * Función helper para crear notificación de anulación de enrollment
 */
const createEnrollmentDeactivationNotification = async (enrollment) => {
    try {
        // Obtener o crear categoría de notificación "Administrativa"
        let categoryNotification = await CategoryNotification.findOne({
            category_notification_description: 'Administrativa'
        });

        if (!categoryNotification) {
            categoryNotification = new CategoryNotification({
                category_notification_description: 'Administrativa',
                isActive: true
            });
            await categoryNotification.save();
        }

        // Extraer IDs de estudiantes del enrollment
        const studentIds = enrollment.studentIds
            .map(s => {
                // Si studentId es un ObjectId directo
                if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) {
                    return s.studentId._id.toString();
                }
                // Si studentId es un ObjectId o string
                return s.studentId ? s.studentId.toString() : null;
            })
            .filter(id => id !== null && id !== undefined);

        // Crear notificación de anulación
        if (studentIds.length > 0) {
            const newNotification = new Notification({
                idCategoryNotification: categoryNotification._id,
                notification_description: `Enrollment anulado por vencimiento de fecha de pago. Enrollment ID: ${enrollment._id}`,
                idPenalization: null,
                idEnrollment: enrollment._id,
                idProfessor: null,
                idStudent: studentIds,
                isActive: true
            });

            await newNotification.save();
            console.log(`[CRONJOB] Notificación de anulación creada para enrollment ${enrollment._id}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`[CRONJOB] Error creando notificación de anulación para enrollment ${enrollment._id}:`, error.message);
        return false;
    }
};

/**
 * Cronjob para manejar estados de enrollments por impago
 * Se ejecuta diariamente a las 00:00 (medianoche)
 * 
 * Reglas de negocio:
 * 1. Si endDate pasó y lateFee > 0: expandir endDate virtualmente (lateFee días)
 *    - Si nueva fecha pasó y penalizationMoney > 0: crear penalización y notificación
 *    - Si nueva fecha pasó: anular enrollment inmediatamente (status = 2)
 * 2. Si endDate pasó y lateFee = 0: anular inmediatamente (status = 2)
 */
const processEnrollmentsPaymentStatus = async () => {
    try {
        console.log('[CRONJOB] Iniciando procesamiento de enrollments por impago...');
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones

        // Buscar todos los enrollments activos (status = 1)
        const activeEnrollments = await Enrollment.find({ status: 1 })
            .lean();

        console.log(`[CRONJOB] Encontrados ${activeEnrollments.length} enrollments activos para procesar`);

        let processedCount = 0;
        let penalizedCount = 0;
        let deactivatedCount = 0;

        for (const enrollment of activeEnrollments) {
            try {
                // Normalizar endDate a medianoche para comparación
                const endDate = new Date(enrollment.endDate);
                endDate.setHours(0, 0, 0, 0);

                // Regla 1: lateFee > 0
                if (enrollment.lateFee > 0) {
                    // Calcular fecha expandida virtualmente (endDate + lateFee días)
                    const expandedEndDate = new Date(endDate);
                    expandedEndDate.setDate(expandedEndDate.getDate() + enrollment.lateFee);

                    // Verificar si la fecha expandida ya pasó
                    if (expandedEndDate < now) {
                        // Si penalizationMoney > 0, crear registro de penalización
                        if (enrollment.penalizationMoney > 0) {
                            // Verificar si ya existe un registro de penalización para este enrollment
                            const existingPenalizationRegistry = await PenalizationRegistry.findOne({
                                enrollmentId: enrollment._id
                            });

                            if (!existingPenalizationRegistry) {
                                // Buscar o crear el tipo de penalización por defecto para "Vencimiento de días de pago"
                                let penalizationType = await Penalizacion.findOne({
                                    name: 'Penalización por vencimiento de días de pago'
                                });

                                if (!penalizationType) {
                                    // Crear el tipo de penalización si no existe
                                    penalizationType = new Penalizacion({
                                        name: 'Penalización por vencimiento de días de pago',
                                        tipo: null,
                                        description: 'Penalización aplicada automáticamente cuando un enrollment vence y tiene penalizationMoney > 0',
                                        status: 1
                                    });
                                    await penalizationType.save();
                                    console.log(`[CRONJOB] Tipo de penalización "Penalización por vencimiento de días de pago" creado`);
                                }

                                // Crear registro de penalización en PenalizationRegistry
                                const newPenalizationRegistry = new PenalizationRegistry({
                                    idPenalizacion: penalizationType._id,
                                    enrollmentId: enrollment._id,
                                    professorId: null,
                                    studentId: null,
                                    penalization_description: `Penalización por vencimiento de días de pago. Enrollment vencido el ${endDate.toISOString().split('T')[0]}`,
                                    penalizationMoney: enrollment.penalizationMoney,
                                    lateFee: enrollment.lateFee,
                                    endDate: enrollment.endDate
                                });

                                const savedPenalizationRegistry = await newPenalizationRegistry.save();
                                penalizedCount++;

                                // Obtener categoría de notificación "Penalización" o crearla si no existe
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

                                // Extraer IDs de estudiantes del enrollment
                                // studentIds es un array de objetos con { studentId: ObjectId, ... }
                                const studentIds = enrollment.studentIds
                                    .map(s => {
                                        // Si studentId es un ObjectId directo
                                        if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) {
                                            return s.studentId._id.toString();
                                        }
                                        // Si studentId es un ObjectId o string
                                        return s.studentId ? s.studentId.toString() : null;
                                    })
                                    .filter(id => id !== null && id !== undefined);

                                // Crear notificación
                                // La notificación apunta al tipo de penalización (Penalizacion), no al registro
                                if (studentIds.length > 0) {
                                    const newNotification = new Notification({
                                        idCategoryNotification: categoryNotification._id,
                                        notification_description: 'penalización por vencimiento de dias de pago',
                                        idPenalization: penalizationType._id, // Apunta al tipo de penalización
                                        idEnrollment: enrollment._id,
                                        idProfessor: null,
                                        idStudent: studentIds,
                                        isActive: true
                                    });

                                    await newNotification.save();
                                    console.log(`[CRONJOB] Notificación creada para enrollment ${enrollment._id}`);
                                }

                                console.log(`[CRONJOB] Registro de penalización creado para enrollment ${enrollment._id}`);
                            }
                        }

                        // Anular enrollment inmediatamente después de que pase la fecha expandida
                        await Enrollment.findByIdAndUpdate(enrollment._id, { status: 2 });
                        await createEnrollmentDeactivationNotification(enrollment);
                        deactivatedCount++;
                        console.log(`[CRONJOB] Enrollment ${enrollment._id} anulado (lateFee > 0, fecha expandida pasada)`);
                    }
                }
                // Regla 2: lateFee = 0 -> anular inmediatamente cuando pase endDate
                else if (enrollment.lateFee === 0) {
                    // Verificar si endDate ya pasó
                    if (endDate < now) {
                        await Enrollment.findByIdAndUpdate(enrollment._id, { status: 2 });
                        await createEnrollmentDeactivationNotification(enrollment);
                        deactivatedCount++;
                        console.log(`[CRONJOB] Enrollment ${enrollment._id} anulado (lateFee = 0, endDate pasada)`);
                    }
                }

                processedCount++;
            } catch (error) {
                console.error(`[CRONJOB] Error procesando enrollment ${enrollment._id}:`, error.message);
                // Continuar con el siguiente enrollment
            }
        }

        console.log(`[CRONJOB] Procesamiento completado:`);
        console.log(`  - Enrollments procesados: ${processedCount}`);
        console.log(`  - Penalizaciones creadas: ${penalizedCount}`);
        console.log(`  - Enrollments anulados: ${deactivatedCount}`);
        console.log('[CRONJOB] Finalizando procesamiento de enrollments por impago');

    } catch (error) {
        console.error('[CRONJOB] Error en procesamiento de enrollments por impago:', error);
    }
};

/**
 * Inicializa el cronjob para procesar enrollments
 * Se ejecuta diariamente a las 00:00 (medianoche)
 */
const initEnrollmentsPaymentCronjob = () => {
    // Cron expression para producción: '0 0 * * *' = todos los días a las 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log(`[CRONJOB] Ejecutando cronjob de enrollments por impago - ${new Date().toISOString()}`);
        await processEnrollmentsPaymentStatus();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });

    console.log('[CRONJOB] Cronjob de enrollments por impago configurado (diario a medianoche - PRODUCCIÓN)');
};

/**
 * Función helper para crear notificación de pago automático fallido
 */
const createAutomaticPaymentFailedNotification = async (enrollment, students) => {
    try {
        // Validar que el ObjectId de categoría de notificación sea válido
        const categoryNotificationId = '6941c9b30646c9359c7f9f68';
        if (!mongoose.Types.ObjectId.isValid(categoryNotificationId)) {
            throw new Error('ID de categoría de notificación inválido');
        }

        // Construir descripción con información de estudiantes
        const studentInfo = students.map(s => {
            const name = s.name || 'N/A';
            const email = s.email || 'N/A';
            return `${name} (${email})`;
        }).join(', ');

        const description = `No se pudo efectuar el pago automático del enrollment ${enrollment._id} porque no hay suficiente saldo disponible. Estudiantes afectados: ${studentInfo}`;

        // Extraer IDs de estudiantes
        const studentIds = students.map(s => s._id);

        // Crear notificación
        const newNotification = new Notification({
            idCategoryNotification: categoryNotificationId,
            notification_description: description,
            idPenalization: null,
            idEnrollment: enrollment._id,
            idProfessor: null,
            idStudent: studentIds,
            isActive: true
        });

        await newNotification.save();
        console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Notificación de pago automático fallido creada para enrollment ${enrollment._id}`);
        return true;
    } catch (error) {
        console.error(`[CRONJOB PAGOS AUTOMÁTICOS] Error creando notificación de pago automático fallido para enrollment ${enrollment._id}:`, error.message);
        return false;
    }
};

/**
 * Función helper para crear notificación de desactivación de pagos automáticos por saldo insuficiente
 */
const createAutomaticPaymentsDisabledNotification = async (enrollment, students) => {
    try {
        // Validar que el ObjectId de categoría de notificación sea válido
        const categoryNotificationId = '6941c9b30646c9359c7f9f68';
        if (!mongoose.Types.ObjectId.isValid(categoryNotificationId)) {
            throw new Error('ID de categoría de notificación inválido');
        }

        // Construir descripción con información de estudiantes
        const studentInfo = students.map(s => {
            const name = s.name || 'N/A';
            const email = s.email || 'N/A';
            return `${name} (${email})`;
        }).join(', ');

        const description = `Los pagos automáticos del enrollment ${enrollment._id} han sido desactivados debido a saldo insuficiente después del pago automático. Estudiantes afectados: ${studentInfo}`;

        // Extraer IDs de estudiantes
        const studentIds = students.map(s => s._id);

        // Crear notificación
        const newNotification = new Notification({
            idCategoryNotification: categoryNotificationId,
            notification_description: description,
            idPenalization: null,
            idEnrollment: enrollment._id,
            idProfessor: null,
            idStudent: studentIds,
            isActive: true
        });

        await newNotification.save();
        console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Notificación de desactivación de pagos automáticos creada para enrollment ${enrollment._id}`);
        return true;
    } catch (error) {
        console.error(`[CRONJOB PAGOS AUTOMÁTICOS] Error creando notificación de desactivación de pagos automáticos para enrollment ${enrollment._id}:`, error.message);
        return false;
    }
};

/**
 * Cronjob para procesar pagos automáticos de enrollments
 * Se ejecuta diariamente a las 00:00 (medianoche)
 * 
 * Reglas de negocio:
 * 1. Buscar enrollments con cancellationPaymentsEnabled === true
 * 2. Filtrar enrollments cuyo endDate coincida con la fecha actual (mismo día, ignorando hora)
 * 3. Para cada enrollment que cumpla:
 *    - Verificar si available_balance >= totalAmount antes de la resta
 *    - Si NO: detener, cambiar cancellationPaymentsEnabled a false, crear notificación de pago fallido
 *    - Si SÍ: 
 *      a. Restar: available_balance = available_balance - totalAmount
 *      b. Dividir nuevo available_balance entre cantidad de estudiantes en studentIds
 *      c. Actualizar amount de cada estudiante con el resultado de la división
 *      d. Obtener plan usando planId y verificar pricing[enrollmentType]
 *      e. Si pricing[enrollmentType] !== totalAmount, actualizar totalAmount
 *      f. Si después de la resta available_balance < totalAmount:
 *         - Cambiar cancellationPaymentsEnabled a false
 *         - Crear notificación de desactivación de pagos automáticos
 */
const processAutomaticPayments = async () => {
    try {
        console.log('[CRONJOB PAGOS AUTOMÁTICOS] Iniciando procesamiento de pagos automáticos...');
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones

        // Buscar enrollments con pagos automáticos habilitados
        const enrollmentsWithAutoPayments = await Enrollment.find({
            cancellationPaymentsEnabled: true
        })
            .populate('planId')
            .populate('studentIds.studentId')
            .lean();

        console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Encontrados ${enrollmentsWithAutoPayments.length} enrollments con pagos automáticos habilitados`);

        let processedCount = 0;
        let paymentsProcessed = 0;
        let paymentsFailed = 0;
        let autoPaymentsDisabled = 0;

        for (const enrollment of enrollmentsWithAutoPayments) {
            try {
                // Normalizar endDate a medianoche para comparación (solo día, ignorando hora)
                if (!enrollment.endDate) {
                    console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Enrollment ${enrollment._id} no tiene endDate, saltando...`);
                    processedCount++;
                    continue;
                }

                const endDate = new Date(enrollment.endDate);
                endDate.setHours(0, 0, 0, 0);

                // Verificar si endDate coincide con la fecha actual (mismo día)
                if (endDate.getTime() !== now.getTime()) {
                    // No es el día del pago, continuar con el siguiente enrollment
                    processedCount++;
                    continue;
                }

                console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Procesando enrollment ${enrollment._id} con endDate ${endDate.toISOString().split('T')[0]}`);

                // Verificar si hay suficiente saldo ANTES de la resta
                if (!enrollment.available_balance || enrollment.available_balance < enrollment.totalAmount) {
                    // No hay suficiente saldo, detener y desactivar pagos automáticos
                    await Enrollment.findByIdAndUpdate(enrollment._id, {
                        cancellationPaymentsEnabled: false
                    });

                    // Obtener información completa de estudiantes para la notificación
                    const studentIds = enrollment.studentIds
                        .map(s => {
                            if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) {
                                return s.studentId._id;
                            }
                            return s.studentId ? s.studentId : null;
                        })
                        .filter(id => id !== null && id !== undefined);

                    const students = await Student.find({
                        _id: { $in: studentIds }
                    }).select('name email').lean();

                    await createAutomaticPaymentFailedNotification(enrollment, students);
                    paymentsFailed++;
                    console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Pago automático fallido para enrollment ${enrollment._id} - saldo insuficiente`);
                    processedCount++;
                    continue;
                }

                // Hay suficiente saldo, proceder con el pago automático
                const newAvailableBalance = enrollment.available_balance - enrollment.totalAmount;
                const numberOfStudents = enrollment.studentIds.length;
                const amountPerStudent = numberOfStudents > 0 ? newAvailableBalance / numberOfStudents : 0;

                // Actualizar amount de cada estudiante en studentIds
                // Necesitamos extraer solo el ObjectId del studentId (puede venir poblado)
                const updatedStudentIds = enrollment.studentIds.map(studentInfo => {
                    // Extraer el ObjectId del studentId (puede venir como objeto poblado o como ObjectId)
                    let studentIdValue = studentInfo.studentId;
                    if (studentIdValue && typeof studentIdValue === 'object' && studentIdValue._id) {
                        studentIdValue = studentIdValue._id;
                    } else if (studentIdValue && typeof studentIdValue === 'object' && !studentIdValue._id) {
                        // Ya es un ObjectId
                        studentIdValue = studentIdValue;
                    }

                    // Reconstruir el objeto del estudiante con el nuevo amount
                    return {
                        studentId: studentIdValue,
                        preferences: studentInfo.preferences || null,
                        firstTimeLearningLanguage: studentInfo.firstTimeLearningLanguage || null,
                        previousExperience: studentInfo.previousExperience || null,
                        goals: studentInfo.goals || null,
                        dailyLearningTime: studentInfo.dailyLearningTime || null,
                        learningType: studentInfo.learningType || null,
                        idealClassType: studentInfo.idealClassType || null,
                        learningDifficulties: studentInfo.learningDifficulties || null,
                        languageLevel: studentInfo.languageLevel || null,
                        experiencePastClass: studentInfo.experiencePastClass || null,
                        howWhereTheClasses: studentInfo.howWhereTheClasses || null,
                        roleGroup: studentInfo.roleGroup || null,
                        willingHomework: studentInfo.willingHomework !== undefined ? studentInfo.willingHomework : null,
                        availabityToPractice: studentInfo.availabityToPractice || null,
                        learningDifficulty: studentInfo.learningDifficulty !== undefined ? studentInfo.learningDifficulty : null,
                        amount: amountPerStudent
                    };
                });

                // Obtener el precio actualizado del plan según enrollmentType
                let newTotalAmount = enrollment.totalAmount;
                if (enrollment.planId && enrollment.planId.pricing) {
                    const enrollmentType = enrollment.enrollmentType; // 'single', 'couple', 'group'
                    const planPricing = enrollment.planId.pricing[enrollmentType];
                    
                    if (planPricing !== undefined && planPricing !== enrollment.totalAmount) {
                        newTotalAmount = planPricing;
                        console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Actualizando totalAmount de ${enrollment.totalAmount} a ${newTotalAmount} para enrollment ${enrollment._id}`);
                    }
                }

                // Preparar actualización del enrollment
                const updateData = {
                    available_balance: newAvailableBalance,
                    studentIds: updatedStudentIds,
                    totalAmount: newTotalAmount
                };

                // Verificar si después de la resta el saldo es insuficiente para el próximo pago
                if (newAvailableBalance < newTotalAmount) {
                    updateData.cancellationPaymentsEnabled = false;
                    autoPaymentsDisabled++;

                    // Obtener información completa de estudiantes para la notificación
                    const studentIds = enrollment.studentIds
                        .map(s => {
                            if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) {
                                return s.studentId._id;
                            }
                            return s.studentId ? s.studentId : null;
                        })
                        .filter(id => id !== null && id !== undefined);

                    const students = await Student.find({
                        _id: { $in: studentIds }
                    }).select('name email').lean();

                    // Actualizar enrollment
                    await Enrollment.findByIdAndUpdate(enrollment._id, updateData);

                    // Crear notificación de desactivación
                    await createAutomaticPaymentsDisabledNotification(enrollment, students);
                    console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Pagos automáticos desactivados para enrollment ${enrollment._id} - saldo insuficiente después del pago`);
                } else {
                    // Actualizar enrollment sin desactivar pagos automáticos
                    await Enrollment.findByIdAndUpdate(enrollment._id, updateData);
                    console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Pago automático procesado exitosamente para enrollment ${enrollment._id}`);
                }

                paymentsProcessed++;
                processedCount++;
            } catch (error) {
                console.error(`[CRONJOB PAGOS AUTOMÁTICOS] Error procesando enrollment ${enrollment._id}:`, error.message);
                // Continuar con el siguiente enrollment
                processedCount++;
            }
        }

        console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Procesamiento completado:`);
        console.log(`  - Enrollments procesados: ${processedCount}`);
        console.log(`  - Pagos procesados exitosamente: ${paymentsProcessed}`);
        console.log(`  - Pagos fallidos (saldo insuficiente): ${paymentsFailed}`);
        console.log(`  - Pagos automáticos desactivados: ${autoPaymentsDisabled}`);
        console.log('[CRONJOB PAGOS AUTOMÁTICOS] Finalizando procesamiento de pagos automáticos');

    } catch (error) {
        console.error('[CRONJOB PAGOS AUTOMÁTICOS] Error en procesamiento de pagos automáticos:', error);
    }
};

/**
 * Inicializa el cronjob para procesar pagos automáticos
 * Se ejecuta diariamente a las 00:00 (medianoche)
 */
const initAutomaticPaymentsCronjob = () => {
    // Cron expression para producción: '0 0 * * *' = todos los días a las 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Ejecutando cronjob de pagos automáticos - ${new Date().toISOString()}`);
        await processAutomaticPayments();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });

    console.log('[CRONJOB PAGOS AUTOMÁTICOS] Cronjob de pagos automáticos configurado (diario a medianoche - PRODUCCIÓN)');
};

module.exports = {
    processEnrollmentsPaymentStatus,
    initEnrollmentsPaymentCronjob,
    processAutomaticPayments,
    initAutomaticPaymentsCronjob
};

