// models/Payout.js
const mongoose = require('mongoose');

// Esquema para los detalles individuales de un pago
const PayoutDetailSchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment', // Referencia al modelo de Matriculación
    },
    hoursTaught: {
        type: Number,
        min: 0
    },
    totalPerStudent: { // Cantidad pagada por este estudiante/matriculación en particular
        type: Number,
        min: 0
    },
    description: {
        type: String,
        default: null
    },
    amount: {
        type: Number,
        default: null
    },
    status: {
        type: Number,
        default: 1
    }
}, { _id: true }); // Mongoose añade _id a cada subdocumento por defecto

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
    details: [PayoutDetailSchema], // Array de subdocumentos para los detalles de las matriculaciones
    subtotal: { // Suma de totalPerStudent de todos los detalles
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    discount: { // Descuentos aplicados al pago
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    total: { // subtotal - discount
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    note: {
        type: String,
        require: false
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