// models/Role.js
const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        enum: ['admin', 'professor', 'student']
        // Nombre del rol (admin, professor, student)
    },
    description: {
        type: String,
        trim: true,
        default: null
        // Descripción del rol (opcional, para metadatos futuros)
    },
    permissions: {
        type: [String],
        default: []
        // Array de permisos granulares (para uso futuro)
        // Ejemplo: ['read:enrollments', 'write:classes', 'delete:students']
    },
    isActive: {
        type: Boolean,
        default: true
        // Para activar/desactivar roles
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Índice para búsquedas rápidas por nombre
RoleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', RoleSchema, 'roles');

