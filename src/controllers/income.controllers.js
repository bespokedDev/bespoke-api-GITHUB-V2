// src/controllers/incomes.controller.js
const utilsFunctions = require('../utils/utilsFunctions');
const Income = require('../models/Income');
const Professor = require('../models/Professor');
const Student = require('../models/Student');
const PaymentMethod = require('../models/PaymentMethod');
const Divisa = require('../models/Divisa');
const Enrollment = require('../models/Enrollment');
const ProfessorType = require('../models/ProfessorType'); // <--- ¡AQUÍ ESTÁ!

const incomesCtrl = {};
const mongoose = require('mongoose');
const moment = require('moment'); // Asegúrate de importar moment

// ====================================================================
//         FUNCIONES AUXILIARES (Definidas una sola vez aquí)
// ====================================================================

/**
 * Función auxiliar para poblar un ingreso.
 * Se usa para create, getById y list.
 */
const populateIncome = async (query) => {
    return await Income.findOne(query)
        .populate('idDivisa', 'name')
        .populate('idProfessor', 'name ciNumber')
        .populate('idPaymentMethod', 'name type')
        .populate({
            path: 'idEnrollment',
            select: 'planId studentIds professorId enrollmentType purchaseDate pricePerStudent totalAmount status alias',
            populate: [
                { path: 'planId', select: 'name' },
                { path: 'studentIds', select: 'name studentCode' },
                { path: 'professorId', select: 'name ciNumber' }
            ]
        })
        .lean();
};


/**
 * Función auxiliar interna para generar el reporte de profesores general (profesores excluyendo a Andrea Wias).
 * @param {string} month - Mes en formato YYYY-MM.
 * @returns {Promise<Array>} - El array de objetos de reporte por profesor.
 */
const generateGeneralProfessorsReportLogic = async (month) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const EXCLUDED_PROFESSOR_ID = new mongoose.Types.ObjectId("685a1caa6c566777c1b5dc4b");

    const incomes = await Income.find({
        income_date: {
            $gte: startDate,
            $lte: endDate
        },
        idProfessor: { $ne: EXCLUDED_PROFESSOR_ID }
    })
    .populate({
        path: 'idProfessor',
        select: 'name ciNumber typeId'
    })
    .populate({
        path: 'idEnrollment',
        select: 'planId studentIds professorId enrollmentType purchaseDate pricePerStudent totalAmount status alias',
        populate: [
            { path: 'planId', select: 'name monthlyClasses pricing' },
            { path: 'studentIds', select: 'name' }
        ]
    })
    .lean();

    if (!incomes || incomes.length === 0) {
        return [];
    }

    const professorsReportMap = new Map();
    const incomeGroupedByProfessorAndEnrollment = {};

    for (const income of incomes) {
        const professorId = income.idProfessor ? income.idProfessor._id.toString() : 'unknown_professor';
        const enrollmentId = income.idEnrollment ? income.idEnrollment._id.toString() : 'unknown_enrollment';

        if (!income.idEnrollment || !income.idProfessor || !income.idProfessor.typeId) {
            console.warn(`Skipping income ${income._id} due to missing enrollment, professor or professorType info.`);
            continue;
        }

        if (!incomeGroupedByProfessorAndEnrollment[professorId]) {
            incomeGroupedByProfessorAndEnrollment[professorId] = {};
        }
        if (!incomeGroupedByProfessorAndEnrollment[professorId][enrollmentId]) {
            incomeGroupedByProfessorAndEnrollment[professorId][enrollmentId] = {
                totalIncomeAmountForEnrollment: 0,
                totalAmountInDollarsForEnrollment: 0,
                enrollmentInfo: income.idEnrollment,
                professorInfo: income.idProfessor
            };
        }

        const amount = Number(income.amount) || 0;
        const amountInDollars = Number(income.amountInDollars) || 0;

        incomeGroupedByProfessorAndEnrollment[professorId][enrollmentId].totalIncomeAmountForEnrollment += amount;
        incomeGroupedByProfessorAndEnrollment[professorId][enrollmentId].totalAmountInDollarsForEnrollment += amountInDollars;
    }

    const allProfessorTypes = await ProfessorType.find().lean();
    const professorTypesMap = new Map();
    allProfessorTypes.forEach(type => professorTypesMap.set(type._id.toString(), type));

        for (const professorId in incomeGroupedByProfessorAndEnrollment) {
        const professorEnrollments = incomeGroupedByProfessorAndEnrollment[professorId];
        const professorDetails = [];
        let currentProfessorName = 'Profesor Desconocido';

        for (const enrollmentId in professorEnrollments) {
            const data = professorEnrollments[enrollmentId];
            const enrollment = data.enrollmentInfo;
            const professor = data.professorInfo;
            const plan = enrollment.planId;
            const studentList = enrollment.studentIds;

            const period = `${moment(startDate).format("MMM Do")} - ${moment(endDate).format("MMM Do")}`;
            const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
            const planName = plan ? plan.name : 'N/A';
            const planDisplay = `${planPrefix} - ${planName}`;
            
            // Ordenar estudiantes alfabéticamente (corregido)
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
            
            
            const totalHours = plan ? (plan.monthlyClasses || 0) : 0;

            let pricePerHour = 0;
            if (plan && plan.pricing && enrollment.enrollmentType && totalHours > 0) {
                const price = plan.pricing[enrollment.enrollmentType];
                if (typeof price === 'number') { pricePerHour = price / totalHours; }
            }

            let pPerHour = 0;
            const professorType = professorTypesMap.get(professor.typeId.toString());
            if (professorType && professorType.rates && enrollment.enrollmentType) {
                const rate = professorType.rates[enrollment.enrollmentType];
                if (typeof rate === 'number') { pPerHour = rate; }
            }

            professorDetails.push({
                professorId: professor._id,
                enrollmentId: enrollment._id,
                period: period,
                plan: planDisplay,
                studentName: studentNamesConcatenated,
                amount: data.totalIncomeAmountForEnrollment,
                amountInDollars: parseFloat((data.totalAmountInDollarsForEnrollment || 0).toFixed(2)),
                totalHours: totalHours,
                pricePerHour: parseFloat(pricePerHour.toFixed(3)),
                hoursSeen: 0,
                pPerHour: parseFloat(pPerHour.toFixed(2)),
                balance: 0,
                totalTeacher: 0,
                totalBespoke: 0,
                balanceRemaining: 0,
                status: 1
            });
            if (professor && professor.name) { currentProfessorName = professor.name; }
        }

        // Ordenar enrollments: primero por plan (alfabéticamente), luego por studentName (alfabéticamente)
        professorDetails.sort((a, b) => {
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

        // Obtener los rates del profesor
        let professorRates = null;
        if (professorEnrollments && Object.keys(professorEnrollments).length > 0) {
            const firstEnrollment = Object.values(professorEnrollments)[0];
            if (firstEnrollment.professorInfo && firstEnrollment.professorInfo.typeId) {
                const professorType = professorTypesMap.get(firstEnrollment.professorInfo.typeId.toString());
                if (professorType && professorType.rates) {
                    professorRates = {
                        single: professorType.rates.single || 0,
                        couple: professorType.rates.couple || 0,
                        group: professorType.rates.group || 0
                    };
                }
            }
        }

        professorsReportMap.set(professorId, {
            professorId: professorId,
            professorName: currentProfessorName,
            reportDateRange: `${moment(startDate).format("MMM Do YYYY")} - ${moment(endDate).format("MMM Do YYYY")}`,
            rates: professorRates,
            details: professorDetails
        });
    }

    const finalReport = Array.from(professorsReportMap.values());
    finalReport.sort((a, b) => a.professorName.localeCompare(b.professorName));

    return finalReport;
};

/**
 * Función auxiliar interna para generar el reporte del profesor especial (Andrea Wias).
 * @param {string} month - Mes en formato YYYY-MM.
 * @returns {Promise<Object|null>} - El objeto de reporte del profesor singular.
 */
const generateSpecificProfessorReportLogic = async (month) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const TARGET_PROFESSOR_ID = new mongoose.Types.ObjectId("685a1caa6c566777c1b5dc4b"); // ID del profesor Andrea Wias

    const incomes = await Income.find({
        income_date: {
            $gte: startDate,
            $lte: endDate
        },
        idProfessor: TARGET_PROFESSOR_ID
    })
    .populate({ path: 'idProfessor', select: 'name ciNumber typeId' })
    .populate({
        path: 'idEnrollment',
        select: 'planId studentIds professorId enrollmentType purchaseDate pricePerStudent totalAmount status alias',
        populate: [
            { path: 'planId', select: 'name monthlyClasses pricing' },
            { path: 'studentIds', select: 'name' }
        ]
    })
    .lean();

    if (!incomes || incomes.length === 0) {
        return null; // Retorna null si no hay datos
    }

    const enrollmentReportMap = new Map();
    let professorName = 'Profesor Desconocido';
    let professorId = TARGET_PROFESSOR_ID.toString();

    for (const income of incomes) {
        const enrollmentId = income.idEnrollment ? income.idEnrollment._id.toString() : 'unknown_enrollment';

        if (!income.idEnrollment || !income.idProfessor || !income.idProfessor.typeId) {
            console.warn(`Skipping income ${income._id} due to missing enrollment, professor or professorType info.`);
            continue;
        }

        if (!enrollmentReportMap.has(enrollmentId)) {
            enrollmentReportMap.set(enrollmentId, {
                totalIncomeAmountForEnrollment: 0,
                totalAmountInDollarsForEnrollment: 0,
                enrollmentInfo: income.idEnrollment,
                professorInfo: income.idProfessor
            });
        }

        const amount = Number(income.amount) || 0;
        const amountInDollars = Number(income.amountInDollars) || 0;

        const enrollmentData = enrollmentReportMap.get(enrollmentId);
        enrollmentData.totalIncomeAmountForEnrollment += amount;
        enrollmentData.totalAmountInDollarsForEnrollment += amountInDollars;

        if (professorName === 'Profesor Desconocido' && income.idProfessor.name) {
            professorName = income.idProfessor.name;
        }
    }

    if (enrollmentReportMap.size === 0) {
        return null;
    }

    const allProfessorTypes = await ProfessorType.find().lean();
    const professorTypesMap = new Map();
    allProfessorTypes.forEach(type => professorTypesMap.set(type._id.toString(), type));

    const details = [];
    let subtotalPayment = 0;
    let subtotalBalanceRemaining = 0;

    for (const [enrollmentId, data] of enrollmentReportMap.entries()) {
        const enrollment = data.enrollmentInfo;
        const professor = data.professorInfo;
        const plan = enrollment.planId;
        const studentList = enrollment.studentIds;

        const period = `${moment(startDate).format("MMM Do")} - ${moment(endDate).format("MMM Do")}`;
        const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
        const planName = plan ? plan.name : 'N/A';
        const planDisplay = `${planPrefix} - ${planName}`;
        
        // Ordenar estudiantes alfabéticamente (corregido)
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
        
        
        const totalHours = plan ? (plan.monthlyClasses || 0) : 0;

        let pricePerHour = 0;
        if (plan && plan.pricing && enrollment.enrollmentType && totalHours > 0) {
            const price = plan.pricing[enrollment.enrollmentType];
            if (typeof price === 'number') { pricePerHour = price / totalHours; }
        }

        let pPerHour = 0;
        const professorType = professorTypesMap.get(professor.typeId.toString());
        if (professorType && professorType.rates && enrollment.enrollmentType) {
            const rate = professorType.rates[enrollment.enrollmentType];
            if (typeof rate === 'number') { pPerHour = rate; }
        }

        const hoursSeen = 0;
        const oldBalance = 0;
        const payment = 0;
        const total = 0;
        const balanceRemaining = 0;

        details.push({
            enrollmentId: enrollment._id,
            period: period,
            plan: planDisplay,
            studentName: studentNamesConcatenated,
            amount: data.totalIncomeAmountForEnrollment,
            amountInDollars: parseFloat((data.totalAmountInDollarsForEnrollment || 0).toFixed(2)),
            totalHours: totalHours,
            hoursSeen: hoursSeen,
            oldBalance: oldBalance,
            payment: payment,
            total: total,
            balanceRemaining: balanceRemaining
        });
        subtotalPayment += payment;
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

    // Obtener los rates del profesor especial
    let professorRates = null;
    if (enrollmentReportMap && enrollmentReportMap.size > 0) {
        const firstEnrollment = Array.from(enrollmentReportMap.values())[0];
        if (firstEnrollment.professorInfo && firstEnrollment.professorInfo.typeId) {
            const professorType = professorTypesMap.get(firstEnrollment.professorInfo.typeId.toString());
            if (professorType && professorType.rates) {
                professorRates = {
                    single: professorType.rates.single || 0,
                    couple: professorType.rates.couple || 0,
                    group: professorType.rates.group || 0
                };
            }
        }
    }

    const finalReport = {
        professorId: professorId,
        professorName: professorName,
        reportDateRange: `${moment(startDate).format("MMM Do YYYY")} - ${moment(endDate).format("MMM Do YYYY")}`,
        rates: professorRates,
        details: details,
        subtotal: {
            total: parseFloat(subtotalPayment.toFixed(2)),
            balanceRemaining: parseFloat(subtotalBalanceRemaining.toFixed(2))
        }
    };

    return finalReport;
};

/**
 * Función auxiliar interna para generar el reporte de excedentes (ingresos sin enrollment ni profesor).
 * @param {string} month - Mes en formato YYYY-MM.
 * @returns {Promise<Object|null>} - El objeto de reporte de excedentes.
 */
const generateExcedenteReportLogic = async (month) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Buscar ingresos que NO tengan ni idEnrollment ni idProfessor
    const excedenteIncomes = await Income.find({
        income_date: {
            $gte: startDate,
            $lte: endDate
        },
        $or: [
            { idEnrollment: { $exists: false } },
            { idEnrollment: null },
            { idProfessor: { $exists: false } },
            { idProfessor: null }
        ]
    })
    .populate('idDivisa', 'name')
    .populate('idPaymentMethod', 'name type')
    .lean();

    if (!excedenteIncomes || excedenteIncomes.length === 0) {
        return null; // No hay excedentes
    }

    // Calcular total del excedente
    const totalExcedente = excedenteIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

    // Crear array simple de detalles
    const details = excedenteIncomes.map(income => ({
        incomeId: income._id,
        deposit_name: income.deposit_name || 'Sin nombre',
        amount: income.amount || 0,
        amountInDollars: income.amountInDollars || 0,
        tasa: income.tasa || 0,
        divisa: income.idDivisa ? income.idDivisa.name : 'Sin divisa',
        paymentMethod: income.idPaymentMethod ? income.idPaymentMethod.name : 'Sin método de pago',
        note: income.note || 'Sin nota',
        income_date: income.income_date,
        createdAt: income.createdAt
    }));

    return {
        reportDateRange: `${moment(startDate).format("MMM Do YYYY")} - ${moment(endDate).format("MMM Do YYYY")}`,
        totalExcedente: parseFloat(totalExcedente.toFixed(2)),
        numberOfIncomes: excedenteIncomes.length,
        details: details // Array simple de todos los ingresos excedentes
    };
};

// ====================================================================
//            MÉTODOS DEL CONTROLADOR (incomesCtrl)
// ====================================================================

/**
 * @route POST /api/incomes
 * @description Crea un nuevo ingreso de forma sencilla, asumiendo validación del cliente.
 * @access Private (Requiere JWT)
 */
incomesCtrl.create = async (req, res) => {
    try {
        let incomeData = { ...req.body };

        const objectIdFields = ['idDivisa', 'idProfessor', 'idPaymentMethod', 'idStudent', 'idEnrollment'];
        objectIdFields.forEach(field => {
            if (incomeData.hasOwnProperty(field) && incomeData[field] === '') {
                incomeData[field] = null;
            }
        });

        const newIncome = new Income(incomeData);
        const saved = await newIncome.save();

        const populatedIncome = await populateIncome({ _id: saved._id });

        res.status(201).json({
            message: 'Ingreso creado exitosamente',
            income: populatedIncome
        });
    } catch (error) {
        console.error('Error al crear ingreso:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'ingreso');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: `Error de formato de datos: ${error.path} con valor ${JSON.stringify(error.value)} no es válido.` });
        }
        res.status(500).json({ message: 'Error interno al crear ingreso', error: error.message });
    }
};

/**
 * @route GET /api/incomes
 * @description Lista todos los ingresos con sus referencias populadas
 * @access Private (Requiere JWT)
 */
incomesCtrl.list = async (req, res) => {
    try {
        // incomesCtrl.list usa la misma lógica de populateIncome
        const incomes = await Income.find()
            .populate('idDivisa', 'name')
            .populate('idProfessor', 'name ciNumber')
            .populate('idPaymentMethod', 'name type')
            .populate({
                path: 'idEnrollment',
                select: 'planId studentIds professorId enrollmentType purchaseDate pricePerStudent totalAmount status alias',
                populate: [
                    { path: 'planId', select: 'name' },
                    { path: 'studentIds', select: 'name studentCode' },
                    { path: 'professorId', select: 'name ciNumber' }
                ]
            })
            .lean();

        res.status(200).json(incomes);
    } catch (error) {
        console.error('Error al listar ingresos:', error);
        res.status(500).json({ message: 'Error interno al listar ingresos', error: error.message });
    }
};

/**
 * @route GET /api/incomes/:id
 * @description Obtiene un ingreso por su ID con sus referencias populadas
 * @access Private (Requiere JWT)
 */
incomesCtrl.getById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }

        const income = await populateIncome({ _id: req.params.id });

        if (!income) return res.status(404).json({ message: 'Ingreso no encontrado' });
        res.status(200).json(income);
    } catch (error) {
        console.error('Error al obtener ingreso:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener ingreso', error: error.message });
    }
};

/**
 * @route PUT /api/incomes/:id
 * @description Actualiza un ingreso por su ID
 * @access Private (Requiere JWT)
 */
incomesCtrl.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }

        const { income_date } = req.body;

        if (income_date && typeof income_date === 'string') {
            req.body.income_date = new Date(income_date);
        }

        const objectIdFields = ['idDivisa', 'idProfessor', 'idPaymentMethod', 'idStudent', 'idEnrollment'];
        objectIdFields.forEach(field => {
            if (req.body.hasOwnProperty(field) && req.body[field] === '') {
                req.body[field] = null;
            }
        });

        const updated = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Ingreso no encontrado' });

        const populatedUpdatedIncome = await populateIncome({ _id: updated._id });

        res.status(200).json({ message: 'Ingreso actualizado', income: populatedUpdatedIncome });
    } catch (error) {
        console.error('Error al actualizar ingreso:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'ingreso');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al actualizar ingreso', error: error.message });
    }
};

/**
 * @route DELETE /api/incomes/:id
 * @description Elimina un ingreso por su ID
 * @access Private (Requiere JWT)
 */
incomesCtrl.remove = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }

        const deleted = await Income.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Ingreso no encontrado' });

        res.status(200).json({ message: 'Ingreso eliminado exitosamente', income: deleted });
    } catch (error) {
        console.error('Error al eliminar ingreso:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }
        res.status(500).json({ message: 'Error interno al eliminar ingreso', error: error.message });
    }
};

/**
 * @route GET /api/incomes/summary-by-payment-method
 * @description Genera un desglose de ingresos por método de pago dentro de un rango de fechas.
 * @queryParam {string} startDate - Fecha de inicio (YYYY-MM-DD), opcional.
 * @queryParam {string} endDate - Fecha de fin (YYYY-MM-DD), opcional.
 * @access Private (Requiere JWT)
 */
incomesCtrl.getIncomesSummaryByPaymentMethod = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Obtener fechas de los query params

        let matchConditions = {};

        // 1. Construir las condiciones de fecha si se proporcionan
        if (startDate || endDate) {
            matchConditions.income_date = {};
            if (startDate) {
                const start = new Date(startDate);
                // Validar fecha de inicio
                if (isNaN(start.getTime())) {
                    return res.status(400).json({ message: 'Formato de fecha de inicio (startDate) inválido.' });
                }
                matchConditions.income_date.$gte = start; // Greater than or equal to
            }
            if (endDate) {
                const end = new Date(endDate);
                // Validar fecha de fin
                if (isNaN(end.getTime())) {
                    return res.status(400).json({ message: 'Formato de fecha de fin (endDate) inválido.' });
                }
                // Ajustar endDate para incluir todo el día final
                end.setHours(23, 59, 59, 999);
                matchConditions.income_date.$lte = end; // Less than or equal to
            }
        }

        // 2. Definir el pipeline de agregación
        const pipeline = [];

        // Paso 1: Filtrar por fecha si hay condiciones
        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({
                $match: matchConditions
            });
        }

        // Paso 2: Agrupar por idPaymentMethod y sumar los montos
        pipeline.push({
            $group: {
                _id: "$idPaymentMethod", // Agrupar por el ID del método de pago
                totalAmount: { $sum: "$amount" }, // Sumar los montos de ingresos
                count: { $sum: 1 } // Contar cuántos ingresos hay por cada método
            }
        });

        // Paso 3: Realizar un lookup (join) con la colección de PaymentMethods para obtener sus nombres
        pipeline.push({
            $lookup: {
                from: 'paymentMethods', // Nombre de la colección (debe coincidir con la que está en la DB)
                localField: '_id', // Campo de la colección actual (Income) que contiene el ID
                foreignField: '_id', // Campo de la colección 'paymentMethods' que coincide con el ID
                as: 'paymentMethodInfo' // Nombre del array donde se almacenará el resultado del join
            }
        });

        // Paso 4: Desplegar el array 'paymentMethodInfo' (ya que $lookup devuelve un array)
        // Solo $unwind si hay un match. Si un idPaymentMethod en Income no tiene una correspondencia
        // en PaymentMethod, el documento se descartaría con $unwind. Podemos usar left outer join con preserveNullAndEmptyArrays.
        pipeline.push({
            $unwind: {
                path: '$paymentMethodInfo',
                preserveNullAndEmptyArrays: true // Esto asegura que los ingresos sin un método de pago populado no se descarten
            }
        });

        // Paso 5: Proyectar los campos finales para una salida limpia
        pipeline.push({
            $project: {
                _id: 0, // Excluir el _id del grupo
                paymentMethodId: { $ifNull: ["$paymentMethodInfo._id", null] }, // Usa null si no se pobló
                paymentMethodName: { $ifNull: ["$paymentMethodInfo.name", "Método Desconocido/Eliminado"] }, // Usa un string por defecto si no se pobló
                paymentMethodType: { $ifNull: ["$paymentMethodInfo.type", null] }, // Usa null si no se pobló
                totalAmount: "$totalAmount",
                numberOfIncomes: "$count"
            }
        });

        // Paso 6: Ordenar por nombre del método de pago o por monto total (opcional)
        pipeline.push({
            $sort: { paymentMethodName: 1 } // Ordenar alfabéticamente por nombre del método
        });

        const summary = await Income.aggregate(pipeline);

        // --- NUEVO PASO: Calcular el total general después de la agregación ---
        const grandTotalAmount = summary.reduce((sum, item) => sum + item.totalAmount, 0);

        if (summary.length === 0) {
            return res.status(200).json({
                message: 'No se encontraron ingresos para el rango de fechas y métodos de pago especificados.',
                summary: [],
                grandTotalAmount: 0 // Asegura que el total general también sea 0
            });
        }

        res.status(200).json({
            message: 'Resumen de ingresos por método de pago generado exitosamente',
            summary: summary,
            grandTotalAmount: grandTotalAmount // <-- Nuevo campo aquí
        });

    } catch (error) {
        console.error('Error al generar resumen de ingresos por método de pago:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Uno de los IDs proporcionados es inválido.' });
        }
        res.status(500).json({ message: 'Error interno al generar resumen de ingresos', error: error.message });
    }
};


// ====================================================================
//         NUEVO MÉTODO: professorsPayoutReport
// ====================================================================

/**
 * @route GET /api/incomes/professors-payout-report
 * @description Genera un desglose contable detallado por profesor para un mes específico (Método Convencional).
 * @queryParam {string} month - Mes en formato YYYY-MM (ej. "2025-07"). Obligatorio.
 * @access Private (Requiere JWT)
 */
incomesCtrl.professorsPayoutReport = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month || !String(month).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'El parámetro "month" es requerido y debe estar en formato YYYY-MM (ej. "2025-07").' });
        }

        // Generar el reporte de profesores generales (excluyendo a Andrea Wias)
        const report = await generateGeneralProfessorsReportLogic(month);

        // Generar el reporte del profesor especial (Andrea Wias)
        const specialProfessorReport = await generateSpecificProfessorReportLogic(month);

        // 🆕 NUEVO: Generar el reporte de excedentes
        const excedenteReport = await generateExcedenteReportLogic(month);

        res.status(200).json({
            message: `Reportes de pagos de profesores para el mes ${month} generados exitosamente.`,
            report: report, // Array de profesores
            specialProfessorReport: specialProfessorReport, // Objeto del profesor singular (o null si no hay data)
            excedente: excedenteReport // 🆕 NUEVO: Reporte de excedentes (o null si no hay data)
        });

    } catch (error) {
        console.error('Error al generar reportes consolidados de profesores:', error);
        if (error.name === 'CastError' || error.name === 'BSONError') {
            return res.status(400).json({ message: 'Formato de ID o fecha inválido en la solicitud o datos de la base de datos.' });
        }
        res.status(500).json({ message: 'Error interno al generar reportes consolidados de profesores', error: error.message });
    }
};


module.exports = incomesCtrl;