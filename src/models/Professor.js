// models/Professor.js
const mongoose = require('mongoose');

// Esquema para la información de contacto de emergencia
const EmergencyContactSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null
    }
}, { _id: false }); // No necesitamos un _id para este subdocumento, se incrusta directamente

// Esquema para los datos de pago
const PaymentDataSchema = new mongoose.Schema({
    bankName: { type: String, trim: true },
    accountType: { type: String, trim: true, default: null },
    accountNumber: { type: String, trim: true, default: null },
    holderName: { type: String, trim: true, default: null },
    holderCI: { type: String, trim: true, default: null },
    holderEmail: { type: String, trim: true, default: null },
    holderAddress: { type: String, trim: true, default: null },
    routingNumber: { type: String, trim: true, default: null }
}, { _id: true }); // Asegura que cada entrada de pago tenga su propio _id



// Esquema principal del Profesor
const ProfessorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ciNumber: { // Número de cédula/identificación
        type: String,
        required: true,
        unique: true, // La cédula debe ser única
        trim: true
    },
    dob: { // Date of Birth (Fecha de Nacimiento)
        type: Date,
        required: true
    },
    address: {
        type: String,
        trim: true,
        default: null
    },
    email: {
        type: String,
        trim: true,
        required: true,
        lowercase: true,
        unique: true, // El email debe ser único
        sparse: true, // Permite múltiples documentos con 'null' en este campo, pero únicos para valores no nulos
        default: null
    },
    password: {
        type: String,
        trim: true,
        default: null
        // contraseña del profesor (debe ser hasheada antes de guardar)
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'professor'],
        default: 'professor'
        // rol del usuario en el sistema
    },
    phone: {
        type: String,
        trim: true
    },
    occupation: {
        type: String,
        trim: true,
        default: null
    },
    startDate: { // Fecha de inicio de trabajo
        type: Date,
        required: true
    },
    emergencyContact: {
        type: EmergencyContactSchema, // Subdocumento para contacto de emergencia
        default: [] // Asegura que siempre exista un objeto, aunque esté vacío
    },
    paymentData: [PaymentDataSchema], // Array de subdocumentos para datos de pago
    isActive: { // Para activar/desactivar lógicamente al profesor
        type: Boolean,
        default: true
    },
    // NUEVO CAMPO: typeId para referenciar ProfessorType
    typeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProfessorTypes', // <-- ¡Esto DEBE coincidir con el nombre del modelo en ProfessorType.js!
        required: false,
        default: null
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo
module.exports = mongoose.model('Professor', ProfessorSchema);