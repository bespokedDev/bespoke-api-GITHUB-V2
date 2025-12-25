const mongoose = require('mongoose');

// Esquema principal de Notification
const NotificationSchema = new mongoose.Schema({
    idCategoryNotification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryNotification',
        required: true
        // ID de la categoría de notificación (referencia a la colección CategoryNotification)
    },
    notification_description: {
        type: String,
        required: true,
        trim: true
        // Descripción de la notificación
    },
    idPenalization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Penalizacion',
        default: null
        // ID de penalización (referencia a la colección Penalizacion) - opcional, por si la notificación es de una penalización
    },
    idEnrollment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        default: null
        // ID de enrollment (referencia a la colección Enrollment) - opcional, por si la notificación es de un enrollment directo
    },
    idProfessor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        default: null
        // ID del profesor (referencia a la colección Professor) - opcional, por si la notificación viene de un profesor
    },
    idStudent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
        // Array de IDs de estudiantes (referencia a la colección Student) - opcional, por si la notificación viene de uno o más estudiantes
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
        // ID del usuario administrador (referencia a la colección User) - opcional, para notificaciones dirigidas a administradores
    },
    isActive: {
        type: Boolean,
        default: true
        // Para activar/desactivar lógicamente la notificación
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo
module.exports = mongoose.model('notifications', NotificationSchema);

