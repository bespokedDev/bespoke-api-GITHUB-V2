// src/models/Income.js
const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
    income_date: {
        type: Date
    },
    deposit_name: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        min: 0
    },
    amountInDollars:{
        type: Number
    },
    tasa:{
        type: Number
    },
    idDivisa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Divisa',
    },
    idProfessor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
    },
    note: {
        type: String,
        trim: true,
        default: null
    },
    idPaymentMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
    },
    /*idStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },*/
    idEnrollment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: false, // <--- ¡Asegúrate de que sea `false`!
        default: null    // Opcional: para que se guarde explícitamente como null si no se envía
    }
}, {
    timestamps: true // Esto ya te da createdAt y updatedAt, pero income_date es específico del ingreso
});

module.exports = mongoose.model('Income', IncomeSchema);


