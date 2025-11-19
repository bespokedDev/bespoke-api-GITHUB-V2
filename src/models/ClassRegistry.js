// models/ClassRegistry.js
const mongoose = require('mongoose');

const ClassRegistrySchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true
    },
    classDate: {
        type: Date,
        required: true
        // fecha de clase
    },
    hoursViewed: {
        type: Number,
        default: null
        // tiempo visto en horas
    },
    minutesViewed: {
        type: Number,
        default: null
        // tiempo visto en minutos
    },
    classType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassType',
        default: null
        // Tipo de clase
    },
    contentType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContentClass',
        default: null
        // Tipo de contenido
    },
    studentMood: {
        type: String,
        trim: true,
        default: null
        // Student Mood
    },
    note: {
        type: String,
        trim: true,
        default: null
        // Nota
    },
    homework: {
        type: String,
        trim: true,
        default: null
        // tarea
    },
    token: {
        type: String,
        trim: true,
        default: null
        // token
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo. El nombre del modelo es 'ClassRegistry' y la colección es 'class-registry'.
module.exports = mongoose.model('ClassRegistry', ClassRegistrySchema, 'class-registry');

