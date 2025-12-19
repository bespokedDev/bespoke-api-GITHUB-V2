// models/Penalizacion.js
const mongoose = require('mongoose');

const PenalizacionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false, // Ahora opcional para permitir registros de penalización sin name
        unique: true,
        sparse: true, // Permite múltiples documentos con 'null' en este campo, pero únicos para valores no nulos
        trim: true
        // Nombre del tipo de penalización (para tipos de penalización)
    },
    description: {
        type: String,
        trim: true,
        default: null
        // descripción detallada del tipo de penalización
    },
    status: {
        type: Number,
        required: true,
        default: 1, // 1 = activo, 2 = anulado
        enum: [1, 2]
    },
    // Campos para registros de penalización por enrollment (opcionales)
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        default: null
        // ID del enrollment (para registros de penalización generados por cronjob)
    },
    penalization_description: {
        type: String,
        trim: true,
        default: null
        // Descripción de la penalización aplicada al enrollment
    },
    penalizationMoney: {
        type: Number,
        default: null,
        min: 0
        // Monto de dinero de la penalización (sacado del enrollment)
    },
    lateFee: {
        type: Number,
        default: null,
        min: 0
        // Número de días de lateFee (sacado del enrollment)
    },
    endDate: {
        type: Date,
        default: null
        // Fecha de fin del enrollment (sacada del enrollment)
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo. El nombre del modelo es 'Penalizacion' y la colección es 'penalizaciones'.
module.exports = mongoose.model('Penalizacion', PenalizacionSchema, 'penalizaciones');

