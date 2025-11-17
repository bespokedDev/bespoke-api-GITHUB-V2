// models/PaymentMethod.js
const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
    name: { // Ej: "Zelle", "Banesco", "Binance Pay", "Efectivo"
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: { // Ej: "Bank Transfer", "Crypto", "Cash"
        type: String,
        trim: true
    },
    description: {
        type: String,
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

// Exporta el modelo. El nombre del modelo es 'PaymentMethod' y la colección es 'paymentMethods'.
module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema, 'paymentMethods');