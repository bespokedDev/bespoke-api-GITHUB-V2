// models/PenalizationRegistry.js
const mongoose = require('mongoose');

/**
 * Modelo para registros de penalizaciones aplicadas
 * Este modelo almacena las penalizaciones reales que se aplican a enrollments, estudiantes o profesores
 * La colección se llama 'penalization-registry'
 */
const PenalizationRegistrySchema = new mongoose.Schema({
    idPenalizacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Penalizacion',
        required: false,
        default: null
        // ID del tipo de penalización (referencia a la colección Penalizacion)
        // Indica qué tipo de penalización se está aplicando (opcional)
    },
    idpenalizationLevel: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        default: null
        // ID del elemento específico dentro del array penalizationLevels del documento Penalizacion referenciado por idPenalizacion
        // Este ObjectId corresponde al _id de un elemento dentro del array penalizationLevels del modelo Penalizacion
        // Permite identificar exactamente qué nivel y tipo de penalización se aplicó dentro del tipo de penalización
        // Ejemplo: Si idPenalizacion referencia a "Contacto privado no autorizado", idpenalizationLevel puede referenciar
        // al _id del elemento "Llamado de Atención - nivel 1" dentro del array penalizationLevels de ese documento
        // Es opcional porque algunos tipos de penalización no tienen penalizationLevels definidos
    },
    // Referencias a las entidades que pueden recibir penalizaciones
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        default: null
        // ID del enrollment (para penalizaciones relacionadas con enrollments)
    },
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        default: null
        // ID del profesor (para penalizaciones aplicadas a profesores)
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null
        // ID del estudiante (para penalizaciones aplicadas a estudiantes)
    },
    // Detalles específicos de la penalización aplicada
    penalization_description: {
        type: String,
        trim: true,
        required: true
        // Descripción detallada de la penalización aplicada (REQUERIDO)
        // Ejemplo: "Penalización por vencimiento de días de pago. Enrollment vencido el 2024-01-15"
    },
    penalizationMoney: {
        type: Number,
        default: null,
        min: 0
        // Monto de dinero de la penalización aplicada
    },
    lateFee: {
        type: Number,
        default: null,
        min: 0
        // Número de días de lateFee aplicados
    },
    endDate: {
        type: Date,
        default: null
        // Fecha de fin relacionada con la penalización (ej: fecha de vencimiento del enrollment)
    },
    support_file: {
        type: String,
        trim: true,
        default: null
        // Archivo de soporte o evidencia relacionado con la penalización aplicada
        // Puede ser una URL, ruta de archivo, o identificador del archivo
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
        // ID del usuario administrador (referencia a la colección User) - opcional, para penalizaciones dirigidas a administradores
    },
    payOutId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payout',
        default: null
        // ID del payout (referencia a la colección Payout) - opcional, para enlace administrativo cuando se debe hacer el pago
    },
    status: {
        type: Number,
        enum: [0, 1, 2],
        default: 1
        // Estado del registro de penalización
        // 0 = Inactiva / cancelada (no considerar en cálculos ni vistas principales)
        // 1 = Activa (pendiente de aplicar / cobrar)
        // 2 = Pagada / aplicada (dinero ya consolidado para Bespoke)
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Índice compuesto para búsquedas eficientes por enrollment
PenalizationRegistrySchema.index({ enrollmentId: 1 });

// Índice compuesto para búsquedas eficientes por profesor
PenalizationRegistrySchema.index({ professorId: 1 });

// Índice compuesto para búsquedas eficientes por estudiante
PenalizationRegistrySchema.index({ studentId: 1 });

// Índice compuesto para búsquedas por tipo de penalización
PenalizationRegistrySchema.index({ idPenalizacion: 1 });

// Índice compuesto para búsquedas eficientes por usuario administrador
PenalizationRegistrySchema.index({ userId: 1 });

// Exporta el modelo. El nombre del modelo es 'PenalizationRegistry' y la colección es 'penalization-registry'.
module.exports = mongoose.model('PenalizationRegistry', PenalizationRegistrySchema, 'penalization-registry');

