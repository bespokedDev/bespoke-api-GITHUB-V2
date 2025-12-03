// controllers/evaluations.controller.js
const Evaluation = require('../models/Evaluation');
const ClassRegistry = require('../models/ClassRegistry');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');

const evaluationCtrl = {};

/**
 * @route POST /api/evaluations
 * @description Crea una nueva evaluación
 * @access Private (Requiere JWT) - Solo profesor
 */
evaluationCtrl.create = async (req, res) => {
    try {
        const { classRegistryId, fecha, temasEvaluados, skillEvaluada, linkMaterial, capturePrueba, puntuacion, comentario } = req.body;

        // Validar que classRegistryId esté presente y sea válido
        if (!classRegistryId || !mongoose.Types.ObjectId.isValid(classRegistryId)) {
            return res.status(400).json({ message: 'ID de registro de clase inválido o no proporcionado' });
        }

        // Validar que la fecha esté presente y tenga el formato correcto
        if (!fecha) {
            return res.status(400).json({ message: 'La fecha es requerida' });
        }

        // Validar formato de fecha DD/MM/YYYY
        const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!fechaRegex.test(fecha)) {
            return res.status(400).json({ message: 'La fecha debe estar en formato DD/MM/YYYY (ej: 07/01/2025)' });
        }

        // Verificar que el registro de clase existe
        const classRegistry = await ClassRegistry.findById(classRegistryId);
        if (!classRegistry) {
            return res.status(404).json({ message: 'Registro de clase no encontrado' });
        }

        // Si el usuario es profesor, verificar que el enrollment pertenece al profesor
        const userRole = req.user?.role;
        const userId = req.user?.id;
        
        if (userRole === 'professor' && userId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            const enrollment = await Enrollment.findById(classRegistry.enrollmentId);
            
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment no encontrado para este registro de clase' });
            }

            // Verificar que el profesor está asignado a este enrollment
            if (enrollment.professorId.toString() !== professorObjectId.toString()) {
                return res.status(403).json({ message: 'No tienes permiso para crear evaluaciones en esta clase' });
            }
        }

        // Crear la nueva evaluación
        const newEvaluation = new Evaluation({
            classRegistryId,
            fecha: fecha.trim(),
            temasEvaluados: temasEvaluados ? temasEvaluados.trim() : null,
            skillEvaluada: skillEvaluada ? skillEvaluada.trim() : null,
            linkMaterial: linkMaterial ? linkMaterial.trim() : null,
            capturePrueba: capturePrueba ? capturePrueba.trim() : null,
            puntuacion: puntuacion ? puntuacion.trim() : null,
            comentario: comentario ? comentario.trim() : null
        });

        const savedEvaluation = await newEvaluation.save();

        // Actualizar el array de evaluations en ClassRegistry
        await ClassRegistry.findByIdAndUpdate(
            classRegistryId,
            { $push: { evaluations: savedEvaluation._id } },
            { new: true }
        );

        res.status(201).json({
            message: 'Evaluación creada exitosamente',
            evaluation: savedEvaluation
        });
    } catch (error) {
        console.error('Error al crear evaluación:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID inválido' });
        }
        res.status(500).json({ message: 'Error interno al crear evaluación', error: error.message });
    }
};

/**
 * @route GET /api/evaluations/class/:classRegistryId
 * @description Lista todas las evaluaciones de un registro de clase
 * @access Private (Requiere JWT) - Profesor, admin y estudiante
 */
evaluationCtrl.listByClass = async (req, res) => {
    try {
        const { classRegistryId } = req.params;

        if (!classRegistryId || !mongoose.Types.ObjectId.isValid(classRegistryId)) {
            return res.status(400).json({ message: 'ID de registro de clase inválido' });
        }

        const classRegistryObjectId = new mongoose.Types.ObjectId(classRegistryId);

        // Verificar que el registro de clase existe
        const classRegistry = await ClassRegistry.findById(classRegistryObjectId);
        if (!classRegistry) {
            return res.status(404).json({ message: 'Registro de clase no encontrado' });
        }

        // Si el usuario es profesor, verificar que el enrollment pertenece al profesor
        const userRole = req.user?.role;
        const userId = req.user?.id;
        
        if (userRole === 'professor' && userId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            const enrollment = await Enrollment.findById(classRegistry.enrollmentId);
            
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment no encontrado para este registro de clase' });
            }

            // Verificar que el profesor está asignado a este enrollment
            if (enrollment.professorId.toString() !== professorObjectId.toString()) {
                return res.status(403).json({ message: 'No tienes permiso para ver evaluaciones de esta clase' });
            }
        }

        // Buscar todas las evaluaciones activas (isActive = true o no existe el campo)
        const evaluations = await Evaluation.find({
            classRegistryId: classRegistryObjectId,
            isActive: { $ne: false } // Incluir evaluaciones activas o sin campo isActive
        })
        .sort({ fecha: -1, createdAt: -1 }) // Ordenar por fecha más reciente primero
        .lean();

        res.status(200).json({
            message: 'Evaluaciones obtenidas exitosamente',
            classRegistryId: classRegistryId,
            total: evaluations.length,
            evaluations: evaluations
        });
    } catch (error) {
        console.error('Error al listar evaluaciones:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de registro de clase inválido' });
        }
        res.status(500).json({ message: 'Error interno al listar evaluaciones', error: error.message });
    }
};

/**
 * @route GET /api/evaluations/:id
 * @description Obtiene una evaluación por su ID
 * @access Private (Requiere JWT) - Profesor, admin y estudiante
 */
evaluationCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }

        const evaluation = await Evaluation.findById(id)
            .populate('classRegistryId', 'classDate classTime enrollmentId')
            .lean();

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluación no encontrada' });
        }

        // Verificar que la evaluación esté activa
        if (evaluation.isActive === false) {
            return res.status(404).json({ message: 'Evaluación no encontrada o anulada' });
        }

        // Si el usuario es profesor, verificar que el enrollment pertenece al profesor
        const userRole = req.user?.role;
        const userId = req.user?.id;
        
        if (userRole === 'professor' && userId && evaluation.classRegistryId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            const enrollment = await Enrollment.findById(evaluation.classRegistryId.enrollmentId);
            
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment no encontrado para esta evaluación' });
            }

            // Verificar que el profesor está asignado a este enrollment
            if (enrollment.professorId.toString() !== professorObjectId.toString()) {
                return res.status(403).json({ message: 'No tienes permiso para ver esta evaluación' });
            }
        }

        res.status(200).json({
            message: 'Evaluación obtenida exitosamente',
            evaluation: evaluation
        });
    } catch (error) {
        console.error('Error al obtener evaluación:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener evaluación', error: error.message });
    }
};

/**
 * @route PUT /api/evaluations/:id
 * @description Actualiza una evaluación por su ID
 * @access Private (Requiere JWT) - Profesor y admin
 */
evaluationCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, temasEvaluados, skillEvaluada, linkMaterial, capturePrueba, puntuacion, comentario } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }

        // Verificar que la evaluación existe
        const evaluation = await Evaluation.findById(id)
            .populate('classRegistryId', 'enrollmentId');

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluación no encontrada' });
        }

        // Si el usuario es profesor, verificar que el enrollment pertenece al profesor
        const userRole = req.user?.role;
        const userId = req.user?.id;
        
        if (userRole === 'professor' && userId && evaluation.classRegistryId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            const enrollment = await Enrollment.findById(evaluation.classRegistryId.enrollmentId);
            
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment no encontrado para esta evaluación' });
            }

            // Verificar que el profesor está asignado a este enrollment
            if (enrollment.professorId.toString() !== professorObjectId.toString()) {
                return res.status(403).json({ message: 'No tienes permiso para editar esta evaluación' });
            }
        }

        // Validar formato de fecha si se proporciona
        if (fecha) {
            const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!fechaRegex.test(fecha)) {
                return res.status(400).json({ message: 'La fecha debe estar en formato DD/MM/YYYY (ej: 07/01/2025)' });
            }
        }

        // Construir objeto de actualización
        const updateFields = {};
        if (fecha !== undefined) updateFields.fecha = fecha.trim();
        if (temasEvaluados !== undefined) updateFields.temasEvaluados = temasEvaluados ? temasEvaluados.trim() : null;
        if (skillEvaluada !== undefined) updateFields.skillEvaluada = skillEvaluada ? skillEvaluada.trim() : null;
        if (linkMaterial !== undefined) updateFields.linkMaterial = linkMaterial ? linkMaterial.trim() : null;
        if (capturePrueba !== undefined) updateFields.capturePrueba = capturePrueba ? capturePrueba.trim() : null;
        if (puntuacion !== undefined) updateFields.puntuacion = puntuacion ? puntuacion.trim() : null;
        if (comentario !== undefined) updateFields.comentario = comentario ? comentario.trim() : null;

        const updatedEvaluation = await Evaluation.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Evaluación actualizada exitosamente',
            evaluation: updatedEvaluation
        });
    } catch (error) {
        console.error('Error al actualizar evaluación:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }
        res.status(500).json({ message: 'Error interno al actualizar evaluación', error: error.message });
    }
};

/**
 * @route PATCH /api/evaluations/:id/anular
 * @description Anula una evaluación (establece isActive a false)
 * @access Private (Requiere JWT) - Admin y profesor
 */
evaluationCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }

        // Verificar que la evaluación existe
        const evaluation = await Evaluation.findById(id)
            .populate('classRegistryId', 'enrollmentId');

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluación no encontrada' });
        }

        // Si el usuario es profesor, verificar que el enrollment pertenece al profesor
        const userRole = req.user?.role;
        const userId = req.user?.id;
        
        if (userRole === 'professor' && userId && evaluation.classRegistryId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            const enrollment = await Enrollment.findById(evaluation.classRegistryId.enrollmentId);
            
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment no encontrado para esta evaluación' });
            }

            // Verificar que el profesor está asignado a este enrollment
            if (enrollment.professorId.toString() !== professorObjectId.toString()) {
                return res.status(403).json({ message: 'No tienes permiso para anular esta evaluación' });
            }
        }

        const anulatedEvaluation = await Evaluation.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        res.status(200).json({
            message: 'Evaluación anulada exitosamente',
            evaluation: anulatedEvaluation
        });
    } catch (error) {
        console.error('Error al anular evaluación:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }
        res.status(500).json({ message: 'Error interno al anular evaluación', error: error.message });
    }
};

/**
 * @route PATCH /api/evaluations/:id/activate
 * @description Activa una evaluación (establece isActive a true)
 * @access Private (Requiere JWT) - Admin y profesor
 */
evaluationCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }

        // Verificar que la evaluación existe
        const evaluation = await Evaluation.findById(id)
            .populate('classRegistryId', 'enrollmentId');

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluación no encontrada' });
        }

        // Si el usuario es profesor, verificar que el enrollment pertenece al profesor
        const userRole = req.user?.role;
        const userId = req.user?.id;
        
        if (userRole === 'professor' && userId && evaluation.classRegistryId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            const enrollment = await Enrollment.findById(evaluation.classRegistryId.enrollmentId);
            
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment no encontrado para esta evaluación' });
            }

            // Verificar que el profesor está asignado a este enrollment
            if (enrollment.professorId.toString() !== professorObjectId.toString()) {
                return res.status(403).json({ message: 'No tienes permiso para activar esta evaluación' });
            }
        }

        const activatedEvaluation = await Evaluation.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true }
        );

        res.status(200).json({
            message: 'Evaluación activada exitosamente',
            evaluation: activatedEvaluation
        });
    } catch (error) {
        console.error('Error al activar evaluación:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de evaluación inválido' });
        }
        res.status(500).json({ message: 'Error interno al activar evaluación', error: error.message });
    }
};

module.exports = evaluationCtrl;

