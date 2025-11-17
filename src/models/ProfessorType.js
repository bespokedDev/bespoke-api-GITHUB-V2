// models/ProfessorType.js
const mongoose = require('mongoose');

// Esquema para las tarifas (rates)
const RatesSchema = new mongoose.Schema({
    single: {
        type: Number,
        required: true,
        min: 0
    },
    couple: {
        type: Number,
        required: true,
        min: 0
    },
    group: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false }); // No necesitamos un _id para este subdocumento

const ProfessorTypeSchema = new mongoose.Schema({
    rates: { // ¡CAMPO 'rates' definido como RatesSchema!
        single: {
            type: Number,
            min: 0
        },
        couple: {
            type: Number,
            min: 0
        },
        group: {
            type: Number,
            min: 0
        }
    }
}, {
    timestamps: true // Añade createdAt y updatedAt
});


module.exports = mongoose.model('ProfessorTypes', ProfessorTypeSchema, 'ProfessorType');
//  ^                       ^                     ^
//  Este debe ser el nombre del modelo.      Este debe ser el nombre exacto de la colección en tu DB.