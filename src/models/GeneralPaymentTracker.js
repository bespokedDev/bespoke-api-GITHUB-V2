// models/GeneralPaymentTracker.js
const mongoose = require('mongoose');

const GeneralPaymentTrackerSchema = new mongoose.Schema({
    month: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{4}-\d{2}$/
    },
    report: {
        type: Object, // El reporte del profesor es un objeto aquí, no un array de profesores
        required: true
    },
    excedents: {
        type: Object,
        required: false,
        default: {}
    },
    specialProfessorReport: {
        type: Object, // Puede ser el objeto del profesor especial, o null
        required: false, // Es opcional, ya que puede no haber data para el profesor especial
        default: null
    },
    summary: {
        type: Object,
        required: false,
        default: {}
    },
    record_special: { // <-- NUEVO CAMPO: Para identificar reportes de profesor especial
        type: Number,
        default: 0 // Por defecto 0 para reportes normales, 1 para especiales
    },
    date_report: {
        type: Date,
        default: Date.now,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GeneralPaymentTracker', GeneralPaymentTrackerSchema, 'general_payment_tracker');