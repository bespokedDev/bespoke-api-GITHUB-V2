// controllers/payouts.controller.js
const Payout = require('../models/Payout');
const Professor = require('../models/Professor');
const Enrollment = require('../models/Enrollment');
// IMPORTANTE: No importamos PaymentMethod aquí porque no estamos referenciando una colección PaymentMethod
// sino un subdocumento dentro del Profesor.

const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose'); // Necesario para mongoose.Types.ObjectId.isValid y new mongoose.Types.ObjectId()

const payoutCtrl = {};

// Propiedades a popular y seleccionar para mejorar el rendimiento
// NOTA CLAVE: 'paymentData' se selecciona para el profesor porque paymentMethodId vive ahí.
const basePopulateOptions = [
    { path: 'professorId', select: 'name ciNumber email phone paymentData' }, // <-- AÑADIDO 'paymentData' AQUÍ
    { path: 'details.enrollmentId', select: 'planId studentIds professorId enrollmentType', populate: [
        { path: 'planId', select: 'name' }, // Popular nombre del plan dentro de la matrícula
        { path: 'studentIds', select: 'name' } // Popular nombres de estudiantes dentro de la matrícula
    ]}
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

// Función auxiliar para calcular subtotal y total
const calculatePayoutAmounts = (details, discount) => {
    let subtotalPerStudents = 0, subtotalAmount = 0
    if (Array.isArray(details)) {
        subtotalPerStudents = details.reduce((sum, detail) => sum + (detail.totalPerStudent || 0), 0);
        subtotalAmount = details.reduce((sum, detail) => sum + (detail.amount || 0), 0);
    }
    const subtotal = subtotalPerStudents + subtotalAmount
    const total = subtotal - (discount || 0);
    return { subtotal, total: Math.max(0, total) };
};

/**
 * @route POST /api/payouts
 * @description Creates a new payout record
 * @access Private (Requires JWT)
 */
payoutCtrl.create = async (req, res) => {
    try {
        const { professorId, month, details, discount, paidAt, paymentMethodId } = req.body;

        // 1. Validar Professor
        /*if (!mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'Invalid Professor ID format.' });
        }
        const professor = await Professor.findById(professorId);
        if (!professor) {
            return res.status(400).json({ message: 'Professor not found with the provided ID.' });
        }

        // 2. Validar paymentMethodId contra el paymentData del profesor
        let foundPaymentMethodSubdocument = null; // Variable para almacenar el subdocumento encontrado
        if (paymentMethodId !== undefined && paymentMethodId !== null) { // Solo si paymentMethodId está presente y no es null
            if (!mongoose.Types.ObjectId.isValid(paymentMethodId)) {
                return res.status(400).json({ message: 'Invalid Payment Method ID format.' });
            }
            // Buscar el subdocumento dentro del array paymentData del profesor
            foundPaymentMethodSubdocument = professor.paymentData.id(paymentMethodId);
            if (!foundPaymentMethodSubdocument) {
                return res.status(400).json({ message: 'Payment Method ID not found in professor\'s paymentData.' });
            }
        }
        // Si paymentMethodId es undefined o null en la request, se guardará como null en el Payout (según el esquema)

        // 3. Validar Detalles (enrollments)
        if (!Array.isArray(details) || details.length === 0) {
            return res.status(400).json({ message: 'Payout details cannot be empty.' });
        }*/
        for (const detail of details) {
            /*if (!mongoose.Types.ObjectId.isValid(detail.enrollmentId) || !(await Enrollment.findById(detail.enrollmentId))) {
                return res.status(400).json({ message: `Invalid or non-existent Enrollment ID: ${detail.enrollmentId}.` });
            }
            if (typeof detail.hoursTaught !== 'number' || detail.hoursTaught < 0) {
                return res.status(400).json({ message: `Invalid hours taught for enrollment ${detail.enrollmentId}.` });
            }
            if (typeof detail.totalPerStudent !== 'number' || detail.totalPerStudent < 0) {
                return res.status(400).json({ message: `Invalid total per student for enrollment ${detail.enrollmentId}.` });
            }*/
            detail._id = new mongoose.Types.ObjectId(); // Asegura un _id para el subdocumento de detalle
        }

        // 4. Calcular Subtotal y Total
        const { subtotal, total } = calculatePayoutAmounts(details, discount);

        // 5. Crear y Guardar el nuevo Payout
        const newPayout = new Payout({
            professorId,
            month,
            details,
            subtotal,
            discount: discount || 0,
            total,
            paymentMethodId: paymentMethodId || null, // Guarda el ID del subdocumento o null
            paidAt: paidAt ? new Date(paidAt) : null,
            isActive: true
        });

        const savedPayout = await newPayout.save();

        // 6. Popular y Responder
        let populatedPayout = await Payout.findById(savedPayout._id)
                                          .populate(basePopulateOptions) // Popular Profesor y Enrollments
                                          .lean(); // Convertir a POJO para la popularización manual

        populatedPayout = populatePaymentMethod(populatedPayout); // Aplicar la popularización manual del paymentMethodId

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
        const { professorId, month, details, discount, paidAt, paymentMethodId } = req.body;

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
            return res.status(400).json({ message: 'Professor not found with the provided ID for update.' });
        }

        // Validate paymentMethodId against professor's paymentData if provided
        if (paymentMethodId !== undefined) { // Check for undefined to allow explicit null
            if (paymentMethodId !== null && !mongoose.Types.ObjectId.isValid(paymentMethodId)) {
                return res.status(400).json({ message: 'Invalid Payment Method ID format for update.' });
            }
            if (paymentMethodId !== null) { // Only search if it's not null
                const foundPaymentMethodSubdocument = professor.paymentData.id(paymentMethodId);
                if (!foundPaymentMethodSubdocument) {
                    return res.status(400).json({ message: 'Payment Method ID not found in professor\'s paymentData for update.' });
                }
            }
        }


        // Validate month if updated
        if (month && !String(month).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'Invalid month format (should be YYYY-MM).' }); // Corrected line!
        }

        // Handle and validate details if provided
        if (details) {
            if (!Array.isArray(details) || details.length === 0) {
                return res.status(400).json({ message: 'Payout details cannot be empty.' });
            }
            for (const detail of details) {
                if (!mongoose.Types.ObjectId.isValid(detail.enrollmentId) || !(await Enrollment.findById(detail.enrollmentId))) {
                    return res.status(400).json({ message: `Invalid or non-existent Enrollment ID in details: ${detail.enrollmentId}.` });
                }
                if (typeof detail.hoursTaught !== 'number' || detail.hoursTaught < 0) {
                    return res.status(400).json({ message: `Invalid hours taught in details for enrollment ${detail.enrollmentId}.` });
                }
                if (typeof detail.totalPerStudent !== 'number' || detail.totalPerStudent < 0) {
                    return res.status(400).json({ message: `Invalid total per student in details for enrollment ${detail.enrollmentId}.` });
                }
                detail._id = detail._id || new mongoose.Types.ObjectId();
            }
        }

        let updatedFields = { ...req.body };
        // Recalculate subtotal and total if details or discount are updated
        if (details || typeof discount === 'number') {
            const currentDetails = details || (currentPayout ? currentPayout.details : []);
            const currentDiscount = typeof discount === 'number' ? discount : (currentPayout ? currentPayout.discount : 0);
            const { subtotal, total } = calculatePayoutAmounts(currentDetails, currentDiscount);
            updatedFields.subtotal = subtotal;
            updatedFields.total = total;
        }

        // Convert paidAt to Date if provided
        if (paidAt && typeof paidAt === 'string') {
            updatedFields.paidAt = new Date(paidAt);
        } else if (paidAt === null) {
            updatedFields.paidAt = null;
        }

        const updatedPayout = await Payout.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
        if (!updatedPayout) {
            return res.status(404).json({ message: 'Payout not found.' });
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
module.exports = payoutCtrl;