const jwt = require('jsonwebtoken');
const User = require('../models/User');
const connectDB = require('../database/database');
const ensureConnection = connectDB.ensureConnection || (async () => {});
require('dotenv').config();

const userCtrl = {};

userCtrl.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Asegurar que la conexión a MongoDB esté lista antes de hacer queries
    // Esto previene el error "Operation buffering" en entornos serverless (Vercel)
    await ensureConnection();
    
    console.log(email)
    const userFound = await User.findOne({ email });
    console.log(userFound)
    const allUsers = await User.find();
    console.log('Todos los usuarios:', allUsers);

    if (!userFound || userFound.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const payload = {
      id: userFound._id,
      name: userFound.name,
      email: userFound.email,
      role: userFound.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: userFound._id,
        name: userFound.name,
        email: userFound.email,
        role: userFound.role
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

userCtrl.logout = async (req, res) => {
  try {
    // En APIs con JWT, no se "destruye" el token en el servidor.
    // Se espera que el cliente lo elimine de su almacenamiento local.
    res.status(200).json({
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};

module.exports = userCtrl;
