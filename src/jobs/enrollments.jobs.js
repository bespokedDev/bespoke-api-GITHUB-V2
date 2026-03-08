// jobs/enrollments.jobs.js
const cron = require('node-cron');
const Enrollment = require('../models/Enrollment');
const Penalizacion = require('../models/Penalizacion');
const PenalizationRegistry = require('../models/PenalizationRegistry');
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');
const Plan = require('../models/Plans');
const Student = require('../models/Student');
const ClassRegistry = require('../models/ClassRegistry');
const EnrollmentCycleHistory = require('../models/EnrollmentCycleHistory');
const mongoose = require('mongoose');

// --- Helpers para cálculo de fechas de clases (misma lógica que en enrollments.controllers.js) ---
const dayMap = {
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
};

const calculateClassDates = (startDate, endDate, scheduledDays, weeklyClasses) => {
    if (!startDate || !endDate || !scheduledDays || scheduledDays.length === 0) return [];
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const endDateObj = new Date(endDate);
    const end = new Date(Date.UTC(endDateObj.getUTCFullYear(), endDateObj.getUTCMonth(), endDateObj.getUTCDate(), 0, 0, 0, 0));
    const scheduledDayNumbers = scheduledDays.map(sd => dayMap[sd.day]).filter(d => d !== undefined);
    if (scheduledDayNumbers.length === 0) return [];
    const classDates = [];
    const currentDate = new Date(start);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endYear = end.getUTCFullYear(), endMonth = end.getUTCMonth(), endDay = end.getUTCDate();
    while (true) {
        const cy = currentDate.getUTCFullYear(), cm = currentDate.getUTCMonth(), cd = currentDate.getUTCDate();
        if (cy > endYear || (cy === endYear && cm > endMonth) || (cy === endYear && cm === endMonth && cd > endDay)) break;
        if (scheduledDayNumbers.includes(currentDate.getUTCDay())) {
            const dateToAdd = new Date(currentDate);
            dateToAdd.setUTCHours(0, 0, 0, 0);
            classDates.push(dateToAdd);
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
    }
    const limitedDates = [];
    const weeks = {};
    classDates.forEach(date => {
        const dateCopy = new Date(date);
        dateCopy.setUTCHours(0, 0, 0, 0);
        const dayOfWeek = dateCopy.getUTCDay();
        const weekStart = new Date(dateCopy);
        weekStart.setUTCDate(dateCopy.getUTCDate() - dayOfWeek);
        weekStart.setUTCHours(0, 0, 0, 0);
        const weekKey = weekStart.getTime();
        if (!weeks[weekKey]) weeks[weekKey] = [];
        weeks[weekKey].push(new Date(dateCopy));
    });
    Object.keys(weeks).map(k => parseInt(k)).sort((a, b) => a - b).forEach(weekKey => {
        const weekDates = weeks[weekKey].sort((a, b) => a.getTime() - b.getTime());
        limitedDates.push(...weekDates.slice(0, weeklyClasses));
    });
    return limitedDates.sort((a, b) => a.getTime() - b.getTime());
};

const calculateClassDatesByWeeks = (startDate, numberOfWeeks, scheduledDays, weeklyClasses) => {
    if (!startDate || !numberOfWeeks || numberOfWeeks <= 0 || !scheduledDays || scheduledDays.length === 0) return [];
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const scheduledDayNumbers = scheduledDays.map(sd => dayMap[sd.day]).filter(d => d !== undefined);
    if (scheduledDayNumbers.length === 0) return [];
    const firstWeekSunday = new Date(start);
    firstWeekSunday.setUTCDate(start.getUTCDate() - start.getUTCDay());
    firstWeekSunday.setUTCHours(0, 0, 0, 0);
    const classDates = [];
    for (let week = 0; week < numberOfWeeks; week++) {
        const weekStartDate = new Date(firstWeekSunday);
        weekStartDate.setUTCDate(firstWeekSunday.getUTCDate() + (week * 7));
        weekStartDate.setUTCHours(0, 0, 0, 0);
        const weekDates = [];
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = new Date(weekStartDate);
            currentDate.setUTCDate(weekStartDate.getUTCDate() + dayOffset);
            currentDate.setUTCHours(0, 0, 0, 0);
            if (scheduledDayNumbers.includes(currentDate.getUTCDay())) {
                if (week === 0 && currentDate.getTime() < start.getTime()) continue;
                weekDates.push(new Date(currentDate));
            }
        }
        weekDates.sort((a, b) => a.getTime() - b.getTime());
        classDates.push(...weekDates.slice(0, weeklyClasses));
    }
    return classDates.sort((a, b) => a.getTime() - b.getTime());
};

/** Categoría Administrativa para notificaciones de renovación */
const ADMINISTRATIVA_CATEGORY_ID = new mongoose.Types.ObjectId('6941c9b30646c9359c7f9f68');

/**
 * Crea notificación cuando no se pudo renovar por falta de fondos
 */
const createRenewalFailureNotification = async (enrollment) => {
    try {
        const studentIds = (enrollment.studentIds || [])
            .map(s => {
                if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) return s.studentId._id;
                return s.studentId ? (typeof s.studentId === 'string' ? new mongoose.Types.ObjectId(s.studentId) : s.studentId) : null;
            })
            .filter(id => id != null);
        if (studentIds.length === 0) return false;
        const newNotification = new Notification({
            idCategoryNotification: ADMINISTRATIVA_CATEGORY_ID,
            notification_description: 'No se pudo hacer la renovación de su suscripción por falta de fondos.',
            idPenalization: null,
            idEnrollment: enrollment._id,
            idProfessor: null,
            idStudent: studentIds,
            isActive: true
        });
        await newNotification.save();
        console.log(`[CRONJOB RENOVACIÓN] Notificación de fallo de renovación creada para enrollment ${enrollment._id}`);
        return true;
    } catch (err) {
        console.error(`[CRONJOB RENOVACIÓN] Error creando notificación de fallo para enrollment ${enrollment._id}:`, err.message);
        return false;
    }
};

/**
 * Cronjob de renovación automática de enrollments.
 * Se ejecuta diariamente; procesa enrollments con endDate = hoy y status = 1.
 * Si hay saldo suficiente: guarda ciclo en EnrollmentCycleHistory, marca clases no vistas como 4, crea nuevo ciclo y ClassRegistry.
 * Si no hay saldo: status = 2, notificación y marca classViewed 0 → 4.
 */
const processEnrollmentRenewals = async () => {
    try {
        console.log('[CRONJOB RENOVACIÓN] Iniciando procesamiento de renovaciones...');
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
        todayEnd.setUTCMilliseconds(-1);

        const enrollments = await Enrollment.find({
            status: 1,
            endDate: { $gte: today, $lte: todayEnd }
        })
            .populate('planId')
            .lean();

        if (!enrollments.length) {
            console.log('[CRONJOB RENOVACIÓN] No hay enrollments con endDate hoy. Finalizando.');
            return;
        }

        console.log(`[CRONJOB RENOVACIÓN] Encontrados ${enrollments.length} enrollments a procesar.`);

        for (const enrollment of enrollments) {
            try {
                const plan = enrollment.planId;
                if (!plan || !plan.pricing) {
                    console.warn(`[CRONJOB RENOVACIÓN] Enrollment ${enrollment._id} sin plan o pricing. Omitiendo.`);
                    continue;
                }
                const studentCount = (enrollment.studentIds || []).length;
                if (studentCount === 0) {
                    console.warn(`[CRONJOB RENOVACIÓN] Enrollment ${enrollment._id} sin estudiantes. Omitiendo.`);
                    continue;
                }
                const availableBalance = enrollment.available_balance != null ? Number(enrollment.available_balance) : 0;
                const totalAmount = Number(enrollment.totalAmount);
                const enrollmentType = enrollment.enrollmentType || 'single';
                const priceKey = enrollmentType;
                const unitPrice = plan.pricing[priceKey] != null ? Number(plan.pricing[priceKey]) : 0;
                const nuevoTotal = unitPrice * studentCount;

                const noRenew = async () => {
                    await Enrollment.findByIdAndUpdate(enrollment._id, { status: 2 });
                    await createRenewalFailureNotification(enrollment);
                    await ClassRegistry.updateMany(
                        { enrollmentId: enrollment._id, classViewed: 0 },
                        { $set: { classViewed: 4 } }
                    );
                };

                if (availableBalance < totalAmount) {
                    await noRenew();
                    continue;
                }
                if (nuevoTotal > availableBalance) {
                    await noRenew();
                    continue;
                }

                const startDate = new Date(enrollment.startDate);
                const endDate = new Date(enrollment.endDate);
                const monthlyClasses = Math.max(1, Number(enrollment.monthlyClasses) || 1);
                const pricePerHour = totalAmount / monthlyClasses;

                // Actualizar balanceRemaining del ciclo que termina (dinero que quedaba al cierre)
                await EnrollmentCycleHistory.findOneAndUpdate(
                    {
                        enrollmentId: enrollment._id,
                        startDate,
                        endDate
                    },
                    { $set: { balanceRemaining: availableBalance } }
                ).catch(() => {});

                await ClassRegistry.updateMany(
                    { enrollmentId: enrollment._id, classViewed: 0 },
                    { $set: { classViewed: 4 } }
                );

                const newStartDate = new Date(endDate);
                newStartDate.setUTCDate(newStartDate.getUTCDate() + 1);
                newStartDate.setUTCHours(0, 0, 0, 0);
                const scheduledDays = enrollment.scheduledDays || [];

                let newEndDate;
                let newMonthlyClasses;
                let classDates = [];

                if (plan.planType === 1) {
                    newEndDate = new Date(newStartDate);
                    newEndDate.setUTCMonth(newEndDate.getUTCMonth() + 1);
                    newEndDate.setUTCDate(newEndDate.getUTCDate() - 1);
                    newEndDate.setUTCHours(23, 59, 59, 999);
                    classDates = calculateClassDates(newStartDate, newEndDate, scheduledDays, plan.weeklyClasses || 0);
                    newMonthlyClasses = classDates.length;
                } else if (plan.planType === 2 && plan.weeks) {
                    const firstWeekSunday = new Date(newStartDate);
                    firstWeekSunday.setUTCDate(newStartDate.getUTCDate() - newStartDate.getUTCDay());
                    firstWeekSunday.setUTCHours(0, 0, 0, 0);
                    const endDateObj = new Date(firstWeekSunday);
                    endDateObj.setUTCDate(firstWeekSunday.getUTCDate() + (plan.weeks * 7) - 1);
                    endDateObj.setUTCHours(23, 59, 59, 999);
                    newEndDate = new Date(endDateObj);
                    newEndDate.setUTCDate(newEndDate.getUTCDate() - 1);
                    newEndDate.setUTCHours(23, 59, 59, 999);
                    newMonthlyClasses = plan.weeks * (plan.weeklyClasses || 0);
                    classDates = calculateClassDatesByWeeks(newStartDate, plan.weeks, scheduledDays, plan.weeklyClasses || 0);
                } else {
                    console.warn(`[CRONJOB RENOVACIÓN] Plan ${plan._id} sin planType 1/2 o weeks. Omitiendo enrollment ${enrollment._id}.`);
                    continue;
                }

                const classRegistries = classDates.map(classDate => {
                    const d = new Date(classDate);
                    const y = d.getUTCFullYear();
                    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(d.getUTCDate()).padStart(2, '0');
                    return {
                        enrollmentId: enrollment._id,
                        classDate: `${y}-${m}-${day}`,
                        classTime: null,
                        reschedule: 0,
                        classViewed: 0,
                        minutesClassDefault: 60,
                        vocabularyContent: null
                    };
                });

                if (classRegistries.length > 0) {
                    await ClassRegistry.insertMany(classRegistries);
                }

                const newBalance = availableBalance - nuevoTotal;
                const balancePerClass = newMonthlyClasses > 0 ? nuevoTotal / newMonthlyClasses : nuevoTotal;

                await Enrollment.findByIdAndUpdate(enrollment._id, {
                    startDate: newStartDate,
                    endDate: newEndDate,
                    monthlyClasses: newMonthlyClasses,
                    totalAmount: nuevoTotal,
                    available_balance: Math.max(0, newBalance),
                    balance_per_class: balancePerClass
                });

                // Crear historial del nuevo ciclo (balanceRemaining se actualizará a fin de mes)
                const newPricePerHour = newMonthlyClasses > 0 ? nuevoTotal / newMonthlyClasses : 0;
                await EnrollmentCycleHistory.create({
                    enrollmentId: enrollment._id,
                    startDate: newStartDate,
                    endDate: newEndDate,
                    totalAmount: nuevoTotal,
                    monthlyClasses: newMonthlyClasses,
                    pricePerHour: parseFloat(newPricePerHour.toFixed(2)),
                    balanceRemaining: null
                });

                console.log(`[CRONJOB RENOVACIÓN] Renovado enrollment ${enrollment._id}: ${classRegistries.length} clases.`);
            } catch (err) {
                console.error(`[CRONJOB RENOVACIÓN] Error procesando enrollment ${enrollment._id}:`, err.message);
            }
        }

        console.log('[CRONJOB RENOVACIÓN] Procesamiento de renovaciones finalizado.');
    } catch (err) {
        console.error('[CRONJOB RENOVACIÓN] Error general:', err.message);
    }
};

/**
 * Inicializa el cronjob de renovación automática de enrollments (diario 00:00)
 */
const initEnrollmentRenewalsCronjob = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log(`[CRONJOB RENOVACIÓN] Ejecutando renovaciones - ${new Date().toISOString()}`);
        await processEnrollmentRenewals();
    }, {
        scheduled: true,
        timezone: 'America/Caracas'
    });
    console.log('[CRONJOB RENOVACIÓN] Cronjob de renovación configurado (diario a medianoche).');
};

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

        // Verificar si ya existe una notificación de anulación para este enrollment
        const existingNotification = await Notification.findOne({
            idEnrollment: enrollment._id,
            idCategoryNotification: categoryNotification._id,
            notification_description: { $regex: 'Enrollment anulado por vencimiento de fecha de pago', $options: 'i' },
            isActive: true
        });

        if (existingNotification) {
            console.log(`[CRONJOB] Notificación de anulación ya existe para enrollment ${enrollment._id}. Omitiendo creación.`);
            return false; // Ya existe, no crear duplicado
        }

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
                                    endDate: enrollment.endDate,
                                    status: 1 // Activa por defecto
                                });

                                const savedPenalizationRegistry = await newPenalizationRegistry.save();
                                penalizedCount++;

                                // Incrementar penalizationCount del enrollment
                                try {
                                    await Enrollment.findByIdAndUpdate(
                                        enrollment._id,
                                        { $inc: { penalizationCount: 1 } },
                                        { new: true, runValidators: true }
                                    );
                                    console.log(`[CRONJOB] penalizationCount incrementado para enrollment ${enrollment._id}`);
                                } catch (enrollmentUpdateError) {
                                    console.error(`[CRONJOB] Error al incrementar penalizationCount para enrollment ${enrollment._id}:`, enrollmentUpdateError.message);
                                    // No fallar el proceso si falla la actualización del enrollment
                                }

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

                                // Verificar si ya existe una notificación de penalización para este enrollment
                                const existingPenalizationNotification = await Notification.findOne({
                                    idEnrollment: enrollment._id,
                                    idCategoryNotification: categoryNotification._id,
                                    idPenalization: penalizationType._id,
                                    notification_description: 'penalización por vencimiento de dias de pago',
                                    isActive: true
                                });

                                // Crear notificación solo si no existe ya
                                // La notificación apunta al tipo de penalización (Penalizacion), no al registro
                                if (!existingPenalizationNotification && studentIds.length > 0) {
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
                                } else if (existingPenalizationNotification) {
                                    console.log(`[CRONJOB] Notificación de penalización ya existe para enrollment ${enrollment._id}. Omitiendo creación.`);
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

        // Verificar si ya existe una notificación de desactivación de pagos automáticos para este enrollment
        const existingNotification = await Notification.findOne({
            idEnrollment: enrollment._id,
            idCategoryNotification: categoryNotificationId,
            notification_description: { $regex: 'Los pagos automáticos.*han sido desactivados', $options: 'i' },
            isActive: true
        });

        if (existingNotification) {
            console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Notificación de desactivación de pagos automáticos ya existe para enrollment ${enrollment._id}. Omitiendo creación.`);
            return false; // Ya existe, no crear duplicado
        }

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

        // Buscar enrollments con pagos automáticos habilitados (excluir enrollments en pausa - status: 3)
        const enrollmentsWithAutoPayments = await Enrollment.find({
            cancellationPaymentsEnabled: true,
            status: { $ne: 3 } // Excluir enrollments en pausa
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

                const availableBalance = enrollment.available_balance != null ? Number(enrollment.available_balance) : 0;
                // Monto a pagar = solo lo del periodo que vence (balanceRemaining del ciclo). Si el estudiante ya pagó el siguiente, available_balance puede ser mayor; no lo tocamos.
                let amountToPay = 0;
                const cycleHistory = await EnrollmentCycleHistory.findOne({
                    enrollmentId: enrollment._id,
                    startDate: enrollment.startDate,
                    endDate: enrollment.endDate
                }).lean();
                const periodBalanceRemaining = (cycleHistory && cycleHistory.balanceRemaining != null) ? Number(cycleHistory.balanceRemaining) : availableBalance;
                amountToPay = Math.min(availableBalance, periodBalanceRemaining);

                if (amountToPay <= 0) {
                    await Enrollment.findByIdAndUpdate(enrollment._id, { cancellationPaymentsEnabled: false });
                    const studentIds = enrollment.studentIds
                        .map(s => {
                            if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) return s.studentId._id;
                            return s.studentId ? s.studentId : null;
                        })
                        .filter(id => id !== null && id !== undefined);
                    const students = await Student.find({ _id: { $in: studentIds } }).select('name email').lean();
                    await createAutomaticPaymentFailedNotification(enrollment, students);
                    paymentsFailed++;
                    console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Pago automático fallido para enrollment ${enrollment._id} - sin saldo del periodo a pagar`);
                    processedCount++;
                    continue;
                }

                // Descontar solo el monto del periodo vencido; el resto (ej. pago adelantado del siguiente) se mantiene
                const newAvailableBalance = parseFloat((availableBalance - amountToPay).toFixed(2));
                const numberOfStudents = enrollment.studentIds.length;
                const amountPerStudent = numberOfStudents > 0 ? (newAvailableBalance / numberOfStudents) : 0;

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

                // Obtener el precio actualizado del plan según enrollmentType (solo para mantener totalAmount al día)
                let newTotalAmount = enrollment.totalAmount;
                if (enrollment.planId && enrollment.planId.pricing) {
                    const enrollmentType = enrollment.enrollmentType;
                    const planPricing = enrollment.planId.pricing[enrollmentType];
                    if (planPricing !== undefined && planPricing !== enrollment.totalAmount) {
                        newTotalAmount = planPricing;
                        console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Actualizando totalAmount de ${enrollment.totalAmount} a ${newTotalAmount} para enrollment ${enrollment._id}`);
                    }
                }

                // Mantener available_balance y balance_per_class en sync; desactivar pagos automáticos solo si no alcanza para el próximo periodo
                const newBalancePerClass = newAvailableBalance;
                const updateData = {
                    available_balance: newAvailableBalance,
                    balance_per_class: newBalancePerClass,
                    studentIds: updatedStudentIds,
                    totalAmount: parseFloat(newTotalAmount.toFixed(2))
                };
                if (newAvailableBalance < newTotalAmount) {
                    updateData.cancellationPaymentsEnabled = false;
                    autoPaymentsDisabled++;
                }

                await Enrollment.findByIdAndUpdate(enrollment._id, updateData);
                console.log(`[CRONJOB PAGOS AUTOMÁTICOS] Pago automático procesado para enrollment ${enrollment._id}: pagado ${amountToPay.toFixed(2)} (periodo vencido), available_balance = ${newAvailableBalance.toFixed(2)}`);

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

/**
 * Procesa enrollments con profesores suplentes expirados
 * Busca enrollments donde substituteProfessor.expiryDate coincide con el día actual o ya pasó
 * y establece substituteProfessor en null
 */
const processExpiredSubstituteProfessors = async () => {
    try {
        console.log('[CRONJOB PROFESORES SUPLENTES] Iniciando procesamiento de profesores suplentes expirados...');

        // Obtener la fecha actual a medianoche (solo fecha, sin hora)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // Buscar enrollments con substituteProfessor no null
        const enrollmentsWithSubstitute = await Enrollment.find({
            substituteProfessor: { $ne: null },
            'substituteProfessor.expiryDate': { $exists: true }
        }).lean();

        console.log(`[CRONJOB PROFESORES SUPLENTES] Enrollments con profesor suplente encontrados: ${enrollmentsWithSubstitute.length}`);

        let processedCount = 0;
        let expiredCount = 0;

        for (const enrollment of enrollmentsWithSubstitute) {
            try {
                if (!enrollment.substituteProfessor || !enrollment.substituteProfessor.expiryDate) {
                    continue;
                }

                // Obtener la fecha de expiración
                const expiryDate = new Date(enrollment.substituteProfessor.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);

                // Comparar solo las fechas (sin hora)
                // Si expiryDate es menor o igual a today, el profesor suplente ha expirado
                if (expiryDate <= today) {
                    // Actualizar el enrollment poniendo substituteProfessor en null
                    await Enrollment.findByIdAndUpdate(
                        enrollment._id,
                        { $set: { substituteProfessor: null } },
                        { new: true, runValidators: true }
                    );

                    console.log(`[CRONJOB PROFESORES SUPLENTES] Profesor suplente removido del enrollment ${enrollment._id}`);
                    console.log(`  - Fecha de expiración: ${expiryDate.toISOString().split('T')[0]}`);
                    console.log(`  - Fecha actual: ${today.toISOString().split('T')[0]}`);
                    console.log(`  - Profesor suplente ID: ${enrollment.substituteProfessor.professorId}`);

                    expiredCount++;
                }

                processedCount++;
            } catch (error) {
                console.error(`[CRONJOB PROFESORES SUPLENTES] Error procesando enrollment ${enrollment._id}:`, error.message);
                processedCount++;
            }
        }

        console.log(`[CRONJOB PROFESORES SUPLENTES] Procesamiento completado:`);
        console.log(`  - Enrollments procesados: ${processedCount}`);
        console.log(`  - Profesores suplentes expirados y removidos: ${expiredCount}`);
        console.log('[CRONJOB PROFESORES SUPLENTES] Finalizando procesamiento de profesores suplentes expirados');

    } catch (error) {
        console.error('[CRONJOB PROFESORES SUPLENTES] Error en procesamiento de profesores suplentes expirados:', error);
    }
};

/**
 * Inicializa el cronjob para procesar profesores suplentes expirados
 * Se ejecuta diariamente a las 00:00 (medianoche)
 */
const initSubstituteProfessorExpiryCronjob = () => {
    // Cron expression para producción: '0 0 * * *' = todos los días a las 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log(`[CRONJOB PROFESORES SUPLENTES] Ejecutando cronjob de profesores suplentes expirados - ${new Date().toISOString()}`);
        await processExpiredSubstituteProfessors();
    }, {
        scheduled: true,
        timezone: "America/Caracas" // Ajustar según tu zona horaria
    });

    console.log('[CRONJOB PROFESORES SUPLENTES] Cronjob de profesores suplentes expirados configurado (diario a medianoche - PRODUCCIÓN)');
};

module.exports = {
    processEnrollmentsPaymentStatus,
    initEnrollmentsPaymentCronjob,
    processAutomaticPayments,
    initAutomaticPaymentsCronjob,
    processExpiredSubstituteProfessors,
    initSubstituteProfessorExpiryCronjob,
    processEnrollmentRenewals,
    initEnrollmentRenewalsCronjob
};

