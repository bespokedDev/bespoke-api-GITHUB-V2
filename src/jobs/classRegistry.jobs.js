// jobs/classRegistry.jobs.js
const cron = require('node-cron');
const Enrollment = require('../models/Enrollment');
const ClassRegistry = require('../models/ClassRegistry');
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');
const PenalizationRegistry = require('../models/PenalizationRegistry');
const mongoose = require('mongoose');

/**
 * Función helper para crear penalización y notificación por clases perdidas
 */
const createClassLostPenalization = async (enrollment, monthYear, numberOfClasses) => {
    try {
        // Validar que el enrollment tenga professorId
        if (!enrollment.professorId) {
            console.log(`[CRONJOB] Enrollment ${enrollment._id} no tiene professorId asignado. Omitiendo creación de penalización.`);
            return false;
        }

        const professorObjectId = new mongoose.Types.ObjectId(enrollment.professorId);
        
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

        // Construir descripción profesional
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                           'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const [year, month] = monthYear.split('-');
        const monthName = monthNames[parseInt(month) - 1];
        
        const penalizationDescription = `Las clases que no se gestionaron en el mes de ${monthName} ${year} pasarán a clases perdidas y el dinero de las mismas no se pagará. Para cualquier reclamo comunicarse con el admin de Bespoke.`;

        // Verificar si ya existe una penalización para este profesor y enrollment en este mes
        const existingPenalization = await PenalizationRegistry.findOne({
            professorId: professorObjectId,
            enrollmentId: enrollment._id,
            penalization_description: { $regex: monthName, $options: 'i' },
            status: 1
        });

        if (existingPenalization) {
            console.log(`[CRONJOB] Penalización ya existe para profesor ${enrollment.professorId} y enrollment ${enrollment._id} en el mes ${monthYear}. Omitiendo creación.`);
            return false;
        }

        // Crear penalización
        const newPenalization = new PenalizationRegistry({
            idPenalizacion: null,
            idpenalizationLevel: null,
            enrollmentId: enrollment._id,
            professorId: professorObjectId,
            studentId: null,
            penalization_description: penalizationDescription,
            penalizationMoney: null, // Amonestación, no monetaria
            lateFee: null,
            endDate: null,
            support_file: null,
            userId: null,
            payOutId: null,
            status: 1 // Activa
        });

        const savedPenalization = await newPenalization.save();
        console.log(`[CRONJOB] Penalización creada para profesor ${enrollment.professorId} por ${numberOfClasses} clase(s) perdida(s) en el mes ${monthYear}`);

        // Verificar si ya existe una notificación para este profesor, enrollment y penalización
        const existingNotification = await Notification.findOne({
            idProfessor: professorObjectId,
            idEnrollment: enrollment._id,
            idPenalization: savedPenalization._id,
            isActive: true
        });

        if (existingNotification) {
            console.log(`[CRONJOB] Notificación ya existe para profesor ${enrollment.professorId}, enrollment ${enrollment._id} y penalización ${savedPenalization._id}. Omitiendo creación.`);
            return true; // La penalización se creó, aunque la notificación ya exista
        }

        // Crear notificación
        const notificationDescription = `Las clases que no se gestionaron en el mes de ${monthName} ${year} del enrollment ${enrollment._id} pasarán a clases perdidas y el dinero de las mismas no se pagará. Para cualquier reclamo comunicarse con el admin de Bespoke.`;
        
        const newNotification = new Notification({
            idCategoryNotification: categoryNotification._id,
            notification_description: notificationDescription,
            idPenalization: savedPenalization._id,
            idEnrollment: enrollment._id,
            idProfessor: professorObjectId,
            idStudent: [],
            userId: null,
            isActive: true
        });

        await newNotification.save();
        console.log(`[CRONJOB] Notificación creada para profesor ${enrollment.professorId} y enrollment ${enrollment._id}`);
        return true;

    } catch (error) {
        console.error(`[CRONJOB] Error creando penalización y notificación por clases perdidas para enrollment ${enrollment._id}:`, error.message);
        return false;
    }
};

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
 * Se ejecuta el último día de cada mes a las 00:00 (medianoche)
 * 
 * Reglas de negocio:
 * 1. Buscar enrollments cuyo endDate < fecha actual
 * 2. Para cada enrollment:
 *    - Revisar todas sus ClassRegistry
 *    - Si classViewed = 0 y reschedule = 0 → cambiar a classViewed = 4 (Class Lost - clase perdida)
 *    - Si se actualizaron clases a Class Lost, crear penalización y notificación para el profesor
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

        // Obtener mes y año actual (el mes que está terminando)
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
        const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        // Buscar enrollments cuyo endDate < fecha actual
        // Buscar todos los enrollments (activos e inactivos) que hayan vencido
        const expiredEnrollments = await Enrollment.find({
            endDate: { $lt: now }
        }).lean();

        console.log(`[CRONJOB] Encontrados ${expiredEnrollments.length} enrollments vencidos para procesar`);
        console.log(`[CRONJOB] Procesando clases del mes: ${monthYear}`);

        let processedCount = 0;
        let updatedClassesCount = 0;
        let notificationsCreated = 0;
        let penalizationsCreated = 0;

        for (const enrollment of expiredEnrollments) {
            try {
                // Verificar si el enrollment está en pausa (status: 3)
                if (enrollment.status === 3) {
                    // Si está en pausa pero no tiene pauseDate, saltar completamente
                    if (!enrollment.pauseDate) {
                        console.log(`[CRONJOB] Enrollment ${enrollment._id} está en pausa (status: 3) pero no tiene pauseDate. Omitiendo procesamiento.`);
                        processedCount++;
                        continue;
                    }
                    // Si tiene pauseDate, solo procesar clases anteriores a la pausa
                    // Convertir pauseDate a string YYYY-MM-DD para comparar con classDate
                    const pauseDateStr = new Date(enrollment.pauseDate).toISOString().split('T')[0];
                    console.log(`[CRONJOB] Enrollment ${enrollment._id} está en pausa. Solo procesando clases anteriores a ${pauseDateStr}`);
                }

                // Buscar todas las ClassRegistry de este enrollment
                const classRegistries = await ClassRegistry.find({
                    enrollmentId: enrollment._id
                }).lean();

                if (classRegistries.length === 0) {
                    console.log(`[CRONJOB] Enrollment ${enrollment._id} no tiene clases registradas`);
                    processedCount++;
                    continue;
                }

                // Filtrar clases según el estado de pausa
                let classesToProcess = classRegistries;
                if (enrollment.status === 3 && enrollment.pauseDate) {
                    const pauseDateStr = new Date(enrollment.pauseDate).toISOString().split('T')[0];
                    // Solo procesar clases donde classDate < pauseDate
                    classesToProcess = classRegistries.filter(cr => {
                        const classDateStr = cr.classDate; // classDate ya es string YYYY-MM-DD
                        return classDateStr < pauseDateStr;
                    });
                    console.log(`[CRONJOB] Enrollment ${enrollment._id}: ${classesToProcess.length} clases anteriores a la pausa de ${classRegistries.length} totales`);
                }

                // Actualizar clases con classViewed = 0 y reschedule = 0 → cambiar a classViewed = 4 (Class Lost)
                const classesToUpdate = classesToProcess.filter(
                    cr => cr.classViewed === 0 && cr.reschedule === 0
                );

                if (classesToUpdate.length > 0) {
                    // Obtener IDs de las clases a actualizar
                    const classIdsToUpdate = classesToUpdate.map(cr => cr._id);
                    const updateResult = await ClassRegistry.updateMany(
                        {
                            _id: { $in: classIdsToUpdate },
                            classViewed: 0,
                            reschedule: 0
                        },
                        {
                            $set: { classViewed: 4 } // Cambiar a Class Lost (clase perdida)
                        }
                    );
                    updatedClassesCount += updateResult.modifiedCount;
                    console.log(`[CRONJOB] Actualizadas ${updateResult.modifiedCount} clases a Class Lost (4) para enrollment ${enrollment._id}`);

                    // Crear penalización y notificación para el profesor cuando se actualizan clases a Class Lost
                    const penalizationCreated = await createClassLostPenalization(
                        enrollment, 
                        monthYear, 
                        updateResult.modifiedCount
                    );
                    if (penalizationCreated) {
                        penalizationsCreated++;
                    }
                }

                // Obtener todas las clases a procesar (solo las que cumplen el criterio de pausa si aplica)
                const allClasses = classesToProcess;

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

                // Crear notificación con las estadísticas (solo si no existe ya)
                const notificationCreated = await createClassFinalizationNotification(enrollment, stats);
                if (notificationCreated) {
                    notificationsCreated++;
                }

                processedCount++;
                console.log(`[CRONJOB] Enrollment ${enrollment._id} procesado: ${stats.classLostCount} Class Lost, ${stats.viewedCount} vistas, ${stats.partiallyViewedCount} parcialmente vistas, ${stats.partiallyViewedWithRescheduleCount} parcialmente vistas con reschedule`);
            } catch (error) {
                console.error(`[CRONJOB] Error procesando enrollment ${enrollment._id}:`, error.message);
                // Continuar con el siguiente enrollment
            }
        }

        console.log(`[CRONJOB] Procesamiento de finalización de clases completado:`);
        console.log(`  - Mes procesado: ${monthYear}`);
        console.log(`  - Enrollments procesados: ${processedCount}`);
        console.log(`  - Clases actualizadas a Class Lost (4): ${updatedClassesCount}`);
        console.log(`  - Penalizaciones creadas: ${penalizationsCreated}`);
        console.log(`  - Notificaciones creadas: ${notificationsCreated}`);
        console.log('[CRONJOB] Finalizando procesamiento de finalización de clases');

    } catch (error) {
        console.error('[CRONJOB] Error en procesamiento de finalización de clases:', error);
    }
};

/**
 * Verifica si hoy es el último día del mes
 * @returns {boolean} true si hoy es el último día del mes
 */
const isLastDayOfMonthForFinalization = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Si mañana es día 1, entonces hoy es el último día del mes
    return tomorrow.getDate() === 1;
};

/**
 * Inicializa el cronjob para procesar finalización de clases
 * Se ejecuta el último día de cada mes a las 00:00 (medianoche)
 */
const initClassFinalizationCronjob = () => {
    // Cron expression para producción: '0 0 28-31 * *' = días 28-31 a las 00:00, luego verifica si es último día
    cron.schedule('0 0 28-31 * *', async () => {
        // Verificar si es el último día del mes
        if (!isLastDayOfMonthForFinalization()) return;
        
        console.log(`[CRONJOB] Ejecutando cronjob de finalización de clases - ${new Date().toISOString()}`);
        await processClassFinalization();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });

    console.log('[CRONJOB] Cronjob de finalización de clases configurado (último día del mes a medianoche - PRODUCCIÓN)');
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

        // Verificar si ya existe una notificación de cierre mensual para este enrollment y mes
        // Buscar notificaciones con el mismo idEnrollment, idCategoryNotification y que contengan el mes/año en la descripción
        const monthYearPattern = `${monthName.toUpperCase()} ${year}`;
        const existingNotification = await Notification.findOne({
            idEnrollment: enrollment._id,
            idCategoryNotification: categoryNotificationId,
            notification_description: { $regex: monthYearPattern, $options: 'i' }, // Case-insensitive
            isActive: true
        });

        if (existingNotification) {
            console.log(`[CRONJOB MENSUAL] Notificación de cierre mensual ya existe para enrollment ${enrollment._id} - ${monthYear}. Omitiendo creación.`);
            return false; // Ya existe, no crear duplicado
        }

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
                // Verificar si el enrollment está en pausa (status: 3)
                if (enrollment.status === 3) {
                    // Si está en pausa pero no tiene pauseDate, saltar completamente
                    if (!enrollment.pauseDate) {
                        console.log(`[CRONJOB MENSUAL] Enrollment ${enrollment._id} está en pausa (status: 3) pero no tiene pauseDate. Omitiendo procesamiento.`);
                        processedCount++;
                        continue;
                    }
                    // Si tiene pauseDate, solo procesar clases anteriores a la pausa
                    const pauseDateStr = new Date(enrollment.pauseDate).toISOString().split('T')[0];
                    console.log(`[CRONJOB MENSUAL] Enrollment ${enrollment._id} está en pausa. Solo procesando clases anteriores a ${pauseDateStr}`);
                }

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
                let classesInMonth = classRegistries.filter(cr => {
                    // classDate está en formato YYYY-MM-DD (string)
                    const classDateStr = cr.classDate;
                    return classDateStr >= firstDayOfMonth && classDateStr <= lastDayOfMonthStr;
                });

                // Si el enrollment está en pausa y tiene pauseDate, filtrar también por pauseDate
                if (enrollment.status === 3 && enrollment.pauseDate) {
                    const pauseDateStr = new Date(enrollment.pauseDate).toISOString().split('T')[0];
                    // Solo procesar clases donde classDate < pauseDate
                    classesInMonth = classesInMonth.filter(cr => {
                        const classDateStr = cr.classDate;
                        return classDateStr < pauseDateStr;
                    });
                    console.log(`[CRONJOB MENSUAL] Enrollment ${enrollment._id}: ${classesInMonth.length} clases del mes anteriores a la pausa`);
                }

                if (classesInMonth.length === 0) {
                    console.log(`[CRONJOB MENSUAL] Enrollment ${enrollment._id} no tiene clases en el mes ${monthYear} (o todas son posteriores a la pausa)`);
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

                // Obtener todas las clases del mes a procesar (solo las que cumplen el criterio de pausa si aplica)
                const allClassesInMonth = classesInMonth;

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

                // Crear notificación con las estadísticas del mes (solo si no existe ya)
                const notificationCreated = await createMonthlyClassClosureNotification(enrollment, monthYear, stats);
                if (notificationCreated) {
                    notificationsCreated++;
                }

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

/**
 * Función helper para calcular el rango de la semana (lunes a domingo)
 * @param {Date} sundayDate - Fecha del domingo (día de ejecución del cronjob)
 * @returns {Object} Objeto con startDate (lunes) y endDate (domingo) en formato YYYY-MM-DD
 */
const calculateWeekRange = (sundayDate) => {
    const date = new Date(sundayDate);
    date.setHours(0, 0, 0, 0);
    
    // Verificar que sea domingo (0 = domingo)
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0) {
        console.warn(`[CRONJOB SEMANAL] Advertencia: El cronjob se ejecutó en un día que no es domingo (día ${dayOfWeek}). Ajustando al domingo anterior.`);
    }
    
    // Calcular el lunes de la semana (retroceder 6 días desde el domingo)
    const mondayDate = new Date(date);
    mondayDate.setDate(date.getDate() - 6); // Retroceder 6 días desde el domingo para llegar al lunes
    
    // Formatear fechas como YYYY-MM-DD
    const formatDate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    return {
        startDate: formatDate(mondayDate), // Lunes
        endDate: formatDate(date) // Domingo (día de ejecución)
    };
};

/**
 * Cronjob para revisar clases no gestionadas semanalmente
 * Se ejecuta los domingos a las 00:00 (medianoche)
 * 
 * Reglas de negocio:
 * 1. Calcular el rango de la semana (lunes a domingo del domingo de ejecución)
 * 2. Buscar ClassRegistry con classViewed = 0, reschedule = 0 y classDate dentro del rango
 * 3. Agrupar por professorId (obtenido del enrollment)
 * 4. Para cada profesor único:
 *    - Crear una penalización administrativa con advertencia
 *    - Crear una notificación vinculada a la penalización
 */
const processWeeklyUnguidedClasses = async () => {
    try {
        console.log('[CRONJOB SEMANAL] Iniciando procesamiento de clases no gestionadas semanalmente...');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // Calcular el rango de la semana (lunes a domingo)
        const weekRange = calculateWeekRange(now);
        console.log(`[CRONJOB SEMANAL] Rango de semana: ${weekRange.startDate} (lunes) a ${weekRange.endDate} (domingo)`);
        
        // Buscar ClassRegistry con classViewed = 0, reschedule = 0 y classDate dentro del rango
        const unguidedClasses = await ClassRegistry.find({
            classViewed: 0,
            reschedule: 0,
            classDate: { $gte: weekRange.startDate, $lte: weekRange.endDate }
        }).select('enrollmentId classDate').lean();
        
        console.log(`[CRONJOB SEMANAL] Encontradas ${unguidedClasses.length} clases no gestionadas en la semana`);
        
        if (unguidedClasses.length === 0) {
            console.log('[CRONJOB SEMANAL] No hay clases no gestionadas para procesar');
            return;
        }
        
        // Obtener IDs únicos de enrollments
        const enrollmentIds = [...new Set(unguidedClasses.map(c => c.enrollmentId.toString()))];
        
        // Buscar enrollments con sus professorId, status y pauseDate
        const enrollments = await Enrollment.find({
            _id: { $in: enrollmentIds }
        }).select('_id professorId status pauseDate').lean();
        
        // Crear un mapa de enrollmentId -> enrollment para verificar status y pauseDate
        const enrollmentMap = new Map();
        enrollments.forEach(enrollment => {
            enrollmentMap.set(enrollment._id.toString(), enrollment);
        });
        
        // Filtrar clases según el estado de pausa de los enrollments
        const filteredUnguidedClasses = unguidedClasses.filter(classRecord => {
            const enrollmentId = classRecord.enrollmentId.toString();
            const enrollment = enrollmentMap.get(enrollmentId);
            
            if (!enrollment) {
                return false; // Si no se encuentra el enrollment, excluir la clase
            }
            
            // Si el enrollment está en pausa (status: 3)
            if (enrollment.status === 3) {
                // Si no tiene pauseDate, excluir completamente
                if (!enrollment.pauseDate) {
                    return false;
                }
                // Si tiene pauseDate, solo incluir clases donde classDate < pauseDate
                const pauseDateStr = new Date(enrollment.pauseDate).toISOString().split('T')[0];
                const classDateStr = classRecord.classDate; // classDate ya es string YYYY-MM-DD
                return classDateStr < pauseDateStr;
            }
            
            // Si no está en pausa, incluir normalmente
            return true;
        });
        
        console.log(`[CRONJOB SEMANAL] Clases no gestionadas después de filtrar enrollments en pausa: ${filteredUnguidedClasses.length} de ${unguidedClasses.length}`);
        
        if (filteredUnguidedClasses.length === 0) {
            console.log('[CRONJOB SEMANAL] No hay clases no gestionadas para procesar después del filtrado');
            return;
        }
        
        // Crear un mapa de enrollmentId -> professorId
        const enrollmentToProfessorMap = new Map();
        enrollments.forEach(enrollment => {
            if (enrollment.professorId) {
                enrollmentToProfessorMap.set(enrollment._id.toString(), enrollment.professorId.toString());
            }
        });
        
        // Agrupar clases por professorId (usar las clases filtradas)
        const classesByProfessor = new Map();
        filteredUnguidedClasses.forEach(classRecord => {
            const enrollmentId = classRecord.enrollmentId.toString();
            const professorId = enrollmentToProfessorMap.get(enrollmentId);
            
            if (professorId) {
                if (!classesByProfessor.has(professorId)) {
                    classesByProfessor.set(professorId, []);
                }
                classesByProfessor.get(professorId).push(classRecord);
            } else {
                console.log(`[CRONJOB SEMANAL] Advertencia: Enrollment ${enrollmentId} no tiene professorId asignado`);
            }
        });
        
        console.log(`[CRONJOB SEMANAL] Profesores con clases no gestionadas: ${classesByProfessor.size}`);
        
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
            console.log('[CRONJOB SEMANAL] Categoría de notificación "Administrativa" creada');
        }
        
        let penalizationsCreated = 0;
        let notificationsCreated = 0;
        
        // Procesar cada profesor
        for (const [professorId, classes] of classesByProfessor) {
            try {
                const professorObjectId = new mongoose.Types.ObjectId(professorId);
                const numberOfClasses = classes.length;
                
                // Construir descripción de la penalización
                const weekRangeText = `del ${weekRange.startDate} al ${weekRange.endDate}`;
                const penalizationDescription = `Aviso: El profesor no ha gestionado ${numberOfClasses} clase(s) ${numberOfClasses > 1 ? 'semanales' : 'semanal'} ${weekRangeText}. ` +
                    `Este es un aviso administrativo. Si al final del mes estas clases no han sido gestionadas, ` +
                    `se tomarán como "lost class" (clase perdida) y el dinero correspondiente no se pagará al profesor.`;
                
                // Verificar si ya existe una penalización para este profesor en esta semana
                const existingPenalization = await PenalizationRegistry.findOne({
                    professorId: professorObjectId,
                    penalization_description: { $regex: weekRangeText, $options: 'i' },
                    status: 1
                });
                
                if (existingPenalization) {
                    console.log(`[CRONJOB SEMANAL] Penalización ya existe para profesor ${professorId} en la semana ${weekRangeText}. Omitiendo creación.`);
                    continue;
                }
                
                // Crear penalización
                const newPenalization = new PenalizationRegistry({
                    idPenalizacion: null,
                    idpenalizationLevel: null,
                    enrollmentId: null,
                    professorId: professorObjectId,
                    studentId: null,
                    penalization_description: penalizationDescription,
                    penalizationMoney: null, // Amonestación, no monetaria
                    lateFee: null,
                    endDate: null,
                    support_file: null,
                    userId: null,
                    payOutId: null,
                    status: 1 // Activa
                });
                
                const savedPenalization = await newPenalization.save();
                penalizationsCreated++;
                console.log(`[CRONJOB SEMANAL] Penalización creada para profesor ${professorId} (${numberOfClasses} clase(s) no gestionada(s))`);
                
                // Verificar si ya existe una notificación para este profesor y penalización
                const existingNotification = await Notification.findOne({
                    idProfessor: professorObjectId,
                    idPenalization: savedPenalization._id,
                    isActive: true
                });
                
                if (existingNotification) {
                    console.log(`[CRONJOB SEMANAL] Notificación ya existe para profesor ${professorId} y penalización ${savedPenalization._id}. Omitiendo creación.`);
                    continue;
                }
                
                // Crear notificación
                const newNotification = new Notification({
                    idCategoryNotification: categoryNotification._id,
                    notification_description: 'Amonestación laboral por incumplimiento de gestion de las clases semanales',
                    idPenalization: savedPenalization._id,
                    idEnrollment: null,
                    idProfessor: professorObjectId,
                    idStudent: [],
                    userId: null,
                    isActive: true
                });
                
                await newNotification.save();
                notificationsCreated++;
                console.log(`[CRONJOB SEMANAL] Notificación creada para profesor ${professorId}`);
                
            } catch (error) {
                console.error(`[CRONJOB SEMANAL] Error procesando profesor ${professorId}:`, error.message);
                // Continuar con el siguiente profesor
            }
        }
        
        console.log(`[CRONJOB SEMANAL] Procesamiento de clases no gestionadas completado:`);
        console.log(`  - Semana procesada: ${weekRange.startDate} a ${weekRange.endDate}`);
        console.log(`  - Clases no gestionadas encontradas: ${unguidedClasses.length}`);
        console.log(`  - Clases después de filtrar enrollments en pausa: ${filteredUnguidedClasses.length}`);
        console.log(`  - Profesores afectados: ${classesByProfessor.size}`);
        console.log(`  - Penalizaciones creadas: ${penalizationsCreated}`);
        console.log(`  - Notificaciones creadas: ${notificationsCreated}`);
        console.log('[CRONJOB SEMANAL] Finalizando procesamiento de clases no gestionadas semanalmente');
        
    } catch (error) {
        console.error('[CRONJOB SEMANAL] Error en procesamiento de clases no gestionadas semanalmente:', error);
    }
};

/**
 * Inicializa el cronjob para procesar clases no gestionadas semanalmente
 * Se ejecuta los domingos a las 00:00 (medianoche)
 */
const initWeeklyUnguidedClassesCronjob = () => {
    // Cron expression para producción: '0 0 * * 0' = todos los domingos a las 00:00
    cron.schedule('0 0 * * 0', async () => {
        console.log(`[CRONJOB SEMANAL] Ejecutando cronjob de clases no gestionadas semanalmente - ${new Date().toISOString()}`);
        await processWeeklyUnguidedClasses();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });
    
    console.log('[CRONJOB SEMANAL] Cronjob de clases no gestionadas semanalmente configurado (domingos a medianoche - PRODUCCIÓN)');
};

module.exports = {
    processClassFinalization,
    initClassFinalizationCronjob,
    processMonthlyClassClosure,
    initMonthlyClassClosureCronjob,
    processWeeklyUnguidedClasses,
    initWeeklyUnguidedClassesCronjob
};

