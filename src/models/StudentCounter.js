const mongoose = require('mongoose');

const StudentCounterSchema = new mongoose.Schema({
    currentNumber: {
        type: Number,
        required: true,
        default: 1
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Asegurar que solo haya un documento en esta colección
StudentCounterSchema.index({}, { unique: true });

module.exports = mongoose.model('student_counter', StudentCounterSchema, 'student_counter');
