// models/Payout.js
const mongoose = require('mongoose');

// Esquema para información de enrollments en el payout
const EnrollmentInfoSchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true
        // ID del enrollment
    },
    studentName: {
        type: String,
        required: true,
        trim: true
        // Nombre del estudiante o alias del enrollment
    },
    plan: {
        type: String,
        required: true,
        trim: true
        // Nombre del plan formateado (ej: "S - Panda")
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
        // Subtotal de dinero por este enrollment (horas vistas × precio por hora)
    },
    totalHours: {
        type: Number,
        required: true,
        min: 0
        // Total de registros de clase del enrollment
    },
    hoursSeen: {
        type: Number,
        required: true,
        min: 0
        // Horas vistas calculadas (con conversión fraccional de minutos)
    },
    pPerHour: {
        type: Number,
        required: true,
        min: 0
        // Pago por hora específico de este enrollment
    },
    period: {
        type: String,
        required: true,
        trim: true
        // Rango de fechas del enrollment en el mes (ej: "Dec 1st - Dec 31st")
    }
}, { _id: false }); // No necesitamos _id para estos subdocumentos

// Esquema para información de penalizaciones en el payout
const PenalizationInfoSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PenalizationRegistry',
        required: true
        // ID del registro de penalización
    },
    penalizationMoney: {
        type: Number,
        required: true,
        min: 0
        // Monto de dinero de la penalización
    }
}, { _id: false }); // No necesitamos _id para estos subdocumentos

// Esquema para información de bonos en el payout
const BonusInfoSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProfessorBonus',
        required: true
        // ID del bono (referencia a ProfessorBonus)
    },
    amount: {
        type: Number,
        required: true,
        min: 0
        // Monto del bono
    }
}, { _id: false }); // No necesitamos _id para estos subdocumentos

// Esquema principal del Pago
const PayoutSchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor', // Referencia al modelo de Profesor
        required: true
    },
    month: { // Mes del pago en formato YYYY-MM (ej. "2025-05")
        type: String,
        required: true,
        trim: true,
        match: /^\d{4}-\d{2}$/ // Valida formato YYYY-MM
    },
    enrollmentsInfo: [EnrollmentInfoSchema], // Array con información detallada de cada enrollment
    penalizationInfo: [PenalizationInfoSchema], // Array con información de penalizaciones que restan al total
    bonusInfo: [BonusInfoSchema], // Array con información de bonos que suman al total
    total: { // Total que se pagó (calculado por el frontend: subtotalEnrollments + bonos - penalizaciones)
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    note: {
        type: String,
        required: false,
        default: null
    },
    paymentMethodId: { // ID del método de pago utilizado (ahora apunta a subdocumento de Profesor)
        type: mongoose.Schema.Types.ObjectId, // Almacena el _id del subdocumento paymentData del profesor
        // ¡QUITADA LA REFERENCIA 'ref: 'PaymentMethod' '!
        required: false,
        default: null
    },
    paidAt: { // Fecha y hora en que se realizó el pago
        type: Date,
        required: false,
        default: null
    },
    isActive: { // Para activar/desactivar lógicamente el registro de pago
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Índice único compuesto para asegurar que un profesor solo tenga un pago por mes
PayoutSchema.index({ professorId: 1, month: 1 }, { unique: true });

// Exportar el modelo, especificando el nombre de la colección 'payouts_test'
module.exports = mongoose.model('Payout', PayoutSchema, 'payouts');