// models/EnrollmentCycleHistory.js
const mongoose = require('mongoose');

/**
 * Historial de ciclos de un enrollment (creación o renovación).
 * Cada registro representa un periodo startDate–endDate con su pricePerHour calculado,
 * para que reportes y cálculos usen el valor correcto por ciclo (ej. clases de un mes
 * que pertenecen a un ciclo ya vencido).
 */
const EnrollmentCycleHistorySchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true
        // ID del enrollment al que pertenece este ciclo
    },
    startDate: {
        type: Date,
        required: true
        // Inicio del ciclo (coincide con el startDate del enrollment en ese periodo)
    },
    endDate: {
        type: Date,
        required: true
        // Fin del ciclo (coincide con el endDate del enrollment en ese periodo)
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
        // totalAmount del enrollment en este ciclo (para referencia)
    },
    monthlyClasses: {
        type: Number,
        required: true,
        min: 0
        // Número de clases del ciclo (monthlyClasses en ese periodo)
    },
    pricePerHour: {
        type: Number,
        required: true,
        min: 0
        // totalAmount / monthlyClasses; valor por clase en este ciclo
    },
    balanceRemaining: {
        type: Number,
        default: null,
        min: 0
        // Dinero que le quedaba al estudiante de este ciclo (actualizado a fin de mes o al cierre del ciclo). Usado en reporte contable.
    }
}, {
    timestamps: true
});

// Índice para consultas por enrollment y por rango de fechas
EnrollmentCycleHistorySchema.index({ enrollmentId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('EnrollmentCycleHistory', EnrollmentCycleHistorySchema, 'enrollment_cycle_histories');
