const mongoose = require('mongoose');

// Esquema principal de CategoryNotification
const CategoryNotificationSchema = new mongoose.Schema({
    category_notification_description: {
        type: String,
        required: true,
        trim: true
        // Descripción de la categoría de notificación (administrativa, penalización, etc.)
    },
    isActive: {
        type: Boolean,
        default: true
        // Para activar/desactivar lógicamente la categoría de notificación
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo
module.exports = mongoose.model('CategoryNotification', CategoryNotificationSchema);

