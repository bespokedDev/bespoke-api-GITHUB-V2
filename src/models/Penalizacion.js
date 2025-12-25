// models/Penalizacion.js
const mongoose = require('mongoose');

const PenalizacionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false, // Opcional, pero recomendado para identificar el tipo de penalización
        unique: true,
        sparse: true, // Permite múltiples documentos con 'null' en este campo, pero únicos para valores no nulos
        trim: true
        // Nombre del tipo de penalización (catálogo de tipos disponibles)
    },
    penalizationLevels: {
        type: [{
            tipo: {
                type: String,
                trim: true,
                required: true
                // Tipo de penalización (ej: "Llamado de Atención", "Amonestación", "Suspensión")
            },
            nivel: {
                type: Number,
                required: true,
                min: 1
                // Nivel de la penalización (1, 2, 3, etc.)
            },
            description: {
                type: String,
                trim: true,
                default: null
                // Descripción específica para este nivel y tipo de penalización
            }
        }],
        default: []
        // Array de niveles y tipos de penalización disponibles para este tipo de penalización
        // Permite tener múltiples niveles (1, 2, 3) y tipos (Llamado de Atención, Amonestación, etc.)
        // para una misma penalización
    },
    status: {
        type: Number,
        required: true,
        default: 1, // 1 = activo, 2 = anulado
        enum: [1, 2]
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo. El nombre del modelo es 'Penalizacion' y la colección es 'penalizaciones'.
module.exports = mongoose.model('Penalizacion', PenalizacionSchema, 'penalizaciones');

