// models/Evaluation.js
const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
    classRegistryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassRegistry',
        required: true
        // ID del registro de clase al que pertenece la evaluación
    },
    fecha: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{2}\/\d{2}\/\d{4}$/
        // fecha de la evaluación en formato DD/MM/YYYY (ej: 07/01/2025)
    },
    temasEvaluados: {
        type: String,
        trim: true,
        default: null
        // temas evaluados
    },
    skillEvaluada: {
        type: String,
        trim: true,
        default: null
        // skill evaluada
    },
    linkMaterial: {
        type: String,
        trim: true,
        default: null
        // Link del material usado en la evaluación
    },
    capturePrueba: {
        type: String,
        trim: true,
        default: null
        // capture de la prueba en curso (almacenado como base64)
    },
    puntuacion: {
        type: String,
        trim: true,
        default: null
        // puntuación de la evaluación
    },
    comentario: {
        type: String,
        trim: true,
        default: null
        // comentario sobre la evaluación
    },
    isActive: {
        type: Boolean,
        default: true
        // Estado de la evaluación: true = activa, false = anulada
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo. El nombre del modelo es 'Evaluation' y la colección es 'evaluations'.
module.exports = mongoose.model('Evaluation', EvaluationSchema, 'evaluations');

