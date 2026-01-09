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
    },
    experiencePastClass: {
        type: String,
        trim: true,
        default: null
        // como ha sido la experiencia en clases pasadas?
    },
    howWhereTheClasses: {
        type: String,
        trim: true,
        default: null
        // como fueron las clases anteriores
    },
    roleGroup: {
        type: String,
        trim: true,
        default: null
        // rol del grupo, lider, organizador...
    },
    willingHomework: {
        type: Number,
        enum: [0, 1],
        default: null
        // si quieren hacer tareas o no, status: 1 si quiere tareas, 0 si no
    },
    availabityToPractice: {
        type: String,
        trim: true,
        default: null
        // en horas, 1hr, 2hr, 3hr
    },
    learningDifficulty: {
        type: Number,
        enum: [0, 1],
        default: null
        // si o no: 1 para si, 0 para no
    },
    amount: {
        type: Number,
        min: 0
        // monto disponible por estudiante (precio del plan según enrollmentType dividido entre el número de estudiantes)
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
        // fecha de vencimiento del enrollment
        // Para planType 1 (mensual): se calcula dinámicamente (un mes menos un día desde startDate, ej: del 22 de enero al 22 de febrero)
        // Para planType 2 (semanal): se calcula según el número de semanas del plan
    },
    monthlyClasses: {
        type: Number,
        min: 0
        // número total de clases calculadas para el enrollment
        // Para planType 1 (mensual): weeklyClasses * número_de_clases_calculadas_dinámicamente (calculado según el período mensual)
        // Para planType 2 (semanal): weeks * weeklyClasses
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
    balance_per_class: {
        type: Number,
        min: 0
        // valor del dinero que le queda por cada clase que han visto los estudiantes.
    },
    disolve_reason: {
        type: String,
        trim: true,
        default: null
    },
    disolve_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
        // ID del usuario que realizó el disolve del enrollment
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
        // pagos de cancelación automaticos activados (true) o desactivados (false)
    },
    latePaymentPenalty: {
        type: Number,
        default: 0,
        min: 0
        // penalización de dinero en caso de que se retrase el pago
    },
    lateFee: {
        type: Number,
        required: true,
        min: 0
        // número de días tolerables de retraso en los pagos
        // Si el lateFee es 2 y el enrollment tiene endDate del 12 de diciembre,
        // el estudiante tiene hasta el 14 de diciembre para pagar antes de generar una penalización
    },
    penalizationMoney: {
        type: Number,
        default: 0,
        min: 0
        // monto de dinero de la penalización aplicada por retraso en el pago
    },
    penalizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Penalizacion',
        default: null
        // ID del tipo de penalización aplicada (referencia a la colección Penalizacion)
    },
    status: {
        type: Number,
        enum: [1, 0, 2, 3], // 1 = activo, 2 = inactivo, 0 = disolve, 3 = en pausa
        default: 1
        // Estados del enrollment:
        // 1 = Activo (por defecto)
        // 2 = Inactivo (desactivado)
        // 0 = Disuelto (disolve)
        // 3 = En pausa (temporalmente suspendido)
    }
}, {
    timestamps: true
});

// Exportar el modelo, especificando el nombre de la colección 'enrollments_test'
module.exports = mongoose.model('Enrollment', EnrollmentSchema, 'enrollments');