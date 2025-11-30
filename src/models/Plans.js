const mongoose = require('mongoose');

// Esquema para el subdocumento de precios
const PricingSchema = new mongoose.Schema({
    single: {
        type: Number,
        required: true,
        min: 0 // El precio no puede ser negativo
    },
    couple: {
        type: Number,
        required: true,
        min: 0
    },
    group: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false }); // No necesitamos un _id para este subdocumento

// Esquema principal del Plan
const PlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // El nombre del plan debe ser único
        trim: true
    },
    weeklyClasses: {
        type: Number,
        required: true,
        min: 0 // No puede haber clases semanales negativas
    },
    pricing: {
        type: PricingSchema, // Referencia al subdocumento de precios
        required: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    isActive: { // Para activar/desactivar lógicamente el plan
        type: Boolean,
        default: true
    },
    planType: {
        type: Number,
        enum: [1, 2],
        required: true
        // 1 para plan mensual (se calcula dinámicamente, ej: del 22 de enero al 22 de febrero)
        // 2 para plan semanal (se calcula por número de semanas)
    },
    weeks: {
        type: Number,
        default: null,
        min: 0
        // null para planType 1 (mensual) - el cálculo es dinámico por fechas
        // número de semanas para planType 2 (semanal) - con este valor se calcula el número de clases
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo
module.exports = mongoose.model('Plan', PlanSchema);