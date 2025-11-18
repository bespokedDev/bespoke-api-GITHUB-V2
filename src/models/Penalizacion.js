// models/Penalizacion.js
const mongoose = require('mongoose');

const PenalizacionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
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

