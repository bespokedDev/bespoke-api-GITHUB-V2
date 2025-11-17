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

const EnrollmentSchema = new mongoose.Schema({
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    }],
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
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: Number,
        enum: [1, 0, 2], //1 para activo, 0 para inactivo y 2 para pausado
        default: 1
    }
}, {
    timestamps: true
});

// Exportar el modelo, especificando el nombre de la colección 'enrollments_test'
module.exports = mongoose.model('Enrollment', EnrollmentSchema, 'enrollments');