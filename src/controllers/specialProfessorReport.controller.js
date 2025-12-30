// controllers/specialProfessorReport.controller.js
const Income = require('../models/Income');
const Professor = require('../models/Professor');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const ProfessorType = require('../models/ProfessorType');
const ClassRegistry = require('../models/ClassRegistry');
const ProfessorBonus = require('../models/ProfessorBonus');

const moment = require('moment'); // Asegúrate de tenerlo instalado: npm install moment
const mongoose = require('mongoose');

const specialProfessorReportCtrl = {};

/**
 * Función auxiliar para convertir minutos a horas fraccionarias
 * @param {number} minutes - Minutos a convertir
 * @returns {number} - Horas fraccionarias (0.25, 0.5, 0.75, 1.0)
 */
const convertMinutesToFractionalHours = (minutes) => {
    if (!minutes || minutes <= 0) return 0;
    if (minutes <= 15) return 0.25;
    if (minutes <= 30) return 0.5;
    if (minutes <= 45) return 0.75;
    return 1.0; // 45-60 minutos = 1 hora
};

/**
 * Función auxiliar para procesar ClassRegistry de un enrollment y calcular horas vistas
 * PARTE 4 y 5: Procesa ClassRegistry dentro del mes, calcula horas vistas con reschedules
 * 
 * @param {Object} enrollment - Enrollment object
 * @param {Date} monthStartDate - Primer día del mes del reporte
 * @param {Date} monthEndDate - Último día del mes del reporte
 * @returns {Promise<number>} - Horas vistas totales para el profesor del enrollment
 */
const processClassRegistryForEnrollment = async (enrollment, monthStartDate, monthEndDate) => {
    // Formatear fechas del mes para comparar con classDate (string YYYY-MM-DD)
    const monthStartStr = moment(monthStartDate).format('YYYY-MM-DD');
    const monthEndStr = moment(monthEndDate).format('YYYY-MM-DD');

    // PARTE 5: Buscar todas las clases normales (reschedule = 0) dentro del mes con classViewed = 1 o 2
    const classRegistriesInMonth = await ClassRegistry.find({
        enrollmentId: enrollment._id,
        classDate: {
            $gte: monthStartStr,
            $lte: monthEndStr
        },
        reschedule: 0, // Solo clases normales, no reschedules
        classViewed: { $in: [1, 2] } // Solo clases vistas (1) o parcialmente vistas (2)
    }).lean();

    // PARTE 5: Buscar todos los reschedules dentro del mes para optimizar consultas
    const normalClassIds = classRegistriesInMonth.map(cr => cr._id);
    const reschedulesInMonth = await ClassRegistry.find({
        enrollmentId: enrollment._id,
        classDate: {
            $gte: monthStartStr,
            $lte: monthEndStr
        },
        originalClassId: { $in: normalClassIds },
        reschedule: { $in: [1, 2] } // Clases en reschedule (1 = en reschedule, 2 = reschedule visto)
    }).lean();

    // Crear un mapa de reschedules por originalClassId para acceso rápido
    const reschedulesMap = new Map();
    for (const reschedule of reschedulesInMonth) {
        const originalId = reschedule.originalClassId ? reschedule.originalClassId.toString() : null;
        if (originalId) {
            if (!reschedulesMap.has(originalId)) {
                reschedulesMap.set(originalId, []);
            }
            reschedulesMap.get(originalId).push(reschedule);
        }
    }

    // PARTE 5: Procesar cada clase normal y sumar minutos de reschedules si existen
    let totalHoursSeen = 0;

    for (const classRecord of classRegistriesInMonth) {
        let totalMinutes = classRecord.minutesViewed || 0;
        
        // PARTE 5: Buscar reschedules de esta clase normal dentro del mes
        const classRecordId = classRecord._id.toString();
        const reschedulesForThisClass = reschedulesMap.get(classRecordId) || [];
        
        // Sumar minutos de todos los reschedules de esta clase que estén dentro del mes
        for (const reschedule of reschedulesForThisClass) {
            if (reschedule.minutesViewed) {
                totalMinutes += reschedule.minutesViewed;
            }
        }

        // PARTE 5: Convertir el total de minutos a horas fraccionarias
        const fractionalHours = convertMinutesToFractionalHours(totalMinutes);
        totalHoursSeen += fractionalHours;
    }

    return totalHoursSeen;
};

/**
 * @route GET /api/special-professor-report
 * @description Genera un desglose contable para el profesor específico (Andrea Wias).
 * @queryParam {string} month - Mes en formato YYYY-MM (ej. "2025-07"). Obligatorio.
 * @access Private (Requiere JWT)
 */
specialProfessorReportCtrl.generateReport = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month || !String(month).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'El parámetro "month" es requerido y debe estar en formato YYYY-MM (ej. "2025-07").' });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0); // Inicio del día 1
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999); // Fin del último día del mes

        const TARGET_PROFESSOR_ID = new mongoose.Types.ObjectId("685a1caa6c566777c1b5dc4b"); // ID del profesor Andrea Wias

        // PARTE 3: Filtrar enrollments cuyo startDate o endDate estén dentro del rango del mes
        // Buscar enrollments donde startDate O endDate coincidan con alguna fecha del rango del mes
        const enrollments = await Enrollment.find({
            professorId: TARGET_PROFESSOR_ID,
            status: 1, // Solo enrollments activos
            $or: [
                {
                    // startDate está dentro del rango del mes
                    startDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                },
                {
                    // endDate está dentro del rango del mes
                    endDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            ]
        })
        .populate({
            path: 'planId',
            select: 'name monthlyClasses pricing'
        })
        .populate({
            path: 'professorId',
            select: 'name ciNumber typeId'
        })
        .populate({
            path: 'studentIds',
            select: 'name'
        })
        .lean();

        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json({ message: 'No se encontraron registros para el profesor y el mes especificados.', report: {} });
        }

        // --- Estructura para agrupar los resultados por Enrollment ---
        const enrollmentReportMap = new Map(); // Map<enrollmentId, { enrollmentInfo, professorInfo }>

        // --- Paso 2: Agrupar Enrollments ---
        let professorName = 'Profesor Desconocido';
        let professorId = TARGET_PROFESSOR_ID.toString();

        for (const enrollment of enrollments) {
            const enrollmentId = enrollment._id.toString();

            if (!enrollment.professorId || !enrollment.professorId.typeId || !enrollment.planId) {
                console.warn(`Skipping enrollment ${enrollment._id} due to missing professor, professorType or plan info.`);
                continue;
            }

            if (!enrollmentReportMap.has(enrollmentId)) {
                enrollmentReportMap.set(enrollmentId, {
                    enrollmentInfo: enrollment,
                    professorInfo: enrollment.professorId
                });
            }

            if (professorName === 'Profesor Desconocido' && enrollment.professorId.name) {
                professorName = enrollment.professorId.name;
            }
        }

        // Si no se procesó ningún enrollment válido
        if (enrollmentReportMap.size === 0) {
             return res.status(200).json({ message: 'No se encontraron registros válidos para el profesor y el mes especificados.', report: {} });
        }


        // --- Paso 3: Obtener todas las ProfessorTypes (para rates) ---
        const allProfessorTypes = await ProfessorType.find().lean();
        const professorTypesMap = new Map();
        allProfessorTypes.forEach(type => professorTypesMap.set(type._id.toString(), type));


        // --- Paso 4: Construir los Detalles del Reporte ---
        const details = [];
        let subtotalPayment = 0;
        let subtotalBalanceRemaining = 0;

        for (const [enrollmentId, data] of enrollmentReportMap.entries()) {
            const enrollment = data.enrollmentInfo;
            const professor = data.professorInfo; // Profesor del income
            const plan = enrollment.planId;
            const studentList = enrollment.studentIds;

            // Calcular columnas
            const period = `${moment(startDate).format("MMM Do")} - ${moment(endDate).format("MMM Do")}`;

            const planPrefix = {
                'single': 'S',
                'couple': 'C',
                'group': 'G'
            }[enrollment.enrollmentType] || 'U';
            const planName = plan ? plan.name : 'N/A';
            const planDisplay = `${planPrefix} - ${planName}`;

            // Ordenar estudiantes alfabéticamente (igual que en el reporte general)
            const sortedStudentList = studentList && studentList.length > 0
                ? [...studentList].sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase().trim();
                    const nameB = (b.name || '').toLowerCase().trim();
                    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
                })
                : [];
            
            // Usar alias si existe, sino concatenar nombres de estudiantes ordenados
            const hasAlias = enrollment.alias && enrollment.alias.trim() !== '';
            const studentNamesConcatenated = hasAlias
                ? enrollment.alias.trim()
                : sortedStudentList.length > 0
                    ? sortedStudentList.map(s => s.name || 'Estudiante Desconocido').join(' & ')
                    : 'Estudiante Desconocido';
            
            // PARTE 2: Calcular pricePerHour dividiendo el precio del plan entre el total de ClassRegistry normales
            // Buscar todos los ClassRegistry del enrollment donde reschedule = 0 (solo clases normales, no reschedules)
            const totalNormalClasses = await ClassRegistry.countDocuments({
                enrollmentId: enrollment._id,
                reschedule: 0 // Solo clases normales, excluir reschedules
            });

            const totalHours = plan ? (plan.monthlyClasses || 0) : 0; // Mantener para compatibilidad con otros campos

            let pricePerHour = 0;
            if (plan && plan.pricing && enrollment.enrollmentType && totalNormalClasses > 0) {
                const price = plan.pricing[enrollment.enrollmentType];
                if (typeof price === 'number') {
                    // Dividir el precio del plan entre el total de clases normales
                    pricePerHour = price / totalNormalClasses;
                }
            }

            let pPerHour = 0; // Se mantiene la corrección: es el rate directo
            const professorType = professorTypesMap.get(professor.typeId.toString());
            if (professorType && professorType.rates && enrollment.enrollmentType) {
                const rate = professorType.rates[enrollment.enrollmentType];
                if (typeof rate === 'number') {
                    pPerHour = rate;
                }
            }

            // PARTE 4 y 5: Procesar ClassRegistry y calcular horas vistas
            const hoursSeen = await processClassRegistryForEnrollment(enrollment, startDate, endDate);

            // PARTE 1: Calcular amount y balance basado en available_balance y totalAmount
            const availableBalance = enrollment.available_balance || 0;
            const totalAmount = enrollment.totalAmount || 0;
            
            let calculatedAmount = 0;
            let calculatedOldBalance = 0;
            
            if (availableBalance >= totalAmount) {
                // Si available_balance >= totalAmount: amount = totalAmount, balance = available_balance - totalAmount
                calculatedAmount = totalAmount;
                calculatedOldBalance = availableBalance - totalAmount;
            } else {
                // Si available_balance < totalAmount: amount = 0, balance = available_balance
                calculatedAmount = 0;
                calculatedOldBalance = availableBalance;
            }

            // PARTE 7: Calcular payment, total y balanceRemaining para reporte especial de Andrea Vivas
            // Para el reporte especial: Total = Hours Seen × Price/Hour (Andrea Vivas gana el valor completo de la hora)
            const total = hoursSeen * pricePerHour;
            
            // Payment = pPerHour × hoursSeen (pago al profesor)
            const payment = pPerHour * hoursSeen;
            
            // Balance Remaining = (Amount + Old Balance) - Total
            const balanceRemaining = (calculatedAmount + calculatedOldBalance) - total;

            const detailEntry = {
                enrollmentId: enrollment._id,
                period: period,
                plan: planDisplay,
                studentName: studentNamesConcatenated,
                amount: parseFloat(calculatedAmount.toFixed(2)),
                totalHours: totalHours,
                hoursSeen: parseFloat(hoursSeen.toFixed(2)),
                oldBalance: parseFloat(calculatedOldBalance.toFixed(2)),
                payment: parseFloat(payment.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                balanceRemaining: parseFloat(balanceRemaining.toFixed(2))
            };
            details.push(detailEntry);

            // PARTE 10: Sumatorias para la fila de SUBTOTAL
            // Para el reporte especial, sumamos 'total' (no 'payment') y 'balanceRemaining'
            subtotalPayment += total; // En realidad es subtotalTotal, pero mantenemos el nombre para compatibilidad
            subtotalBalanceRemaining += balanceRemaining;
        }

        // Ordenar enrollments: primero por plan (alfabéticamente), luego por studentName (alfabéticamente)
        details.sort((a, b) => {
            // Primero ordenar por plan (alfabéticamente)
            const planComparison = a.plan.localeCompare(b.plan);
            if (planComparison !== 0) {
                return planComparison;
            }
            
            // Si los planes son iguales, ordenar por studentName (alfabéticamente)
            const nameA = (a.studentName || '').toLowerCase().trim();
            const nameB = (b.studentName || '').toLowerCase().trim();
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        });

        // PARTE 11: Buscar bonos del profesor especial para este mes
        const professorBonuses = await ProfessorBonus.find({
            professorId: professorId,
            month: month,
            status: 1 // Solo bonos activos
        })
        .populate('userId', 'name email role')
        .sort({ bonusDate: -1, createdAt: -1 })
        .lean();

        // Calcular total de bonos (abonos) para este profesor
        const totalBonuses = professorBonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);

        // Crear detalles de bonos (abonos)
        const abonosDetails = professorBonuses.map(bonus => ({
            bonusId: bonus._id,
            amount: parseFloat(bonus.amount.toFixed(2)),
            description: bonus.description || null,
            bonusDate: bonus.bonusDate,
            month: bonus.month,
            userId: bonus.userId ? bonus.userId._id : null,
            userName: bonus.userId ? bonus.userId.name : null,
            createdAt: bonus.createdAt
        }));

        // --- Estructura Final del Reporte ---
        const finalReport = {
            professorId: professorId,
            professorName: professorName,
            reportDateRange: `${moment(startDate).format("MMM Do YYYY")} - ${moment(endDate).format("MMM Do YYYY")}`,
            details: details,
            // PARTE 10: Subtotales calculados correctamente
            subtotal: {
                total: parseFloat(subtotalPayment.toFixed(2)), // Suma de todos los 'total' (Hours Seen × Price/Hour)
                balanceRemaining: parseFloat(subtotalBalanceRemaining.toFixed(2)) // Suma de todos los 'balanceRemaining'
            },
            abonos: { // PARTE 11: Sección de abonos (bonos)
                total: parseFloat(totalBonuses.toFixed(2)),
                details: abonosDetails
            }
        };

        res.status(200).json({
            message: 'Reporte para profesor especial generado exitosamente',
            report: finalReport
        });

    } catch (error) {
        console.error('Error al generar el reporte para profesor especial:', error);
        if (error.name === 'CastError' || error.name === 'BSONError') {
            return res.status(400).json({ message: 'Formato de ID o fecha inválido en la solicitud o datos de la base de datos.' });
        }
        res.status(500).json({ message: 'Error interno al generar el reporte para profesor especial', error: error.message });
    }
};

module.exports = specialProfessorReportCtrl;