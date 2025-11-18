// models/ContentClass.js
const mongoose = require('mongoose');

const ContentClassSchema = new mongoose.Schema({
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

// Exporta el modelo. El nombre del modelo es 'ContentClass' y la colección es 'content-class'.
module.exports = mongoose.model('ContentClass', ContentClassSchema, 'content-class');

