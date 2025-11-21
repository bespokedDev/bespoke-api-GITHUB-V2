// models/Enrollment.js
const mongoose = require('mongoose');

// Esquema para los días programados de las clases (¡sin startTime!)
const ScheduledDaySchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], // Días de la semana
        trim: true
    }
}, { _id: true }); // Mongoose añade _id a cada subdocumento por defecto

// Esquema para el profesor suplente
const SubstituteProfessorSchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        required: true
        // ID del profesor suplente
    },
    status: {
        type: Number,
        enum: [1, 0], // 1 para activo en suplencia, 0 para inactivo
        default: 1
        // Estado de suplencia: 1 = activo, 0 = no activo
    },
    assignedDate: {
        type: Date,
        required: true
        // Fecha en que se asignó la suplencia
    },
    expiryDate: {
        type: Date,
        required: true
        // Fecha en que debe vencer la suplencia
    }
}, { _id: true }); // Mongoose añade _id a cada subdocumento por defecto

// Esquema para la información detallada del estudiante en el enrollment
const StudentEnrollmentInfoSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
        // ID del estudiante
    },
    preferences: {
        type: String,
        trim: true,
        default: null
        // preferencias
    },
    firstTimeLearningLanguage: {
        type: String,
        trim: true,
        default: null
        // primera vez aprendiendo un idioma
    },
    previousExperience: {
        type: String,
        trim: true,
        default: null
        // experiencia previa
    },
    goals: {
        type: String,
        trim: true,
        default: null
        // metas
    },
    dailyLearningTime: {
        type: String,
        trim: true,
        default: null
        // tiempo de aprendizaje por dia
    },
    learningType: {
        type: String,
        trim: true,
        default: null
        // tipo de aprendizaje
    },
    idealClassType: {
        type: String,
        trim: true,
        default: null
        // tipo de clase ideal
    },
    learningDifficulties: {
        type: String,
        trim: true,
        default: null
        // dificultades de aprendizaje
    },
    languageLevel: {
        type: String,
        trim: true,
        default: null
        // nivel de idioma
    }
}, { _id: true }); // Mongoose añade _id a cada subdocumento por defecto

const EnrollmentSchema = new mongoose.Schema({
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    studentIds: [StudentEnrollmentInfoSchema], // Array de información detallada de estudiantes
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        required: true
    },
    enrollmentType: {
        type: String,
        enum: ['single', 'couple', 'group'],
        required: true
    },
    classCalculationType: {
        type: Number,
        enum: [1, 2],
        default: 1
        // 1 para enrollment normal (calculo de clases por semana y por scheduledDays)
        // 2 para clases por semana / plan
    },
    alias: {
        type: String,
        trim: true,
        default: null
    },
    language: {
        type: String,
        enum: ['English', 'French'],
        required: true
    },
    scheduledDays: [ScheduledDaySchema], // ¡Ahora es un array de objetos ScheduledDaySchema sin startTime!
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    startDate: {
        type: Date
        //default: Date.now
    },
    endDate: {
        type: Date
        // fecha de vencimiento del enrollment (un mes menos un día desde startDate)
    },
    pricePerStudent: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    available_balance: {
        type: Number,
        min: 0
        // balance disponible
    },
    disolve_reason: {
        type: String,
        trim: true,
        default: null
    },
    rescheduleHours: {
        type: Number,
        default: 0,
        min: 0
        // horas de reschedule
    },
    substituteProfessor: {
        type: SubstituteProfessorSchema,
        default: null
        // profesor suplente
    },
    cancellationPaymentsEnabled: {
        type: Boolean,
        default: false
        // pagos de cancelación activados
    },
    graceDays: {
        type: Number,
        default: 0,
        min: 0
        // días de gracia
    },
    latePaymentPenalty: {
        type: Number,
        default: 0,
        min: 0
        // penalización de dinero en caso de que se retrase el pago
    },
    extendedGraceDays: {
        type: Number,
        default: 0,
        min: 0
        // extender, de manera excepcional, los días de gracia
    },
    status: {
        type: Number,
        enum: [1, 0, 2], // 1 para activo, 2 para inactivo y 0 para disolve
        default: 1
    }
}, {
    timestamps: true
});

// Exportar el modelo, especificando el nombre de la colección 'enrollments_test'
module.exports = mongoose.model('Enrollment', EnrollmentSchema, 'enrollments');