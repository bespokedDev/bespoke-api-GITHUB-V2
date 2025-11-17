const mongoose = require('mongoose');

const DivisaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo. El nombre del modelo es 'Divisa' y la colección será 'divisas'.
module.exports = mongoose.model('Divisa', DivisaSchema, 'divisas');