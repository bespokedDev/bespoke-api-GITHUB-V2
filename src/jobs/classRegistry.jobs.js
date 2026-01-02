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
        
        if (stats.classLostCount > 0) {
            parts.push(`${stats.classLostCount} clase(s) de tipo 4 (Class Lost - clase perdida)`);
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
 *    - Si classViewed = 0 y reschedule = 0 → cambiar a classViewed = 4 (Class Lost - clase perdida)
 *    - Generar notificación con estadísticas:
 *      - Clases tipo 4 (Class Lost - clase perdida)
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

                // Actualizar clases con classViewed = 0 y reschedule = 0 → cambiar a classViewed = 4 (Class Lost)
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
                            $set: { classViewed: 4 } // Cambiar a Class Lost (clase perdida)
                        }
                    );
                    updatedClassesCount += updateResult.modifiedCount;
                    console.log(`[CRONJOB] Actualizadas ${updateResult.modifiedCount} clases a Class Lost (4) para enrollment ${enrollment._id}`);
                }

                // Obtener todas las clases actualizadas (incluyendo las que acabamos de actualizar)
                const allClasses = await ClassRegistry.find({
                    enrollmentId: enrollment._id
                }).lean();

                // Contar estadísticas
                const stats = {
                    classLostCount: 0, // classViewed = 4 (Class Lost - clase perdida)
                    viewedCount: 0, // classViewed = 1
                    partiallyViewedCount: 0, // classViewed = 2
                    partiallyViewedWithRescheduleCount: 0 // classViewed = 2 y originalClassId apunta a clase con reschedule = 1
                };

                // Obtener IDs de clases con reschedule = 1 para verificar originalClassId
                const rescheduledClassIds = allClasses
                    .filter(cr => cr.reschedule === 1)
                    .map(cr => cr._id.toString());

                for (const classRecord of allClasses) {
                    if (classRecord.classViewed === 4) {
                        stats.classLostCount++;
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
                console.log(`[CRONJOB] Enrollment ${enrollment._id} procesado: ${stats.classLostCount} Class Lost, ${stats.viewedCount} vistas, ${stats.partiallyViewedCount} parcialmente vistas, ${stats.partiallyViewedWithRescheduleCount} parcialmente vistas con reschedule`);
            } catch (error) {
                console.error(`[CRONJOB] Error procesando enrollment ${enrollment._id}:`, error.message);
                // Continuar con el siguiente enrollment
            }
        }

        console.log(`[CRONJOB] Procesamiento de finalización de clases completado:`);
        console.log(`  - Enrollments procesados: ${processedCount}`);
        console.log(`  - Clases actualizadas a Class Lost (4): ${updatedClassesCount}`);
        console.log(`  - Notificaciones creadas: ${notificationsCreated}`);
        console.log('[CRONJOB] Finalizando procesamiento de finalización de clases');

    } catch (error) {
        console.error('[CRONJOB] Error en procesamiento de finalización de clases:', error);
    }
};

/**
 * Inicializa el cronjob para procesar finalización de clases
 * Se ejecuta diariamente a las 00:00 (medianoche)
 */
const initClassFinalizationCronjob = () => {
    // Cron expression para producción: '0 0 * * *' = todos los días a las 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log(`[CRONJOB] Ejecutando cronjob de finalización de clases - ${new Date().toISOString()}`);
        await processClassFinalization();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });

    console.log('[CRONJOB] Cronjob de finalización de clases configurado (diario a medianoche - PRODUCCIÓN)');
};

/**
 * Función helper para crear notificación de cierre mensual de clases
 */
const createMonthlyClassClosureNotification = async (enrollment, monthYear, stats) => {
    try {
        // Validar que el ObjectId de categoría de notificación sea válido
        // Usar la misma categoría que el cronjob de finalización o crear una nueva
        const categoryNotificationId = '6941c9b30646c9359c7f9f68';
        if (!mongoose.Types.ObjectId.isValid(categoryNotificationId)) {
            throw new Error('ID de categoría de notificación inválido');
        }

        // Construir descripción dinámica
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                           'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const [year, month] = monthYear.split('-');
        const monthName = monthNames[parseInt(month) - 1];

        let description = `Cierre mensual de clases - ${monthName.toUpperCase()} ${year}. Enrollment ${enrollment._id}. `;
        
        const parts = [];
        
        if (stats.classLostMarked > 0) {
            parts.push(`${stats.classLostMarked} clase(s) marcada(s) como Class Lost (clase perdida) del mes de ${monthName}`);
        }
        
        if (stats.totalClassesInMonth > 0) {
            parts.push(`Total de clases del mes: ${stats.totalClassesInMonth}`);
        }

        if (stats.viewedInMonth > 0) {
            parts.push(`${stats.viewedInMonth} vista(s)`);
        }

        if (stats.partiallyViewedInMonth > 0) {
            parts.push(`${stats.partiallyViewedInMonth} parcialmente vista(s)`);
        }

        if (stats.alreadyClassLostInMonth > 0) {
            parts.push(`${stats.alreadyClassLostInMonth} ya marcada(s) como Class Lost`);
        }

        if (parts.length > 0) {
            description += parts.join(', ') + '.';
        } else {
            description += 'No se encontraron clases para reportar en este mes.';
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
        console.log(`[CRONJOB MENSUAL] Notificación de cierre mensual creada para enrollment ${enrollment._id} - ${monthYear}`);
        return true;
    } catch (error) {
        console.error(`[CRONJOB MENSUAL] Error creando notificación de cierre mensual para enrollment ${enrollment._id}:`, error.message);
        return false;
    }
};

/**
 * Cronjob para procesar cierre mensual de clases
 * Se ejecuta el último día de cada mes a las 00:00 (medianoche)
 * 
 * Reglas de negocio:
 * 1. Buscar todos los enrollments que tengan clases en el mes actual (sin filtrar por status)
 * 2. Para cada enrollment:
 *    - Revisar todas sus ClassRegistry
 *    - Filtrar clases cuya classDate esté dentro del mes actual que está terminando
 *    - Si classViewed = 0 → cambiar a classViewed = 4 (Class Lost - clase perdida) SOLO para clases del mes actual
 *    - Generar notificación con estadísticas del mes:
 *      - Clases marcadas como Class Lost en este procesamiento
 *      - Total de clases del mes
 *      - Clases vistas del mes
 *      - Clases parcialmente vistas del mes
 *      - Clases ya marcadas como Class Lost del mes
 */
const processMonthlyClassClosure = async () => {
    try {
        console.log('[CRONJOB MENSUAL] Iniciando procesamiento de cierre mensual de clases...');
        const now = new Date();
        
        // Obtener mes y año actual (el mes que está terminando)
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
        const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        // Calcular rango del mes: primer día y último día del mes
        const firstDayOfMonth = `${monthYear}-01`;
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate(); // Último día del mes
        const lastDayOfMonthStr = `${monthYear}-${String(lastDayOfMonth).padStart(2, '0')}`;

        console.log(`[CRONJOB MENSUAL] Procesando clases del mes: ${monthYear} (${firstDayOfMonth} a ${lastDayOfMonthStr})`);

        // Buscar todos los enrollments que tengan clases en el mes actual
        // Primero, buscar todas las ClassRegistry del mes
        const classesInMonth = await ClassRegistry.find({
            classDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonthStr }
        }).select('enrollmentId').lean();

        // Obtener IDs únicos de enrollments
        const enrollmentIds = [...new Set(classesInMonth.map(c => c.enrollmentId.toString()))];
        
        if (enrollmentIds.length === 0) {
            console.log(`[CRONJOB MENSUAL] No se encontraron enrollments con clases en el mes ${monthYear}`);
            return;
        }

        // Buscar todos los enrollments que tienen clases en el mes (sin filtrar por status)
        const enrollmentsToProcess = await Enrollment.find({
            _id: { $in: enrollmentIds }
        }).lean();

        console.log(`[CRONJOB MENSUAL] Encontrados ${enrollmentsToProcess.length} enrollments con clases en el mes ${monthYear} para procesar`);

        let processedCount = 0;
        let updatedClassesCount = 0;
        let notificationsCreated = 0;

        for (const enrollment of enrollmentsToProcess) {
            try {
                // Buscar todas las ClassRegistry de este enrollment
                const classRegistries = await ClassRegistry.find({
                    enrollmentId: enrollment._id
                }).lean();

                if (classRegistries.length === 0) {
                    console.log(`[CRONJOB MENSUAL] Enrollment ${enrollment._id} no tiene clases registradas`);
                    processedCount++;
                    continue;
                }

                // Filtrar clases que estén dentro del rango del mes actual
                const classesInMonth = classRegistries.filter(cr => {
                    // classDate está en formato YYYY-MM-DD (string)
                    const classDateStr = cr.classDate;
                    return classDateStr >= firstDayOfMonth && classDateStr <= lastDayOfMonthStr;
                });

                if (classesInMonth.length === 0) {
                    console.log(`[CRONJOB MENSUAL] Enrollment ${enrollment._id} no tiene clases en el mes ${monthYear}`);
                    processedCount++;
                    continue;
                }

                // Actualizar clases con classViewed = 0 → cambiar a classViewed = 4 (Class Lost) (solo del mes actual)
                const classesToUpdate = classesInMonth.filter(
                    cr => cr.classViewed === 0
                );

                if (classesToUpdate.length > 0) {
                    const classIdsToUpdate = classesToUpdate.map(cr => cr._id);
                    const updateResult = await ClassRegistry.updateMany(
                        {
                            _id: { $in: classIdsToUpdate },
                            classViewed: 0
                        },
                        {
                            $set: { classViewed: 4 } // Cambiar a Class Lost (clase perdida)
                        }
                    );
                    updatedClassesCount += updateResult.modifiedCount;
                    console.log(`[CRONJOB MENSUAL] Actualizadas ${updateResult.modifiedCount} clases a Class Lost (4) para enrollment ${enrollment._id} (mes ${monthYear})`);
                }

                // Obtener todas las clases del mes actualizadas (incluyendo las que acabamos de actualizar)
                const allClassesInMonth = await ClassRegistry.find({
                    enrollmentId: enrollment._id,
                    classDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonthStr }
                }).lean();

                // Contar estadísticas del mes
                const stats = {
                    classLostMarked: classesToUpdate.length, // Clases marcadas como Class Lost en este procesamiento
                    totalClassesInMonth: allClassesInMonth.length, // Total de clases del mes
                    viewedInMonth: 0, // classViewed = 1
                    partiallyViewedInMonth: 0, // classViewed = 2
                    alreadyClassLostInMonth: 0 // classViewed = 4 (ya estaban marcadas antes)
                };

                for (const classRecord of allClassesInMonth) {
                    if (classRecord.classViewed === 1) {
                        stats.viewedInMonth++;
                    } else if (classRecord.classViewed === 2) {
                        stats.partiallyViewedInMonth++;
                    } else if (classRecord.classViewed === 4) {
                        stats.alreadyClassLostInMonth++;
                    }
                }

                // Crear notificación con las estadísticas del mes
                await createMonthlyClassClosureNotification(enrollment, monthYear, stats);
                notificationsCreated++;

                processedCount++;
                console.log(`[CRONJOB MENSUAL] Enrollment ${enrollment._id} procesado (mes ${monthYear}): ${stats.classLostMarked} marcadas como Class Lost, ${stats.viewedInMonth} vistas, ${stats.partiallyViewedInMonth} parcialmente vistas, ${stats.alreadyClassLostInMonth} ya Class Lost`);
            } catch (error) {
                console.error(`[CRONJOB MENSUAL] Error procesando enrollment ${enrollment._id}:`, error.message);
                // Continuar con el siguiente enrollment
            }
        }

        console.log(`[CRONJOB MENSUAL] Procesamiento de cierre mensual completado:`);
        console.log(`  - Mes procesado: ${monthYear}`);
        console.log(`  - Enrollments procesados: ${processedCount}`);
        console.log(`  - Clases actualizadas a Class Lost (4): ${updatedClassesCount}`);
        console.log(`  - Notificaciones creadas: ${notificationsCreated}`);
        console.log('[CRONJOB MENSUAL] Finalizando procesamiento de cierre mensual de clases');

    } catch (error) {
        console.error('[CRONJOB MENSUAL] Error en procesamiento de cierre mensual de clases:', error);
    }
};

/**
 * Verifica si hoy es el último día del mes
 * @returns {boolean} true si hoy es el último día del mes
 */
const isLastDayOfMonth = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Si mañana es día 1, entonces hoy es el último día del mes
    return tomorrow.getDate() === 1;
};

/**
 * Inicializa el cronjob para procesar cierre mensual de clases
 * Se ejecuta el último día de cada mes a las 00:00 (medianoche)
 * Se programa para ejecutarse en días 28-31 y verifica si es el último día del mes
 */
const initMonthlyClassClosureCronjob = () => {
    // Cron expression para producción: '0 0 28-31 * *' = días 28-31 a las 00:00, luego verifica si es último día
    cron.schedule('0 0 28-31 * *', async () => {
        // Verificar si es el último día del mes
        if (!isLastDayOfMonth()) return;
        
        console.log(`[CRONJOB MENSUAL] Ejecutando cronjob de cierre mensual de clases - ${new Date().toISOString()}`);
        await processMonthlyClassClosure();
    }, {
        scheduled: true,
        timezone: "America/Caracas"
    });

    console.log('[CRONJOB MENSUAL] Cronjob de cierre mensual de clases configurado (último día del mes a medianoche - PRODUCCIÓN)');
};

module.exports = {
    processClassFinalization,
    initClassFinalizationCronjob,
    processMonthlyClassClosure,
    initMonthlyClassClosureCronjob
};

