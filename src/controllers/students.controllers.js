// controllers/students.controller.js
const Student = require('../models/Student');
const StudentCounter = require('../models/StudentCounter');
const utilsFunctions = require('../utils/utilsFunctions'); // Importa tus funciones de utilidad
const mongoose = require('mongoose');

const studentCtrl = {};

/**
 * Genera un código de estudiante único con formato BES-XXXX
 * @returns {Promise<string>} Código único generado
 */
const generateUniqueStudentCode = async () => {
    try {
        // Usar findOneAndUpdate con upsert para obtener e incrementar el contador
        // Si no existe el documento, lo crea con currentNumber = 1
        const counter = await StudentCounter.findOneAndUpdate(
            {}, // Buscar cualquier documento (solo habrá uno)
            { $inc: { currentNumber: 1 } }, // Incrementar el contador
            { 
                new: true, // Retornar el documento actualizado
                upsert: true, // Crear si no existe
                setDefaultsOnInsert: true // Aplicar valores por defecto al crear
            }
        );
        
        // Formatear el número con ceros a la izquierda (ej: 1 -> 0001, 25 -> 0025)
        const formattedNumber = counter.currentNumber.toString().padStart(4, '0');
        const studentCode = `BES-${formattedNumber}`;
        
        return studentCode;
    } catch (error) {
        console.error('Error al generar código de estudiante:', error);
        // Fallback: usar timestamp si hay error
        const timestamp = Date.now().toString().slice(-4);
        return `BES-${timestamp}`;
    }
};

/**
 * @route POST /api/students
 * @description Crea un nuevo estudiante
 * @access Private (Requiere JWT)
 */
studentCtrl.create = async (req, res) => {
    try {
        // Generar código de estudiante único automáticamente
        const studentCode = await generateUniqueStudentCode();
        
        // Asignar el código generado al body de la petición
        req.body.studentCode = studentCode;
        
        // El campo 'dob' se guarda como String según el modelo Student
        // Si se envía como Date object, se convierte a string ISO
        if (req.body.dob && req.body.dob instanceof Date) {
            req.body.dob = req.body.dob.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        } else if (req.body.dob && typeof req.body.dob === 'string') {
            // Asegurar que el string esté en formato válido (trim)
            req.body.dob = req.body.dob.trim();
        }

        // Generar _id para cada nota si se proporcionan en el cuerpo de la petición
        if (Array.isArray(req.body.notes)) {
            req.body.notes = req.body.notes.map(note => ({
                _id: new mongoose.Types.ObjectId(), // Genera un nuevo ObjectId para la nota
                date: note.date ? new Date(note.date) : new Date(), // Usa la fecha proporcionada o la actual
                text: note.text
            }));
        }

        const newStudent = new Student(req.body);
        const savedStudent = await newStudent.save();

        res.status(201).json({
            message: 'Estudiante creado exitosamente',
            student: savedStudent,
            generatedCode: studentCode // Incluir el código generado en la respuesta
        });
    } catch (error) {
        console.error('Error al crear estudiante:', error);

        // Intenta manejar errores de clave duplicada
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'estudiante');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        // Si no es un error de clave duplicada, devuelve un error genérico
        res.status(500).json({ message: 'Error interno al crear estudiante', error: error.message });
    }
};

/**
 * @route GET /api/students
 * @description Lista todos los estudiantes
 * @access Private (Requiere JWT)
 */
studentCtrl.list = async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al listar estudiantes:', error);
        res.status(500).json({ message: 'Error interno al listar estudiantes', error: error.message });
    }
};

/**
 * @route GET /api/students/:id
 * @description Obtiene un estudiante por su ID
 * @access Private (Requiere JWT)
 */
studentCtrl.getById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error('Error al obtener estudiante por ID:', error);
        // Maneja errores de ID inválido de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener estudiante', error: error.message });
    }
};

/**
 * @route PUT /api/students/:id
 * @description Actualiza un estudiante por su ID
 * @access Private (Requiere JWT)
 */
studentCtrl.update = async (req, res) => {
    try {
        // Validar que el ID del estudiante sea válido antes de continuar
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }

        // El campo 'dob' se guarda como String según el modelo Student
        // Si se envía como Date object, se convierte a string ISO
        if (req.body.dob && req.body.dob instanceof Date) {
            req.body.dob = req.body.dob.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        } else if (req.body.dob && typeof req.body.dob === 'string') {
            // Asegurar que el string esté en formato válido (trim)
            req.body.dob = req.body.dob.trim();
        }

        // Si se actualizan las notas, asegúrate de generar _id para las nuevas si no lo tienen
        if (Array.isArray(req.body.notes)) {
            req.body.notes = req.body.notes.map(note => ({
                _id: note._id || new mongoose.Types.ObjectId(), // Mantiene el _id existente o crea uno nuevo
                date: note.date ? new Date(note.date) : new Date(),
                text: note.text
            }));
        }

        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json({
            message: 'Estudiante actualizado exitosamente',
            student: updatedStudent
        });
    } catch (error) {
        console.error('Error al actualizar estudiante:', error);
        // Intenta manejar errores de clave duplicada
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'estudiante');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }
        // Maneja errores de ID inválido de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al actualizar estudiante', error: error.message });
    }
};

/**
 * @route PATCH /api/students/:id/deactivate
 * @description Desactiva un estudiante por su ID (establece isActive a false)
 * @access Private (Requiere JWT)
 */
studentCtrl.deactivate = async (req, res) => {
    try {
        const deactivatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            {
                isActive: false,
                disenrollmentDate: new Date(),
                // Usa encadenamiento opcional para acceder a req.body.reason de forma segura
                // Si req.body es undefined o req.body.reason es undefined, usará el valor por defecto
                disenrollmentReason: req.body?.reason || 'Desactivado por administración'
            },
            { new: true }
        );
        if (!deactivatedStudent) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json({
            message: 'Estudiante desactivado exitosamente',
            student: deactivatedStudent
        });
    } catch (error) {
        console.error('Error al desactivar estudiante:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al desactivar estudiante', error: error.message });
    }
};

/**
 * @route PATCH /api/students/:id/activate
 * @description Activa un estudiante por su ID (establece isActive a true)
 * @access Private (Requiere JWT)
 */
studentCtrl.activate = async (req, res) => {
    try {
        const activatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { isActive: true, disenrollmentDate: null, disenrollmentReason: null }, // Limpia campos de desinscripción al activar
            { new: true }
        );
        if (!activatedStudent) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json({
            message: 'Estudiante activado exitosamente',
            student: activatedStudent
        });
    } catch (error) {
        console.error('Error al activar estudiante:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al activar estudiante', error: error.message });
    }
};

module.exports = studentCtrl;