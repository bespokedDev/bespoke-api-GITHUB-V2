// models/ClassObjective.js
const mongoose = require('mongoose');

const ClassObjectiveSchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true
        // ID del enrollment al que pertenece el objetivo
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContentClass',
        required: true
        // ID de la categoría (referencia a la colección content-class)
    },
    teachersNote: {
        type: String,
        trim: true,
        default: null
        // Nota del profesor sobre el objetivo
    },
    objective: {
        type: String,
        required: true,
        trim: true
        // Descripción del objetivo
    },
    objectiveDate: {
        type: Date,
        required: true
        // Fecha del objetivo
    },
    objectiveAchieved: {
        type: Boolean,
        default: false
        // Indica si el objetivo fue alcanzado
    },
    isActive: {
        type: Boolean,
        default: true
        // Indica si el objetivo está activo (true) o anulado (false)
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Índices para búsquedas eficientes
ClassObjectiveSchema.index({ enrollmentId: 1, objectiveDate: -1 });
ClassObjectiveSchema.index({ enrollmentId: 1, objectiveAchieved: 1 });

// Exporta el modelo. El nombre del modelo es 'ClassObjective' y la colección es 'classObjectives'.
module.exports = mongoose.model('ClassObjective', ClassObjectiveSchema, 'classObjectives');

