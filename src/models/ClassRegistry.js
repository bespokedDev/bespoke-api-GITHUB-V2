// models/ClassRegistry.js
const mongoose = require('mongoose');

const ClassRegistrySchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true
    },
    classDate: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/
        // fecha de clase en formato YYYY-MM-DD (solo año, mes y día - no editable)
    },
    classTime: {
        type: String,
        default: null,
        trim: true
        // hora de la clase (formato HH:mm, editable por el profesor)
        // null por defecto al crear el enrollment, el profesor debe asignarla manualmente
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
    classType: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassType',
        default: []
        // Array de tipos de clase (referencia a la colección tipo_de_clase)
    }],
    contentType: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContentClass',
        default: []
        // Array de tipos de contenido (referencia a la colección content-class)
    }],
    studentMood: {
        type: String,
        trim: true,
        default: null
        // Student Mood
    },
    note: {
        type: {
            content: {
                type: String,
                trim: true,
                default: null
                // Contenido de la nota
            },
            visible: {
                admin: {
                    type: Number,
                    enum: [0, 1],
                    default: 1
                    // 1 = visible para admin, 0 = no visible
                },
                student: {
                    type: Number,
                    enum: [0, 1],
                    default: 0
                    // 1 = visible para estudiante, 0 = no visible
                },
                professor: {
                    type: Number,
                    enum: [0, 1],
                    default: 1
                    // 1 = visible para profesor, 0 = no visible
                }
            }
        },
        default: null
        // Nota con control de visibilidad por rol
        // null por defecto, o objeto con content y visible
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
    },
    reschedule: {
        type: Number,
        enum: [0, 1, 2],
        default: 0
        // Estado de reschedule de la clase
        // 0 = No es una clase en reschedule (por defecto al crear el enrollment)
        // 1 = La clase está en modo reschedule
        // 2 = La clase en reschedule ya se vio
    },
    originalClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassRegistry',
        default: null
        // ID de la clase original cuando esta clase es un reschedule (reschedule = 1 o 2)
        // null para clases normales (reschedule = 0)
        // Contiene el _id de la clase original que se reprogramó
    },
    classViewed: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0
        // Estado de visualización de la clase
        // 0 = Clase no vista (por defecto al crear el enrollment)
        // 1 = Clase vista
        // 2 = Clase parcialmente vista
        // 3 = Clase no show
    },
    minutesClassDefault: {
        type: Number,
        default: 60
        // Duración por defecto de la clase en minutos
        // Valor por defecto: 60 minutos (1 hora)
    },
    vocabularyContent: {
        type: String,
        trim: true,
        default: null
        // Contenido de vocabulario de la clase
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo. El nombre del modelo es 'ClassRegistry' y la colección es 'class-registry'.
module.exports = mongoose.model('ClassRegistry', ClassRegistrySchema, 'class-registry');

