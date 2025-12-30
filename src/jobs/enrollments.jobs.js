// jobs/enrollments.jobs.js
const cron = require('node-cron');
const Enrollment = require('../models/Enrollment');
const Penalizacion = require('../models/Penalizacion');
const PenalizationRegistry = require('../models/PenalizationRegistry');
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');

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
 * 
 * ⚠️ MODO PRUEBA: Actualmente configurado para ejecutarse cada 10 segundos
 * Cambiar a '0 0 * * *' para producción (diario a medianoche)
 */
const initEnrollmentsPaymentCronjob = () => {
    // Cron expression para pruebas: cada 10 segundos
    // Para producción: '0 0 * * *' = todos los días a las 00:00
    cron.schedule('*/10 * * * * *', async () => {
        console.log(`[CRONJOB] Ejecutando cronjob de enrollments por impago - ${new Date().toISOString()}`);
        await processEnrollmentsPaymentStatus();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });

    console.log('[CRONJOB] Cronjob de enrollments por impago configurado (cada 10 segundos - MODO PRUEBA)');
    console.log('[CRONJOB] ⚠️ RECORDATORIO: Cambiar a "0 0 * * *" para producción (diario a medianoche)');
};

module.exports = {
    processEnrollmentsPaymentStatus,
    initEnrollmentsPaymentCronjob
};

