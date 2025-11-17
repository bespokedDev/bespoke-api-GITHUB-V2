// models/TipoPago.js
const mongoose = require('mongoose');

const TipoPagoSchema = new mongoose.Schema({
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

// Exporta el modelo. El nombre del modelo es 'TipoPago' y la colección es 'tipos_de_pago'.
module.exports = mongoose.model('TipoPago', TipoPagoSchema, 'tipos_de_pago');

