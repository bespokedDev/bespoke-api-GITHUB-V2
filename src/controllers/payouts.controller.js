// controllers/payouts.controller.js
const Payout = require('../models/Payout');
const Professor = require('../models/Professor');
const Enrollment = require('../models/Enrollment');
const ClassRegistry = require('../models/ClassRegistry');
const Bonus = require('../models/Bonus');
const PenalizationRegistry = require('../models/PenalizationRegistry');
const moment = require('moment');
const ProfessorType = require('../models/ProfessorType');
// IMPORTANTE: No importamos PaymentMethod aquí porque no estamos referenciando una colección PaymentMethod
// sino un subdocumento dentro del Profesor.

const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose'); // Necesario para mongoose.Types.ObjectId.isValid y new mongoose.Types.ObjectId()

const payoutCtrl = {};

// Propiedades a popular y seleccionar para mejorar el rendimiento
// NOTA CLAVE: 'paymentData' se selecciona para el profesor porque paymentMethodId vive ahí.
const basePopulateOptions = [
    { path: 'professorId', select: 'name ciNumber email phone paymentData' }, // <-- AÑADIDO 'paymentData' AQUÍ
    { path: 'enrollmentsInfo.enrollmentId', select: 'planId studentIds professorId enrollmentType', populate: [
        { path: 'planId', select: 'name' }, // Popular nombre del plan dentro de la matrícula
        { path: 'studentIds.studentId', select: 'name' } // Popular nombres de estudiantes dentro de la matrícula
    ]},
    { path: 'penalizationInfo.id', select: 'penalization_description penalizationMoney createdAt' }, // Popular información de penalizaciones
    { path: 'bonusInfo.id', select: 'amount reason createdAt' } // Popular información de bonos
    // El campo paymentMethodId se populará manualmente en la función populatePaymentMethod, NO aquí con .populate()
];

// Función auxiliar para popular paymentMethodId manualmente
const populatePaymentMethod = (payoutsOrSinglePayout) => {
    // Convierte el argumento a un array si es un solo payout, para manejarlo uniformemente
    const payoutsArray = Array.isArray(payoutsOrSinglePayout) ? payoutsOrSinglePayout : [payoutsOrSinglePayout];

    payoutsArray.forEach(payout => {
        // Asegúrate de que professorId esté populado y tenga el array paymentData
        if (payout.professorId && Array.isArray(payout.professorId.paymentData)) {
            // Busca el subdocumento de paymentData cuyo _id coincide con payout.paymentMethodId
            const foundPaymentMethod = payout.professorId.paymentData.find(
                // Usa .equals() para comparar ObjectIds de forma segura
                pm => pm._id && pm._id.equals(payout.paymentMethodId)
            );
            
            // Si encuentra el método de pago en el array del profesor
            if (foundPaymentMethod) {
                payout.paymentMethodId = foundPaymentMethod; // Reemplaza el ID con el objeto completo del subdocumento
            } else {
                // Si no se encuentra (el ID en el payout no existe en el paymentData del profesor)
                payout.paymentMethodId = null; // Establece a null para indicar que no se encontró o es inválido
            }
            // Importante: Elimina el array 'paymentData' completo del objeto del profesor populado en la respuesta.
            // Ya hemos extraído la información necesaria para paymentMethodId, y no queremos duplicar o exponer el array completo.
            delete payout.professorId.paymentData;
        } else {
            // Si el profesor no está populado, o no tiene paymentData, o no es un array, el paymentMethodId se establece a null
            payout.paymentMethodId = null;
        }
    });

    // Devuelve el array modificado, o el objeto único si se pasó uno solo
    return Array.isArray(payoutsOrSinglePayout) ? payoutsArray : payoutsArray[0];
};

// Nota: La función calculatePayoutAmounts ya no se usa con la nueva estructura
// El total ahora viene directamente del frontend

// Función auxiliar para convertir minutos a horas fraccionales
const convertMinutesToFractionalHours = (minutes) => {
    if (!minutes || minutes <= 0) return 0;
    if (minutes <= 15) return 0.25;
    if (minutes <= 30) return 0.5;
    if (minutes <= 45) return 0.75;
    return 1.0; // 45-60 minutos = 1 hora
};

// Función auxiliar para procesar ClassRegistry de un enrollment y calcular horas vistas y dinero
// Solo considera clases donde classRegistry.professorId coincide con enrollment.professorId
const processClassRegistryForPayoutPreview = async (enrollment, monthStartDate, monthEndDate, enrollmentProfessorId) => {
    // Formatear fechas del mes para comparar con classDate (string YYYY-MM-DD)
    const monthStartStr = moment(monthStartDate).format('YYYY-MM-DD');
    const monthEndStr = moment(monthEndDate).format('YYYY-MM-DD');

    // Buscar todas las clases dentro del mes con classViewed = 1, 2 o 3
    // Solo clases donde professorId del ClassRegistry coincida con el enrollment.professorId
    const classRegistriesInMonth = await ClassRegistry.find({
        enrollmentId: enrollment._id,
        classDate: {
            $gte: monthStartStr,
            $lte: monthEndStr
        },
        classViewed: { $in: [1, 2, 3] }, // Solo clases vistas (1), parcialmente vistas (2) o no show (3)
        professorId: new mongoose.Types.ObjectId(enrollmentProfessorId) // Solo clases del profesor del enrollment
    })
    .populate('originalClassId', 'minutesViewed minutesClassDefault')
    .lean();

    let totalHours = 0;
    let totalMinutes = 0;

    // Buscar reschedules dentro del mes para las clases normales encontradas
    const normalClassIds = classRegistriesInMonth
        .filter(cr => cr.reschedule === 0)
        .map(cr => cr._id);
    
    const reschedulesInMonth = normalClassIds.length > 0 ? await ClassRegistry.find({
        enrollmentId: enrollment._id,
        classDate: {
            $gte: monthStartStr,
            $lte: monthEndStr
        },
        originalClassId: { $in: normalClassIds },
        reschedule: { $in: [1, 2] }, // Clases en reschedule
        professorId: new mongoose.Types.ObjectId(enrollmentProfessorId) // Solo reschedules del mismo profesor
    })
    .populate('originalClassId', '_id')
    .lean() : [];

    // Crear un mapa de reschedules por originalClassId para acceso rápido
    const reschedulesMap = new Map();
    for (const reschedule of reschedulesInMonth) {
        const originalId = reschedule.originalClassId ? reschedule.originalClassId._id.toString() : null;
        if (originalId) {
            if (!reschedulesMap.has(originalId)) {
                reschedulesMap.set(originalId, []);
            }
            reschedulesMap.get(originalId).push(reschedule);
        }
    }

    // Procesar cada clase normal
    for (const classRecord of classRegistriesInMonth) {
        // Solo procesar clases normales (reschedule = 0)
        if (classRecord.reschedule !== 0) continue;

        let minutesToUse = 0;

        // Determinar minutos según classViewed
        if (classRecord.classViewed === 3) {
            // classViewed = 3: usar minutesClassDefault (60 minutos) = 1 hora completa
            minutesToUse = classRecord.minutesClassDefault || 60;
        } else {
            // classViewed = 1 o 2: usar minutesViewed
            minutesToUse = classRecord.minutesViewed || 0;
        }

        // Buscar reschedules de esta clase normal dentro del mes
        const classRecordId = classRecord._id.toString();
        const reschedulesForThisClass = reschedulesMap.get(classRecordId) || [];

        // Si hay reschedules, sumar sus minutos
        for (const reschedule of reschedulesForThisClass) {
            if (reschedule.minutesViewed) {
                minutesToUse += reschedule.minutesViewed;
            }
        }

        // Convertir minutos a horas fraccionales y acumular
        const fractionalHours = convertMinutesToFractionalHours(minutesToUse);
        totalHours += fractionalHours;
        totalMinutes += minutesToUse;
    }

    return { totalHours, totalMinutes };
};

/**
 * @route POST /api/payouts
 * @description Creates a new payout record
 * @access Private (Requires JWT)
 * 
 * Request Body: Estructura del preview más note, paymentMethodId y paidAt
 */
payoutCtrl.create = async (req, res) => {
    try {
        const { 
            professorId, 
            month, 
            enrollments, 
            bonusInfo, 
            penalizationInfo, 
            totals,
            note, 
            paymentMethodId, 
            paidAt 
        } = req.body;

        // 1. Validar Professor
        if (!mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'Invalid Professor ID format.' });
        }
        const professor = await Professor.findById(professorId);
        if (!professor) {
            return res.status(404).json({ message: 'Professor not found with the provided ID.' });
        }

        // 2. Validar month
        if (!month || !String(month).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'Invalid month format. Must be YYYY-MM (e.g., "2025-12").' });
        }

        // 3. Validar enrollments
        if (!Array.isArray(enrollments) || enrollments.length === 0) {
            return res.status(400).json({ message: 'Enrollments cannot be empty.' });
        }

        // 4. Validar y convertir enrollments a enrollmentsInfo
        const enrollmentsInfo = [];
        for (const enrollment of enrollments) {
            // Validar campos requeridos
            if (!enrollment.enrollmentId || !mongoose.Types.ObjectId.isValid(enrollment.enrollmentId)) {
                return res.status(400).json({ message: `Invalid enrollmentId: ${enrollment.enrollmentId}` });
            }

            // Validar que el enrollment existe
            const enrollmentExists = await Enrollment.findById(enrollment.enrollmentId);
            if (!enrollmentExists) {
                return res.status(404).json({ message: `Enrollment not found: ${enrollment.enrollmentId}` });
            }

            // Validar campos requeridos del enrollment
            if (!enrollment.studentName || !enrollment.plan || 
                typeof enrollment.subtotal !== 'number' || 
                typeof enrollment.totalHours !== 'number' || 
                typeof enrollment.hoursSeen !== 'number' ||
                typeof enrollment.pPerHour !== 'number' ||
                !enrollment.period) {
                return res.status(400).json({ message: `Invalid enrollment data for enrollmentId: ${enrollment.enrollmentId}. Missing required fields.` });
            }

            enrollmentsInfo.push({
                enrollmentId: enrollment.enrollmentId,
                studentName: enrollment.studentName,
                plan: enrollment.plan,
                subtotal: parseFloat(enrollment.subtotal.toFixed(2)),
                totalHours: enrollment.totalHours,
                hoursSeen: parseFloat(enrollment.hoursSeen.toFixed(2)),
                pPerHour: parseFloat(enrollment.pPerHour.toFixed(2)),
                period: enrollment.period
            });
        }

        // 5. Validar bonusInfo (opcional)
        const validatedBonusInfo = [];
        if (bonusInfo && Array.isArray(bonusInfo)) {
            for (const bonus of bonusInfo) {
                if (!bonus.id || !mongoose.Types.ObjectId.isValid(bonus.id)) {
                    return res.status(400).json({ message: `Invalid bonus ID: ${bonus.id}` });
                }

                // Validar que el bono existe y pertenece al profesor
                const bonusExists = await Bonus.findById(bonus.id);
                if (!bonusExists) {
                    return res.status(404).json({ message: `Bonus not found: ${bonus.id}` });
                }

                if (bonusExists.idProfessor.toString() !== professorId.toString()) {
                    return res.status(400).json({ message: `Bonus ${bonus.id} does not belong to professor ${professorId}` });
                }

                if (typeof bonus.amount !== 'number' || bonus.amount < 0) {
                    return res.status(400).json({ message: `Invalid bonus amount for bonus ${bonus.id}` });
                }

                validatedBonusInfo.push({
                    id: bonus.id,
                    amount: parseFloat(bonus.amount.toFixed(2))
                });
            }
        }

        // 6. Validar penalizationInfo (opcional)
        const validatedPenalizationInfo = [];
        if (penalizationInfo && Array.isArray(penalizationInfo)) {
            for (const penalization of penalizationInfo) {
                if (!penalization.id || !mongoose.Types.ObjectId.isValid(penalization.id)) {
                    return res.status(400).json({ message: `Invalid penalization ID: ${penalization.id}` });
                }

                // Validar que la penalización existe y pertenece al profesor
                const penalizationExists = await PenalizationRegistry.findById(penalization.id);
                if (!penalizationExists) {
                    return res.status(404).json({ message: `Penalization not found: ${penalization.id}` });
                }

                if (!penalizationExists.professorId || penalizationExists.professorId.toString() !== professorId.toString()) {
                    return res.status(400).json({ message: `Penalization ${penalization.id} does not belong to professor ${professorId}` });
                }

                if (typeof penalization.penalizationMoney !== 'number' || penalization.penalizationMoney < 0) {
                    return res.status(400).json({ message: `Invalid penalizationMoney for penalization ${penalization.id}` });
                }

                validatedPenalizationInfo.push({
                    id: penalization.id,
                    penalizationMoney: parseFloat(penalization.penalizationMoney.toFixed(2))
                });
            }
        }

        // 7. Validar paymentMethodId contra el paymentData del profesor
        if (paymentMethodId !== undefined && paymentMethodId !== null) {
            if (!mongoose.Types.ObjectId.isValid(paymentMethodId)) {
                return res.status(400).json({ message: 'Invalid Payment Method ID format.' });
            }
            const foundPaymentMethodSubdocument = professor.paymentData.id(paymentMethodId);
            if (!foundPaymentMethodSubdocument) {
                return res.status(400).json({ message: 'Payment Method ID not found in professor\'s paymentData.' });
            }
        }

        // 8. Validar total
        if (!totals || typeof totals.grandTotal !== 'number') {
            return res.status(400).json({ message: 'Invalid totals.grandTotal. Must be a number.' });
        }

        // 9. Crear y Guardar el nuevo Payout
        const newPayout = new Payout({
            professorId,
            month,
            enrollmentsInfo: enrollmentsInfo,
            bonusInfo: validatedBonusInfo,
            penalizationInfo: validatedPenalizationInfo,
            total: parseFloat(totals.grandTotal.toFixed(2)),
            note: note || null,
            paymentMethodId: paymentMethodId || null,
            paidAt: paidAt ? new Date(paidAt) : null,
            isActive: true
        });

        const savedPayout = await newPayout.save();

        // 10. Actualizar bonos: establecer idPayout
        if (validatedBonusInfo.length > 0) {
            const bonusIds = validatedBonusInfo.map(b => b.id);
            await Bonus.updateMany(
                { _id: { $in: bonusIds } },
                { $set: { idPayout: savedPayout._id } }
            );
        }

        // 11. Actualizar penalizaciones: establecer payOutId
        if (validatedPenalizationInfo.length > 0) {
            const penalizationIds = validatedPenalizationInfo.map(p => p.id);
            await PenalizationRegistry.updateMany(
                { _id: { $in: penalizationIds } },
                { $set: { payOutId: savedPayout._id } }
            );
        }

        // 12. Popular y Responder
        let populatedPayout = await Payout.findById(savedPayout._id)
                                          .populate(basePopulateOptions)
                                          .lean();

        populatedPayout = populatePaymentMethod(populatedPayout);

        res.status(201).json({
            message: 'Payout created successfully',
            payout: populatedPayout
        });
    } catch (error) {
        console.error('Error creating payout:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'payout for this month and professor');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Internal error creating payout', error: error.message });
    }
};

/**
 * @route GET /api/payouts
 * @description Lists all payouts with populated data
 * @access Private (Requires JWT)
 */
payoutCtrl.list = async (req, res) => {
    try {
        let payouts = await Payout.find()
                                  .populate(basePopulateOptions)
                                  .lean();

        payouts = populatePaymentMethod(payouts); // Aplicar la popularización manual a todos los payouts

        res.status(200).json(payouts);
    } catch (error) {
        console.error('Error listing payouts:', error);
        res.status(500).json({ message: 'Internal error listing payouts', error: error.message });
    }
};

/**
 * @route GET /api/payouts/professor/:professorId
 * @description Gets all payouts associated with a specific professor, with populated data.
 * @access Private (Requires JWT)
 */
payoutCtrl.getPayoutsByProfessorId = async (req, res) => {
    try {
        const { professorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'Invalid Professor ID.' });
        }

        let payouts = await Payout.find({ professorId: professorId })
                                  .populate(basePopulateOptions)
                                  .lean();

        payouts = populatePaymentMethod(payouts); // Aplicar la popularización manual a todos los payouts

        if (!payouts || payouts.length === 0) {
            return res.status(404).json({ message: 'No payouts found for this professor.' });
        }

        res.status(200).json(payouts);
    } catch (error) {
        console.error('Error getting payouts by professor ID:', error);
        res.status(500).json({ message: 'Internal error getting payouts by professor', error: error.message });
    }
};

/**
 * @route GET /api/payouts/:id
 * @description Gets a payout by its ID with populated data
 * @access Private (Requires JWT)
 */
payoutCtrl.getById = async (req, res) => {
    try {
        let payout = await Payout.findById(req.params.id)
                                  .populate(basePopulateOptions)
                                  .lean();

        if (!payout) {
            return res.status(404).json({ message: 'Payout not found.' });
        }

        payout = populatePaymentMethod(payout); // Aplicar la popularización manual al único payout

        res.status(200).json(payout);
    } catch (error) {
        console.error('Error getting payout by ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid payout ID.' });
        }
        res.status(500).json({ message: 'Internal error getting payout', error: error.message });
    }
};

/**
 * @route PUT /api/payouts/:id
 * @description Updates a payout by its ID
 * @access Private (Requires JWT)
 */
payoutCtrl.update = async (req, res) => {
    try {
        const { 
            professorId, 
            month, 
            enrollments, 
            enrollmentsInfo,
            bonusInfo, 
            penalizationInfo, 
            totals,
            note, 
            paidAt, 
            paymentMethodId 
        } = req.body;

        // Fetch the current payout to get its professorId if not provided in body
        const currentPayout = await Payout.findById(req.params.id).lean();
        if (!currentPayout) {
            return res.status(404).json({ message: 'Payout not found for update.' });
        }
        
        // Determine the professorId to use for validation (from body or current payout)
        const effectiveProfessorId = professorId || currentPayout.professorId;

        // Validate professor
        if (!mongoose.Types.ObjectId.isValid(effectiveProfessorId)) {
            return res.status(400).json({ message: 'Invalid Professor ID format for update.' });
        }
        const professor = await Professor.findById(effectiveProfessorId);
        if (!professor) {
            return res.status(404).json({ message: 'Professor not found with the provided ID for update.' });
        }

        // Validate month if updated
        if (month && !String(month).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'Invalid month format (should be YYYY-MM).' });
        }

        // Preparar campos actualizados
        const updatedFields = {};

        // Si se proporciona enrollments, convertirlo a enrollmentsInfo
        if (enrollments && Array.isArray(enrollments)) {
            const convertedEnrollmentsInfo = [];
            for (const enrollment of enrollments) {
                if (!enrollment.enrollmentId || !mongoose.Types.ObjectId.isValid(enrollment.enrollmentId)) {
                    return res.status(400).json({ message: `Invalid enrollmentId: ${enrollment.enrollmentId}` });
                }
                const enrollmentExists = await Enrollment.findById(enrollment.enrollmentId);
                if (!enrollmentExists) {
                    return res.status(404).json({ message: `Enrollment not found: ${enrollment.enrollmentId}` });
                }
                if (!enrollment.studentName || !enrollment.plan || 
                    typeof enrollment.subtotal !== 'number' || 
                    typeof enrollment.totalHours !== 'number' || 
                    typeof enrollment.hoursSeen !== 'number' ||
                    typeof enrollment.pPerHour !== 'number' ||
                    !enrollment.period) {
                    return res.status(400).json({ message: `Invalid enrollment data for enrollmentId: ${enrollment.enrollmentId}` });
                }
                convertedEnrollmentsInfo.push({
                    enrollmentId: enrollment.enrollmentId,
                    studentName: enrollment.studentName,
                    plan: enrollment.plan,
                    subtotal: parseFloat(enrollment.subtotal.toFixed(2)),
                    totalHours: enrollment.totalHours,
                    hoursSeen: parseFloat(enrollment.hoursSeen.toFixed(2)),
                    pPerHour: parseFloat(enrollment.pPerHour.toFixed(2)),
                    period: enrollment.period
                });
            }
            updatedFields.enrollmentsInfo = convertedEnrollmentsInfo;
        } else if (enrollmentsInfo && Array.isArray(enrollmentsInfo)) {
            // Validar enrollmentsInfo directamente
            for (const enrollment of enrollmentsInfo) {
                if (!enrollment.enrollmentId || !mongoose.Types.ObjectId.isValid(enrollment.enrollmentId)) {
                    return res.status(400).json({ message: `Invalid enrollmentId: ${enrollment.enrollmentId}` });
                }
                const enrollmentExists = await Enrollment.findById(enrollment.enrollmentId);
                if (!enrollmentExists) {
                    return res.status(404).json({ message: `Enrollment not found: ${enrollment.enrollmentId}` });
                }
            }
            updatedFields.enrollmentsInfo = enrollmentsInfo;
        }

        // Validar y actualizar bonusInfo
        if (bonusInfo !== undefined) {
            if (Array.isArray(bonusInfo)) {
                const validatedBonusInfo = [];
                for (const bonus of bonusInfo) {
                    if (!bonus.id || !mongoose.Types.ObjectId.isValid(bonus.id)) {
                        return res.status(400).json({ message: `Invalid bonus ID: ${bonus.id}` });
                    }
                    const bonusExists = await Bonus.findById(bonus.id);
                    if (!bonusExists) {
                        return res.status(404).json({ message: `Bonus not found: ${bonus.id}` });
                    }
                    if (bonusExists.idProfessor.toString() !== effectiveProfessorId.toString()) {
                        return res.status(400).json({ message: `Bonus ${bonus.id} does not belong to professor ${effectiveProfessorId}` });
                    }
                    if (typeof bonus.amount !== 'number' || bonus.amount < 0) {
                        return res.status(400).json({ message: `Invalid bonus amount for bonus ${bonus.id}` });
                    }
                    validatedBonusInfo.push({
                        id: bonus.id,
                        amount: parseFloat(bonus.amount.toFixed(2))
                    });
                }
                updatedFields.bonusInfo = validatedBonusInfo;
            } else {
                return res.status(400).json({ message: 'bonusInfo must be an array.' });
            }
        }

        // Validar y actualizar penalizationInfo
        if (penalizationInfo !== undefined) {
            if (Array.isArray(penalizationInfo)) {
                const validatedPenalizationInfo = [];
                for (const penalization of penalizationInfo) {
                    if (!penalization.id || !mongoose.Types.ObjectId.isValid(penalization.id)) {
                        return res.status(400).json({ message: `Invalid penalization ID: ${penalization.id}` });
                    }
                    const penalizationExists = await PenalizationRegistry.findById(penalization.id);
                    if (!penalizationExists) {
                        return res.status(404).json({ message: `Penalization not found: ${penalization.id}` });
                    }
                    if (!penalizationExists.professorId || penalizationExists.professorId.toString() !== effectiveProfessorId.toString()) {
                        return res.status(400).json({ message: `Penalization ${penalization.id} does not belong to professor ${effectiveProfessorId}` });
                    }
                    if (typeof penalization.penalizationMoney !== 'number' || penalization.penalizationMoney < 0) {
                        return res.status(400).json({ message: `Invalid penalizationMoney for penalization ${penalization.id}` });
                    }
                    validatedPenalizationInfo.push({
                        id: penalization.id,
                        penalizationMoney: parseFloat(penalization.penalizationMoney.toFixed(2))
                    });
                }
                updatedFields.penalizationInfo = validatedPenalizationInfo;
            } else {
                return res.status(400).json({ message: 'penalizationInfo must be an array.' });
            }
        }

        // Validar paymentMethodId against professor's paymentData if provided
        if (paymentMethodId !== undefined) {
            if (paymentMethodId !== null && !mongoose.Types.ObjectId.isValid(paymentMethodId)) {
                return res.status(400).json({ message: 'Invalid Payment Method ID format for update.' });
            }
            if (paymentMethodId !== null) {
                const foundPaymentMethodSubdocument = professor.paymentData.id(paymentMethodId);
                if (!foundPaymentMethodSubdocument) {
                    return res.status(400).json({ message: 'Payment Method ID not found in professor\'s paymentData for update.' });
                }
            }
            updatedFields.paymentMethodId = paymentMethodId;
        }

        // Validar total si se proporciona
        if (totals && typeof totals.grandTotal === 'number') {
            updatedFields.total = parseFloat(totals.grandTotal.toFixed(2));
        }

        // Actualizar otros campos si se proporcionan
        if (professorId !== undefined) updatedFields.professorId = professorId;
        if (month !== undefined) updatedFields.month = month;
        if (note !== undefined) updatedFields.note = note || null;
        if (paidAt !== undefined) {
            updatedFields.paidAt = paidAt ? new Date(paidAt) : null;
        }

        const updatedPayout = await Payout.findByIdAndUpdate(req.params.id, updatedFields, { new: true, runValidators: true });
        if (!updatedPayout) {
            return res.status(404).json({ message: 'Payout not found.' });
        }

        // Actualizar bonos: remover idPayout de bonos antiguos y establecer en nuevos
        if (bonusInfo !== undefined) {
            // Remover idPayout de bonos que ya no están en la lista
            const oldBonusIds = currentPayout.bonusInfo ? currentPayout.bonusInfo.map(b => b.id.toString()) : [];
            const newBonusIds = updatedFields.bonusInfo ? updatedFields.bonusInfo.map(b => b.id.toString()) : [];
            const removedBonusIds = oldBonusIds.filter(id => !newBonusIds.includes(id));
            if (removedBonusIds.length > 0) {
                await Bonus.updateMany(
                    { _id: { $in: removedBonusIds.map(id => new mongoose.Types.ObjectId(id)) } },
                    { $set: { idPayout: null } }
                );
            }
            // Establecer idPayout en bonos nuevos
            if (updatedFields.bonusInfo && updatedFields.bonusInfo.length > 0) {
                const bonusIds = updatedFields.bonusInfo.map(b => b.id);
                await Bonus.updateMany(
                    { _id: { $in: bonusIds } },
                    { $set: { idPayout: updatedPayout._id } }
                );
            }
        }

        // Actualizar penalizaciones: remover payOutId de penalizaciones antiguas y establecer en nuevas
        if (penalizationInfo !== undefined) {
            // Remover payOutId de penalizaciones que ya no están en la lista
            const oldPenalizationIds = currentPayout.penalizationInfo ? currentPayout.penalizationInfo.map(p => p.id.toString()) : [];
            const newPenalizationIds = updatedFields.penalizationInfo ? updatedFields.penalizationInfo.map(p => p.id.toString()) : [];
            const removedPenalizationIds = oldPenalizationIds.filter(id => !newPenalizationIds.includes(id));
            if (removedPenalizationIds.length > 0) {
                await PenalizationRegistry.updateMany(
                    { _id: { $in: removedPenalizationIds.map(id => new mongoose.Types.ObjectId(id)) } },
                    { $set: { payOutId: null } }
                );
            }
            // Establecer payOutId en penalizaciones nuevas
            if (updatedFields.penalizationInfo && updatedFields.penalizationInfo.length > 0) {
                const penalizationIds = updatedFields.penalizationInfo.map(p => p.id);
                await PenalizationRegistry.updateMany(
                    { _id: { $in: penalizationIds } },
                    { $set: { payOutId: updatedPayout._id } }
                );
            }
        }

        // Populate fields in the update response
        let populatedUpdatedPayout = await Payout.findById(updatedPayout._id)
                                                    .populate(basePopulateOptions)
                                                    .lean();

        populatedUpdatedPayout = populatePaymentMethod(populatedUpdatedPayout);

        res.status(200).json({
            message: 'Payout updated successfully',
            payout: populatedUpdatedPayout
        });
    } catch (error) {
        console.error('Error updating payout:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'payout for this month and professor');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'CastError' || error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal error updating payout', error: error.message });
    }
};

/**
 * @route PATCH /api/payouts/:id/deactivate
 * @description Deactivates a payout record (sets isActive to false)
 * @access Private (Requires JWT)
 */
payoutCtrl.deactivate = async (req, res) => {
    try {
        const deactivatedPayout = await Payout.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!deactivatedPayout) {
            return res.status(404).json({ message: 'Payout not found.' });
        }

        // Populate in the response
        let populatedDeactivatedPayout = await Payout.findById(deactivatedPayout._id)
                                                        .populate(basePopulateOptions)
                                                        .lean();
        populatedDeactivatedPayout = populatePaymentMethod(populatedDeactivatedPayout);

        res.status(200).json({
            message: 'Payout deactivated successfully',
            payout: populatedDeactivatedPayout
        });
    } catch (error) {
        console.error('Error deactivating payout:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid payout ID.' });
        }
        res.status(500).json({ message: 'Internal error deactivating payout', error: error.message });
    }
};

/**
 * @route PATCH /api/payouts/:id/activate
 * @description Activates a payout record (sets isActive to true)
 * @access Private (Requires JWT)
 */
payoutCtrl.activate = async (req, res) => {
    try {
        const activatedPayout = await Payout.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );
        if (!activatedPayout) {
            return res.status(404).json({ message: 'Payout not found.' });
        }

        // Populate in the response
        const populatedActivatedPayout = await Payout.findById(activatedPayout._id)
                                                        .populate(basePopulateOptions)
                                                        .lean();
        populatedActivatedPayout = populatePaymentMethod(populatedActivatedPayout);

        res.status(200).json({
            message: 'Payout activated successfully',
            payout: populatedActivatedPayout
        });
    } catch (error) {
        console.error('Error activating payout:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid payout ID.' });
        }
        res.status(500).json({ message: 'Internal error activating payout', error: error.message });
    }
};

/**
 * @route GET /api/payouts/preview/:professorId
 * @description Genera una vista previa de los pagos que se deben hacer a un profesor en un mes específico
 * @access Private (Requires JWT)
 * @query month - Mes en formato YYYY-MM (ej: "2025-12")
 */
payoutCtrl.preview = async (req, res) => {
    try {
        const { professorId } = req.params;
        const { month } = req.query;

        // Validar professorId
        if (!mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'Invalid Professor ID format.' });
        }

        // Validar month
        if (!month || !String(month).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'Invalid month format. Must be YYYY-MM (e.g., "2025-12").' });
        }

        // Validar que el profesor existe
        const professor = await Professor.findById(professorId).lean();
        if (!professor) {
            return res.status(404).json({ message: 'Professor not found.' });
        }

        // Excluir al profesor especial (Andrea Wias)
        const EXCLUDED_PROFESSOR_ID = new mongoose.Types.ObjectId("685a1caa6c566777c1b5dc4b");
        if (professorId === EXCLUDED_PROFESSOR_ID.toString()) {
            return res.status(400).json({ message: 'This professor is excluded from payout preview.' });
        }

        // Calcular rango de fechas del mes (UTC)
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

        // Buscar todos los enrollments del profesor que se superponen con el mes (todos los status)
        const enrollments = await Enrollment.find({
            professorId: professorId,
            startDate: { $lte: endDate }, // startDate del enrollment <= fin del mes
            endDate: { $gte: startDate }  // endDate del enrollment >= inicio del mes
        })
        .populate({
            path: 'planId',
            select: 'name pricing'
        })
        .populate({
            path: 'professorId',
            select: 'name ciNumber typeId',
            populate: {
                path: 'typeId',
                select: 'rates'
            }
        })
        .populate({
            path: 'studentIds.studentId',
            select: 'name'
        })
        .lean();

        // Obtener todos los tipos de profesor para calcular pPerHour
        const allProfessorTypes = await ProfessorType.find().lean();
        const professorTypesMap = new Map();
        allProfessorTypes.forEach(type => professorTypesMap.set(type._id.toString(), type));

        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json({
                professorId: professorId,
                professorName: professor.name || 'Profesor Desconocido',
                month: month,
                reportDateRange: `${moment.utc(startDate).format("MMM Do YYYY")} - ${moment.utc(endDate).format("MMM Do YYYY")}`,
                enrollments: [],
                bonusInfo: [],
                penalizationInfo: [],
                totals: {
                    subtotalEnrollments: 0,
                    totalBonuses: 0,
                    totalPenalizations: 0,
                    grandTotal: 0
                }
            });
        }

        const enrollmentDetails = [];
        let subtotalEnrollments = 0;

        // Procesar cada enrollment
        for (const enrollment of enrollments) {
            if (!enrollment.planId) {
                console.warn(`Skipping enrollment ${enrollment._id} due to missing plan info.`);
                continue;
            }

            const plan = enrollment.planId;
            const studentList = enrollment.studentIds || [];

            // Calcular precio por hora del plan
            const totalClassRegistries = await ClassRegistry.countDocuments({
                enrollmentId: enrollment._id,
                originalClassId: null // Solo clases padre (normales o en reschedule), excluir reschedules en sí
            });

            let pricePerHour = 0;
            if (plan.pricing && enrollment.enrollmentType && totalClassRegistries > 0) {
                const price = plan.pricing[enrollment.enrollmentType];
                if (typeof price === 'number') {
                    pricePerHour = price / totalClassRegistries;
                }
            }

            // Ordenar estudiantes alfabéticamente
            const sortedStudentList = studentList.length > 0
                ? [...studentList].sort((a, b) => {
                    const nameA = (a.studentId && a.studentId.name ? a.studentId.name : '').toLowerCase().trim();
                    const nameB = (b.studentId && b.studentId.name ? b.studentId.name : '').toLowerCase().trim();
                    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
                })
                : [];

            // Usar alias si existe (diferente de null), sino concatenar nombres de estudiantes ordenados
            const hasAlias = enrollment.alias !== null && enrollment.alias !== undefined;
            const studentNamesConcatenated = hasAlias
                ? (typeof enrollment.alias === 'string' ? enrollment.alias.trim() : String(enrollment.alias))
                : sortedStudentList.length > 0
                    ? sortedStudentList.map(s => {
                        if (s.studentId && s.studentId.name) {
                            return s.studentId.name;
                        }
                        return 'Estudiante Desconocido';
                    }).join(' & ')
                    : 'Estudiante Desconocido';

            // Obtener ID del profesor del enrollment
            const enrollmentProfessorId = enrollment.professorId ? 
                (enrollment.professorId._id ? enrollment.professorId._id.toString() : enrollment.professorId.toString()) : 
                null;

            if (!enrollmentProfessorId) {
                console.warn(`Skipping enrollment ${enrollment._id} due to missing professorId.`);
                continue;
            }

            // Procesar ClassRegistry y calcular horas vistas
            const { totalHours: hoursSeen } = await processClassRegistryForPayoutPreview(
                enrollment,
                startDate,
                endDate,
                enrollmentProfessorId
            );

            // Calcular pPerHour (pago por hora del profesor para este enrollment)
            let pPerHour = 0;
            if (enrollment.professorId && enrollment.professorId.typeId) {
                let professorTypeIdStr;
                if (typeof enrollment.professorId.typeId === 'object' && enrollment.professorId.typeId._id) {
                    professorTypeIdStr = enrollment.professorId.typeId._id.toString();
                } else if (typeof enrollment.professorId.typeId === 'object' && enrollment.professorId.typeId.toString) {
                    professorTypeIdStr = enrollment.professorId.typeId.toString();
                } else {
                    professorTypeIdStr = String(enrollment.professorId.typeId);
                }
                
                const professorType = professorTypesMap.get(professorTypeIdStr);
                if (professorType && professorType.rates && enrollment.enrollmentType) {
                    const rate = professorType.rates[enrollment.enrollmentType];
                    if (typeof rate === 'number') {
                        pPerHour = rate;
                    }
                }
            }

            // Calcular subtotal para este enrollment (dinero por clases)
            const enrollmentSubtotal = hoursSeen * pricePerHour;

            // Plan display
            const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
            const planName = plan ? plan.name : 'N/A';
            const planDisplay = `${planPrefix} - ${planName}`;

            // Period: rango de fechas del enrollment en el mes
            const period = `${moment.utc(startDate).format("MMM Do")} - ${moment.utc(endDate).format("MMM Do")}`;

            enrollmentDetails.push({
                enrollmentId: enrollment._id,
                studentName: studentNamesConcatenated,
                plan: planDisplay,
                subtotal: parseFloat(enrollmentSubtotal.toFixed(2)),
                totalHours: totalClassRegistries,
                hoursSeen: parseFloat(hoursSeen.toFixed(2)),
                pPerHour: parseFloat(pPerHour.toFixed(2)),
                period: period
            });

            subtotalEnrollments += enrollmentSubtotal;
        }

        // Buscar bonos del profesor dentro del rango del mes
        // Bonos válidos: idPayout es null y createdAt está dentro del rango del mes
        const bonuses = await Bonus.find({
            idProfessor: professorId,
            idPayout: null
        })
        .lean();

        // Filtrar bonos por createdAt dentro del rango del mes
        const validBonuses = bonuses.filter(bonus => {
            if (!bonus.createdAt) return false;
            const bonusDate = new Date(bonus.createdAt);
            return bonusDate >= startDate && bonusDate <= endDate;
        });

        // Crear array de bonusInfo con detalles completos
        const bonusInfo = validBonuses.map(bonus => ({
            id: bonus._id,
            amount: parseFloat((bonus.amount || 0).toFixed(2)),
            reason: bonus.reason || null,
            createdAt: bonus.createdAt
        }));

        const totalBonuses = validBonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);

        // Buscar penalizaciones del profesor dentro del rango del mes
        const penalizations = await PenalizationRegistry.find({
            professorId: professorId
        })
        .lean();

        // Filtrar penalizaciones por createdAt dentro del rango del mes
        const validPenalizations = penalizations.filter(penalization => {
            if (!penalization.createdAt) return false;
            const penalizationDate = new Date(penalization.createdAt);
            return penalizationDate >= startDate && penalizationDate <= endDate;
        });

        // Crear array de penalizationInfo con detalles completos
        const penalizationInfo = validPenalizations.map(penalization => ({
            id: penalization._id,
            penalizationMoney: parseFloat((penalization.penalizationMoney || 0).toFixed(2)),
            penalization_description: penalization.penalization_description || null,
            createdAt: penalization.createdAt
        }));

        const totalPenalizations = validPenalizations.reduce((sum, penalization) => sum + (penalization.penalizationMoney || 0), 0);

        // Calcular total general
        const grandTotal = subtotalEnrollments + totalBonuses - totalPenalizations;

        // Ordenar enrollments: primero por plan (alfabéticamente), luego por studentName (alfabéticamente)
        enrollmentDetails.sort((a, b) => {
            const planComparison = a.plan.localeCompare(b.plan);
            if (planComparison !== 0) {
                return planComparison;
            }
            const nameA = (a.studentName || '').toLowerCase().trim();
            const nameB = (b.studentName || '').toLowerCase().trim();
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        });

        res.status(200).json({
            professorId: professorId,
            professorName: professor.name || 'Profesor Desconocido',
            month: month,
            reportDateRange: `${moment.utc(startDate).format("MMM Do YYYY")} - ${moment.utc(endDate).format("MMM Do YYYY")}`,
            enrollments: enrollmentDetails,
            bonusInfo: bonusInfo,
            penalizationInfo: penalizationInfo,
            totals: {
                subtotalEnrollments: parseFloat(subtotalEnrollments.toFixed(2)),
                totalBonuses: parseFloat(totalBonuses.toFixed(2)),
                totalPenalizations: parseFloat(totalPenalizations.toFixed(2)),
                grandTotal: parseFloat(grandTotal.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Error generating payout preview:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        res.status(500).json({ message: 'Internal error generating payout preview', error: error.message });
    }
};

module.exports = payoutCtrl;