const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
    // contraseña del usuario (debe ser hasheada antes de guardar)
  },
  idRol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
    // ID del rol (referencia a la colección roles)
    // Para admin, debe referenciar el rol con name: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Añade automáticamente updatedAt también
});

module.exports = mongoose.model('User', userSchema);