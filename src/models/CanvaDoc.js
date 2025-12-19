const mongoose = require('mongoose');

// Esquema principal de CanvaDoc
const CanvaDocSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
        // Descripción del documento Canva
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
        // ID vinculante para un ObjectId de Student
    },
    isActive: {
        type: Boolean,
        default: true
        // Para activar/desactivar lógicamente el documento Canva
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo
module.exports = mongoose.model('CanvaDoc', CanvaDocSchema);

