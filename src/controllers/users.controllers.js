const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Professor = require('../models/Professor');
const Student = require('../models/Student');
const Role = require('../models/Role');
const connectDB = require('../database/database');
const ensureConnection = connectDB.ensureConnection || (async () => {});
require('dotenv').config();

const userCtrl = {};

/**
 * @route POST /api/users/login
 * @description Login inteligente que busca en User (admin), Professor y Student
 * @access Public
 */
userCtrl.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Asegurar que la conexión a MongoDB esté lista antes de hacer queries
    await ensureConnection();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    let userFound = null;
    let userType = null;
    let roleName = null;

    // 1. Buscar en User (admin) primero
    userFound = await User.findOne({ email }).populate('idRol', 'name');
    if (userFound) {
      if (userFound.password === password) {
        userType = 'admin';
        roleName = userFound.idRol ? userFound.idRol.name : 'admin';
      } else {
        // Contraseña incorrecta, no buscar en otras colecciones
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
    }

    // 2. Si no se encuentra en User, buscar en Professor
    if (!userFound) {
      userFound = await Professor.findOne({ email }).populate('idRol', 'name');
      if (userFound) {
        if (userFound.password === password) {
          userType = 'professor';
          roleName = userFound.idRol ? userFound.idRol.name : 'professor';
        } else {
          // Contraseña incorrecta, no buscar en Student
          return res.status(401).json({ message: 'Credenciales inválidas' });
        }
      }
    }

    // 3. Si no se encuentra en User ni Professor, buscar en Student
    if (!userFound) {
      userFound = await Student.findOne({ email }).populate('idRol', 'name');
      if (userFound) {
        if (userFound.password === password) {
          userType = 'student';
          roleName = userFound.idRol ? userFound.idRol.name : 'student';
        } else {
          // Contraseña incorrecta
          return res.status(401).json({ message: 'Credenciales inválidas' });
        }
      }
    }

    // 4. Si no se encuentra en ninguna colección
    if (!userFound) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 5. Preparar payload para el token
    const payload = {
      id: userFound._id,
      name: userFound.name,
      email: userFound.email,
      role: roleName,
      userType: userType, // 'admin', 'professor', 'student' - útil para saber en qué colección está
      idRol: userFound.idRol ? userFound.idRol._id.toString() : null
    };

    // 6. Generar token JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    // 7. Preparar respuesta
    const userResponse = {
      id: userFound._id,
      name: userFound.name,
      email: userFound.email,
      role: roleName,
      idRol: userFound.idRol ? userFound.idRol._id : null
    };

    // Agregar campos específicos según el tipo de usuario
    if (userType === 'professor') {
      userResponse.ciNumber = userFound.ciNumber;
      userResponse.phone = userFound.phone;
    } else if (userType === 'student') {
      userResponse.studentCode = userFound.studentCode;
      userResponse.phone = userFound.phone;
    }

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
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
