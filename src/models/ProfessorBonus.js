// models/ProfessorBonus.js
const mongoose = require('mongoose');

/**
 * Modelo para bonos de profesores
 * Los bonos se crean desde el perfil del profesor y aparecen en:
 * - Reporte de excedentes (con valor negativo)
 * - Reporte de pagos de profesores (en sección "abonos")
 */
const ProfessorBonusSchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        required: true
        // ID del profesor al que se le otorga el bono (referencia a la colección Professor)
    },
    amount: {
        type: Number,
        required: true,
        min: 0
        // Monto del bono (siempre positivo, se mostrará como negativo en excedentes)
    },
    description: {
        type: String,
        trim: true,
        default: null
        // Descripción del bono (razón, motivo, etc.)
    },
    bonusDate: {
        type: Date,
        required: true,
        default: Date.now
        // Fecha en que se otorga el bono
    },
    month: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/
        // Mes del bono en formato YYYY-MM (para facilitar búsquedas y reportes)
        // Ejemplo: "2025-01" para enero de 2025
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
        // ID del usuario administrador que creó el bono (referencia a la colección User)
    },
    status: {
        type: Number,
        required: true,
        default: 1,
        enum: [1, 2]
        // Estado del bono: 1 = activo, 2 = anulado
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Índice compuesto para búsquedas eficientes por profesor y mes
ProfessorBonusSchema.index({ professorId: 1, month: 1 });

// Índice para búsquedas por mes
ProfessorBonusSchema.index({ month: 1 });

// Índice para búsquedas por estado
ProfessorBonusSchema.index({ status: 1 });

// Exporta el modelo. El nombre del modelo es 'ProfessorBonus' y la colección es 'professor-bonuses'.
module.exports = mongoose.model('ProfessorBonus', ProfessorBonusSchema, 'professor-bonuses');

