// jobs/classRegistry.jobs.js
const cron = require('node-cron');
const Enrollment = require('../models/Enrollment');
const ClassRegistry = require('../models/ClassRegistry');
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');
const mongoose = require('mongoose');

/**
 * Función helper para crear notificación de finalización de clases
 */
const createClassFinalizationNotification = async (enrollment, stats) => {
    try {
        // Validar que el ObjectId de categoría de notificación sea válido
        const categoryNotificationId = '6941c9b30646c9359c7f9f68';
        if (!mongoose.Types.ObjectId.isValid(categoryNotificationId)) {
            throw new Error('ID de categoría de notificación inválido');
        }

        // Construir descripción dinámica
        let description = `Finalización de clases del enrollment ${enrollment._id}. `;
        
        const parts = [];
        
        if (stats.noShowCount > 0) {
            parts.push(`${stats.noShowCount} clase(s) de tipo 3 (no show)`);
        }
        
        if (stats.viewedCount > 0) {
            parts.push(`${stats.viewedCount} clase(s) de tipo 1 (vistas)`);
        }
        
        if (stats.partiallyViewedCount > 0) {
            parts.push(`${stats.partiallyViewedCount} clase(s) de tipo 2 (parcialmente vista)`);
        }
        
        if (stats.partiallyViewedWithRescheduleCount > 0) {
            parts.push(`${stats.partiallyViewedWithRescheduleCount} clase(s) de tipo 2 con reschedule`);
        }

        if (parts.length > 0) {
            description += `Total: ${parts.join(', ')}.`;
        } else {
            description += 'No se encontraron clases para reportar.';
        }

        // Crear notificación
        const newNotification = new Notification({
            idCategoryNotification: categoryNotificationId,
            notification_description: description,
            idPenalization: null,
            idEnrollment: enrollment._id,
            idProfessor: null,
            idStudent: [], // No incluir estudiantes según especificación
            isActive: true
        });

        await newNotification.save();
        console.log(`[CRONJOB] Notificación de finalización de clases creada para enrollment ${enrollment._id}`);
        return true;
    } catch (error) {
        console.error(`[CRONJOB] Error creando notificación de finalización para enrollment ${enrollment._id}:`, error.message);
        return false;
    }
};

/**
 * Cronjob para finalizar clases de enrollments vencidos
 * Se ejecuta diariamente a las 00:00 (medianoche)
 * 
 * Reglas de negocio:
 * 1. Buscar enrollments cuyo endDate < fecha actual
 * 2. Para cada enrollment:
 *    - Revisar todas sus ClassRegistry
 *    - Si classViewed = 0 y reschedule = 0 → cambiar a classViewed = 3 (no show)
 *    - Generar notificación con estadísticas:
 *      - Clases tipo 3 (no show)
 *      - Clases tipo 1 (vistas)
 *      - Clases tipo 2 (parcialmente vista)
 *      - Clases tipo 2 con reschedule (originalClassId apunta a clase con reschedule = 1)
 */
const processClassFinalization = async () => {
    try {
        console.log('[CRONJOB] Iniciando procesamiento de finalización de clases...');
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones

        // Buscar enrollments cuyo endDate < fecha actual
        // Buscar todos los enrollments (activos e inactivos) que hayan vencido
        const expiredEnrollments = await Enrollment.find({
            endDate: { $lt: now }
        }).lean();

        console.log(`[CRONJOB] Encontrados ${expiredEnrollments.length} enrollments vencidos para procesar`);

        let processedCount = 0;
        let updatedClassesCount = 0;
        let notificationsCreated = 0;

        for (const enrollment of expiredEnrollments) {
            try {
                // Buscar todas las ClassRegistry de este enrollment
                const classRegistries = await ClassRegistry.find({
                    enrollmentId: enrollment._id
                }).lean();

                if (classRegistries.length === 0) {
                    console.log(`[CRONJOB] Enrollment ${enrollment._id} no tiene clases registradas`);
                    processedCount++;
                    continue;
                }

                // Actualizar clases con classViewed = 0 y reschedule = 0 → cambiar a classViewed = 3
                const classesToUpdate = classRegistries.filter(
                    cr => cr.classViewed === 0 && cr.reschedule === 0
                );

                if (classesToUpdate.length > 0) {
                    const updateResult = await ClassRegistry.updateMany(
                        {
                            enrollmentId: enrollment._id,
                            classViewed: 0,
                            reschedule: 0
                        },
                        {
                            $set: { classViewed: 3 } // Cambiar a no show
                        }
                    );
                    updatedClassesCount += updateResult.modifiedCount;
                    console.log(`[CRONJOB] Actualizadas ${updateResult.modifiedCount} clases a no show para enrollment ${enrollment._id}`);
                }

                // Obtener todas las clases actualizadas (incluyendo las que acabamos de actualizar)
                const allClasses = await ClassRegistry.find({
                    enrollmentId: enrollment._id
                }).lean();

                // Contar estadísticas
                const stats = {
                    noShowCount: 0, // classViewed = 3
                    viewedCount: 0, // classViewed = 1
                    partiallyViewedCount: 0, // classViewed = 2
                    partiallyViewedWithRescheduleCount: 0 // classViewed = 2 y originalClassId apunta a clase con reschedule = 1
                };

                // Obtener IDs de clases con reschedule = 1 para verificar originalClassId
                const rescheduledClassIds = allClasses
                    .filter(cr => cr.reschedule === 1)
                    .map(cr => cr._id.toString());

                for (const classRecord of allClasses) {
                    if (classRecord.classViewed === 3) {
                        stats.noShowCount++;
                    } else if (classRecord.classViewed === 1) {
                        stats.viewedCount++;
                    } else if (classRecord.classViewed === 2) {
                        stats.partiallyViewedCount++;
                        
                        // Verificar si originalClassId apunta a una clase con reschedule = 1
                        if (classRecord.originalClassId) {
                            const originalClassIdStr = classRecord.originalClassId.toString();
                            if (rescheduledClassIds.includes(originalClassIdStr)) {
                                stats.partiallyViewedWithRescheduleCount++;
                            }
                        }
                    }
                }

                // Crear notificación con las estadísticas
                await createClassFinalizationNotification(enrollment, stats);
                notificationsCreated++;

                processedCount++;
                console.log(`[CRONJOB] Enrollment ${enrollment._id} procesado: ${stats.noShowCount} no show, ${stats.viewedCount} vistas, ${stats.partiallyViewedCount} parcialmente vistas, ${stats.partiallyViewedWithRescheduleCount} parcialmente vistas con reschedule`);
            } catch (error) {
                console.error(`[CRONJOB] Error procesando enrollment ${enrollment._id}:`, error.message);
                // Continuar con el siguiente enrollment
            }
        }

        console.log(`[CRONJOB] Procesamiento de finalización de clases completado:`);
        console.log(`  - Enrollments procesados: ${processedCount}`);
        console.log(`  - Clases actualizadas a no show: ${updatedClassesCount}`);
        console.log(`  - Notificaciones creadas: ${notificationsCreated}`);
        console.log('[CRONJOB] Finalizando procesamiento de finalización de clases');

    } catch (error) {
        console.error('[CRONJOB] Error en procesamiento de finalización de clases:', error);
    }
};

/**
 * Inicializa el cronjob para procesar finalización de clases
 * Se ejecuta diariamente a las 00:00 (medianoche)
 * 
 * ⚠️ MODO PRUEBA: Actualmente configurado para ejecutarse cada 10 segundos
 * Cambiar a '0 0 * * *' para producción (diario a medianoche)
 */
const initClassFinalizationCronjob = () => {
    // Cron expression para pruebas: cada 10 segundos
    // Para producción: '0 0 * * *' = todos los días a las 00:00
    cron.schedule('*/10 * * * * *', async () => {
        console.log(`[CRONJOB] Ejecutando cronjob de finalización de clases - ${new Date().toISOString()}`);
        await processClassFinalization();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });

    console.log('[CRONJOB] Cronjob de finalización de clases configurado (cada 10 segundos - MODO PRUEBA)');
    console.log('[CRONJOB] ⚠️ RECORDATORIO: Cambiar a "0 0 * * *" para producción (diario a medianoche)');
};

module.exports = {
    processClassFinalization,
    initClassFinalizationCronjob
};

