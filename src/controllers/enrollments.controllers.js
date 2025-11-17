// controllers/enrollments.controller.js
const Enrollment = require('../models/Enrollment');
const Plan = require('../models/Plans'); // Necesario para popular
const Student = require('../models/Student'); // Necesario para popular
const Professor = require('../models/Professor'); // Necesario para popular
const utilsFunctions = require('../utils/utilsFunctions'); // Importa tus funciones de utilidad
const mongoose = require('mongoose');

const enrollmentCtrl = {};

// Propiedades a popular y seleccionar para mejorar el rendimiento
const populateOptions = [
    { path: 'planId', select: 'name weeklyClasses pricing description' }, // Datos relevantes del plan
    { path: 'studentIds', select: 'name studentCode email phone' }, // Datos relevantes de los estudiantes
    { path: 'professorId', select: 'name email phone occupation' } // Datos relevantes del profesor
];

/**
 * @route POST /api/enrollments
 * @description Crea una nueva matrícula
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.create = async (req, res) => {
    try {
        // Validación de IDs antes de crear
        const { planId, studentIds, professorId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(planId) || !(await Plan.findById(planId))) {
            return res.status(400).json({ message: 'ID de Plan inválido o no existente.' });
        }
        if (!mongoose.Types.ObjectId.isValid(professorId) || !(await Professor.findById(professorId))) {
            return res.status(400).json({ message: 'ID de Profesor inválido o no existente.' });
        }
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Se requiere al menos un ID de estudiante.' });
        }
        for (const studentId of studentIds) {
            if (!mongoose.Types.ObjectId.isValid(studentId) || !(await Student.findById(studentId))) {
                return res.status(400).json({ message: `ID de estudiante inválido o no existente: ${studentId}.` });
            }
        }

        // Asegúrate de que los campos de fecha se conviertan a Date si vienen como string
        if (req.body.purchaseDate && typeof req.body.purchaseDate === 'string') {
            req.body.purchaseDate = new Date(req.body.purchaseDate);
        }

        const newEnrollment = new Enrollment(req.body);
        const savedEnrollment = await newEnrollment.save();

        // Popular los campos en la respuesta
        const populatedEnrollment = await Enrollment.findById(savedEnrollment._id)
                                                    .populate(populateOptions)
                                                    .lean();

        res.status(201).json({
            message: 'Matrícula creada exitosamente',
            enrollment: populatedEnrollment
        });
    } catch (error) {
        console.error('Error al crear matrícula:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'matrícula');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear matrícula', error: error.message });
    }
};

/**
 * @route GET /api/enrollments
 * @description Lista todas las matrículas con datos populados
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.list = async (req, res) => {
    try {
        const enrollments = await Enrollment.find()
                                            .populate(populateOptions) // Popular todos los campos de referencia
                                            .lean(); // Para obtener objetos JS planos

        res.status(200).json(enrollments);
    } catch (error) {
        console.error('Error al listar matrículas:', error);
        res.status(500).json({ message: 'Error interno al listar matrículas', error: error.message });
    }
};

/**
 * @route GET /api/enrollments/:id
 * @description Obtiene una matrícula por su ID con datos populados
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.getById = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
                                            .populate(populateOptions) // Popular todos los campos de referencia
                                            .lean(); // Para obtener un objeto JS plano

        if (!enrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }
        res.status(200).json(enrollment);
    } catch (error) {
        console.error('Error al obtener matrícula por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener matrícula', error: error.message });
    }
};

/**
 * @route PUT /api/enrollments/:id
 * @description Actualiza una matrícula por su ID
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.update = async (req, res) => {
    try {
        // Asegúrate de que los campos de fecha se conviertan a Date si vienen como string
        if (req.body.purchaseDate && typeof req.body.purchaseDate === 'string') {
            req.body.purchaseDate = new Date(req.body.purchaseDate);
        }

        // Si se actualizan studentIds, validar que sean ObjectIds válidos y existan
        if (req.body.studentIds) {
            if (!Array.isArray(req.body.studentIds) || req.body.studentIds.length === 0) {
                return res.status(400).json({ message: 'El array de studentIds no puede estar vacío.' });
            }
            for (const studentId of req.body.studentIds) {
                if (!mongoose.Types.ObjectId.isValid(studentId) || !(await Student.findById(studentId))) {
                    return res.status(400).json({ message: `ID de estudiante inválido o no existente para actualizar: ${studentId}.` });
                }
            }
        }

        // Opcional: Validar planId y professorId si se están actualizando
        if (req.body.planId && (!mongoose.Types.ObjectId.isValid(req.body.planId) || !(await Plan.findById(req.body.planId)))) {
            return res.status(400).json({ message: 'ID de Plan inválido o no existente para actualizar.' });
        }
        if (req.body.professorId && (!mongoose.Types.ObjectId.isValid(req.body.professorId) || !(await Professor.findById(req.body.professorId)))) {
            return res.status(400).json({ message: 'ID de Profesor inválido o no existente para actualizar.' });
        }

        const updatedEnrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEnrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Popular los campos en la respuesta de actualización
        const populatedUpdatedEnrollment = await Enrollment.findById(updatedEnrollment._id)
                                                            .populate(populateOptions)
                                                            .lean();

        res.status(200).json({
            message: 'Matrícula actualizada exitosamente',
            enrollment: populatedUpdatedEnrollment
        });
    } catch (error) {
        console.error('Error al actualizar matrícula:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'matrícula');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar matrícula', error: error.message });
    }
};

/**
 * @route PATCH /api/enrollments/:id/deactivate
 * @description Desactiva una matrícula (establece isActive a false y status a "No Active")
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.deactivate = async (req, res) => {
    console.log("!!!!!!!!", req.params)
    try {
        
        const deactivatedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { status: 0},
            { new: true }
        );
        if (!deactivatedEnrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Popular en la respuesta
        const populatedDeactivatedEnrollment = await Enrollment.findById(deactivatedEnrollment._id)
                                                                .populate(populateOptions)
                                                                .lean();

        res.status(200).json({
            message: 'Matrícula desactivada exitosamente',
            enrollment: populatedDeactivatedEnrollment
        });
    } catch (error) {
        console.error('Error al desactivar matrícula:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al desactivar matrícula', error: error.message });
    }
};

/**
 * @route PATCH /api/enrollments/:id/activate
 * @description Activa una matrícula (establece isActive a true y status a "Active")
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.activate = async (req, res) => {
    try {
        const activatedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { status: 1},
            { new: true }
        );
        if (!activatedEnrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Popular en la respuesta
        const populatedActivatedEnrollment = await Enrollment.findById(activatedEnrollment._id)
                                                            .populate(populateOptions)
                                                            .lean();

        res.status(200).json({
            message: 'Matrícula activada exitosamente',
            enrollment: populatedActivatedEnrollment
        });
    } catch (error) {
        console.error('Error al activar matrícula:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al activar matrícula', error: error.message });
    }
};

/**
 * @route GET /api/enrollments/professor/:professorId
 * @description Obtiene todas las matrículas asociadas a un profesor específico, con datos populados.
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.getEnrollmentsByProfessorId = async (req, res) => {
    try {
        const { professorId } = req.params;

        // Validar que el ID del profesor sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'ID de Profesor inválido.' });
        }

        // Buscar matrículas por professorId y popular los campos necesarios
        const enrollments = await Enrollment.find({ professorId: professorId })
                                            .populate(populateOptions) // Utiliza las opciones de popularización existentes
                                            .lean(); // Para obtener objetos JS planos

        if (!enrollments || enrollments.length === 0) {
            return res.status(404).json({ message: 'No se encontraron matrículas para este profesor.' });
        }

        res.status(200).json(enrollments);
    } catch (error) {
        console.error('Error al obtener matrículas por ID de profesor:', error);
        // Maneja errores de ID inválido de Mongoose (si el professorId en el filtro es válido pero falla el populate)
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Error de casting al obtener matrículas por profesor. Verifique los IDs referenciados.' });
        }
        res.status(500).json({ message: 'Error interno al obtener matrículas por profesor', error: error.message });
    }
};

module.exports = enrollmentCtrl;