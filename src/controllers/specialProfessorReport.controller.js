// controllers/specialProfessorReport.controller.js
const Income = require('../models/Income');
const Professor = require('../models/Professor');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const ProfessorType = require('../models/ProfessorType');

const moment = require('moment'); // Asegúrate de tenerlo instalado: npm install moment
const mongoose = require('mongoose');

const specialProfessorReportCtrl = {};

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

        // 1. Obtener todos los Incomes relevantes para el mes y el profesor target
        const incomes = await Income.find({
            income_date: {
                $gte: startDate,
                $lte: endDate
            },
            idProfessor: TARGET_PROFESSOR_ID // Solo este profesor
        })
        .populate({
            path: 'idProfessor',
            select: 'name ciNumber typeId'
        })
        .populate({
            path: 'idEnrollment',
            select: 'planId studentIds professorId enrollmentType purchaseDate pricePerStudent totalAmount status',
            populate: [
                { path: 'planId', select: 'name monthlyClasses pricing' },
                { path: 'studentIds', select: 'name' }
            ]
        })
        .lean();

        if (!incomes || incomes.length === 0) {
            return res.status(200).json({ message: 'No se encontraron registros para el profesor y el mes especificados.', report: {} });
        }

        // --- Estructura para agrupar los resultados por Enrollment ---
        const enrollmentReportMap = new Map(); // Map<enrollmentId, { totalIncomeAmount, enrollmentInfo, professorInfo }>

        // --- Paso 2: Agrupar Incomes por Enrollment, sumando montos ---
        let professorName = 'Profesor Desconocido'; // Se obtiene del primer income válido
        let professorId = TARGET_PROFESSOR_ID.toString(); // Será el ID del profesor target

        for (const income of incomes) {
            const enrollmentId = income.idEnrollment ? income.idEnrollment._id.toString() : 'unknown_enrollment';

            if (!income.idEnrollment || !income.idProfessor || !income.idProfessor.typeId) {
                console.warn(`Skipping income ${income._id} due to missing enrollment, professor or professorType info.`);
                continue;
            }

            if (!enrollmentReportMap.has(enrollmentId)) {
                enrollmentReportMap.set(enrollmentId, {
                    totalIncomeAmountForEnrollment: 0,
                    enrollmentInfo: income.idEnrollment,
                    professorInfo: income.idProfessor
                });
            }
            enrollmentReportMap.get(enrollmentId).totalIncomeAmountForEnrollment += income.amount;

            if (professorName === 'Profesor Desconocido' && income.idProfessor.name) {
                professorName = income.idProfessor.name;
            }
        }

        // Si no se procesó ningún income válido
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

            const studentNamesConcatenated = studentList && studentList.length > 0
                ? studentList.map(s => s.name || 'Estudiante Desconocido').join(' & ')
                : 'Estudiante Desconocido';
            
            const totalHours = plan ? (plan.monthlyClasses || 0) : 0;

            let pricePerHour = 0;
            if (plan && plan.pricing && enrollment.enrollmentType && totalHours > 0) {
                const price = plan.pricing[enrollment.enrollmentType];
                if (typeof price === 'number') {
                    pricePerHour = price / totalHours;
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

            // Columnas a inicializar en 0 (del requerimiento)
            const hoursSeen = 0;
            const oldBalance = 0;
            const payment = 0; // Se calcula en el frontend
            const total = 0;   // Se calcula en el frontend ( payment + (hoursSeen * pPerHour) )
            const balanceRemaining = 0; // Se calcula en el frontend

            const detailEntry = {
                enrollmentId: enrollment._id,
                period: period,
                plan: planDisplay,
                studentName: studentNamesConcatenated,
                amount: data.totalIncomeAmountForEnrollment, // Suma de incomes para este enrollment
                totalHours: totalHours,
                hoursSeen: hoursSeen,
                oldBalance: oldBalance,
                payment: payment,
                total: total,
                balanceRemaining: balanceRemaining
            };
            details.push(detailEntry);

            // Sumatorias para la fila de SUBTOTATAL (inicialmente 0)
            subtotalPayment += payment;
            subtotalBalanceRemaining += balanceRemaining;
        }

        // --- Estructura Final del Reporte ---
        const finalReport = {
            professorId: professorId,
            professorName: professorName,
            reportDateRange: `${moment(startDate).format("MMM Do YYYY")} - ${moment(endDate).format("MMM Do YYYY")}`,
            details: details,
            // Las filas de SUBTOTAl se inicializan a 0 aquí
            subtotal: {
                total: parseFloat(subtotalPayment.toFixed(2)), // En este punto, 'payment' es 0, así que subtotalPayment será 0
                balanceRemaining: parseFloat(subtotalBalanceRemaining.toFixed(2)) // También será 0
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