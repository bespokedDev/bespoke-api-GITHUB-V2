// models/ClassType.js
const mongoose = require('mongoose');

const ClassTypeSchema = new mongoose.Schema({
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

// Exporta el modelo. El nombre del modelo es 'ClassType' y la colección es 'tipo_de_clase'.
module.exports = mongoose.model('ClassType', ClassTypeSchema, 'tipo_de_clase');

