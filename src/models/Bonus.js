const mongoose = require('mongoose');

const BonusSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0 // Un abono no debería ser negativo
    },
    reason: {
        type: String,
        trim: true,
        default: null // La razón puede ser opcional
    },
    idPayout: { // Referencia al pago al que se asocia este abono (si aplica)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payout', // Asumiendo que tienes un modelo llamado 'Payout' para los pagos
        required: false, // Un abono podría existir independientemente de un pago específico
        default: null
    },
    idProfessor: { // Referencia al profesor al que se le otorga este abono
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor', // Referencia a tu modelo de Profesor
        required: true // Un abono siempre debe estar asociado a un profesor
    }
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportar el modelo
module.exports = mongoose.model('Bonus', BonusSchema, 'bonuses');