const mongoose = require('mongoose');

// Esquema para las notas del estudiante
const NoteSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: true }); // Mongoose añade _id por defecto a los subdocumentos, pero lo explicitamos

// Esquema principal del estudiante
const StudentSchema = new mongoose.Schema({
    studentCode: {
        type: String,
        required: true,
        unique: true, // El código de estudiante debe ser único
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    dob: { // Date of Birth (Fecha de Nacimiento)
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'], // Masculino, Femenino, Otro
        required: true
    },
    representativeName: { // Nombre del representante (puede ser nulo)
        type: String,
        trim: true,
        default: null
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true, // El email debe ser único
        sparse: true, // Permite múltiples documentos con 'null' en este campo, pero únicos para valores no nulos
        default: null
    },
    password: {
        type: String,
        trim: true,
        default: null
        // contraseña del estudiante (debe ser hasheada antes de guardar)
    },
    idRol: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
        // ID del rol (referencia a la colección roles)
        // Para student, debe referenciar el rol con name: 'student'
    },
    phone: {
        type: String,
        trim: true,
        required: true
    },
    address: {
        type: String,
        trim: true,
        default: null
    },
    city: {
        type: String,
        trim: true,
        default: null
    },
    country: {
        type: String,
        trim: true,
        default: null
    },
    occupation: {
        type: String,
        trim: true,
        default: null
    },
    status: { // Estado actual del estudiante (e.g., 'Activo', 'Inactivo', 'Retirado')
        type: Number,
        enum: [1, 0], //1 para activo, 0 para inactivo
        default: 1
    },
    kid: { // Tipo de cuenta de estudiante
        type: Number,
        enum: [0, 1], // 0 = cuenta de estudiante normal, 1 = cuenta de kid
        required: true
        // Campo obligatorio que indica si es una cuenta de estudiante normal (0) o de kid (1)
    },
    dislike: {
        type: String,
        trim: true,
        default: null
        // cosas que no le gustan
    },
    learningStyle: {
        type: String,
        trim: true,
        default: null
        // tipo de aprendizaje
    },
    academicPerformance: {
        type: String,
        trim: true,
        default: null
        // como son sus calificaciones y su desenvolvimiento académico
    },
    rutinePriorBespoke: {
        type: String,
        trim: true,
        default: null
        // cual su rutina antes de las clases en la plataforma
    },
    specialAssitance: {
        type: Number,
        enum: [0, 1, 2],
        default: null
        // representante durante clase: 1 = si, 0 = no, 2 = a veces
    },
    helpWithElectronicClassroom: {
        type: Number,
        enum: [0, 1],
        default: null
        // necesita ayuda durante la clase para usar la conexión: 1 = si, 0 = no
    },
    avatar: {
        type: String,
        default: null
        // será un string para guardar la versión en base64 del avatar del estudiante en el registro
    },
    avatarPermission: {
        type: Number,
        enum: [0, 1],
        default: null
        // status 0 para no, 1 para si
    },
    notes: [NoteSchema], // Array de subdocumentos de notas
    disenrollmentReason: { // Razón de desinscripción (si aplica)
        type: String,
        trim: true,
        default: null
    },
    isActive: { // Para activar/desactivar lógicamente el estudiante
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo
module.exports = mongoose.model('Student', StudentSchema);