// models/ConversationalAttendance.js
const mongoose = require('mongoose');

const ConversationalAttendanceSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
        // Descripción del conversational attendance
    },
    idEnrollment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true
        // ID del enrollment asociado (referencia a la colección Enrollment)
    },
    status: {
        type: Number,
        enum: [1, 2], // 1 = activo, 2 = anulado
        default: 1
        // Estado del conversational attendance:
        // 1 = Activo (por defecto)
        // 2 = Anulado
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo, especificando el nombre de la colección 'conversational_attendance'
module.exports = mongoose.model('ConversationalAttendance', ConversationalAttendanceSchema, 'conversational_attendance');
