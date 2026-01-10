const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

/**
 * @route PATCH /api/users/:id/change-password
 * @description Cambia la contraseña de un usuario (admin)
 * @access Private (Requiere JWT) - Solo el mismo usuario o admin
 */
userCtrl.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; // ID del usuario autenticado desde el token
    const userRole = req.user?.role; // Rol del usuario desde el token

    // Validar que el ID del usuario sea válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de usuario inválido.' });
    }

    // Validar que se proporcionen los campos requeridos
    if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
      return res.status(400).json({ 
        message: 'El campo currentPassword es requerido y debe ser un string no vacío.' 
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return res.status(400).json({ 
        message: 'El campo newPassword es requerido y debe ser un string no vacío.' 
      });
    }

    // Verificar que el usuario existe
    const user = await User.findById(id).populate('idRol', 'name');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Validar que el usuario autenticado tenga permisos
    // Solo el mismo usuario o un admin pueden cambiar la contraseña
    const isOwner = userId && userId.toString() === id.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        message: 'No tienes permisos para cambiar la contraseña de este usuario.' 
      });
    }

    // Validar que el usuario tenga una contraseña actual
    if (!user.password || user.password.trim() === '') {
      return res.status(400).json({ 
        message: 'El usuario no tiene una contraseña registrada. Contacta a un administrador.' 
      });
    }

    // Validar que la contraseña actual sea correcta (comparación directa porque está en texto plano)
    if (user.password.trim() !== currentPassword.trim()) {
      return res.status(401).json({ 
        message: 'La contraseña actual es incorrecta.' 
      });
    }

    // Validar que la nueva contraseña no sea igual a la actual
    if (currentPassword.trim() === newPassword.trim()) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe ser diferente a la contraseña actual.' 
      });
    }

    // Validar criterios de seguridad para la nueva contraseña
    const passwordValidation = validatePasswordSecurity(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: passwordValidation.message,
        requirements: passwordValidation.requirements
      });
    }

    // Actualizar la contraseña
    user.password = newPassword.trim();
    await user.save();

    // Popular el idRol en la respuesta
    const populatedUser = await User.findById(user._id)
      .populate('idRol', 'name')
      .lean();

    res.status(200).json({
      message: 'Contraseña cambiada exitosamente',
      user: {
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        idRol: populatedUser.idRol ? {
          _id: populatedUser.idRol._id,
          name: populatedUser.idRol.name
        } : null,
        updatedAt: populatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al cambiar contraseña del usuario:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID de usuario inválido.' });
    }
    res.status(500).json({ 
      message: 'Error interno al cambiar la contraseña', 
      error: error.message 
    });
  }
};

/**
 * Función helper para validar criterios de seguridad del password
 * @param {string} password - Password a validar
 * @returns {Object} - Objeto con isValid (boolean) y message (string) y requirements (object)
 */
const validatePasswordSecurity = (password) => {
  const requirements = {
    minLength: 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const errors = [];

  // Validar longitud mínima
  if (password.length < requirements.minLength) {
    errors.push(`La contraseña debe tener al menos ${requirements.minLength} caracteres.`);
  }

  // Validar que tenga al menos una letra mayúscula
  if (!requirements.hasUpperCase) {
    errors.push('La contraseña debe contener al menos una letra mayúscula.');
  }

  // Validar que tenga al menos una letra minúscula
  if (!requirements.hasLowerCase) {
    errors.push('La contraseña debe contener al menos una letra minúscula.');
  }

  // Validar que tenga al menos un número
  if (!requirements.hasNumber) {
    errors.push('La contraseña debe contener al menos un número.');
  }

  // Validar que tenga al menos un carácter especial
  if (!requirements.hasSpecialChar) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?).');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: 'La contraseña no cumple con los criterios de seguridad requeridos.',
      requirements: {
        minLength: requirements.minLength,
        hasUpperCase: requirements.hasUpperCase,
        hasLowerCase: requirements.hasLowerCase,
        hasNumber: requirements.hasNumber,
        hasSpecialChar: requirements.hasSpecialChar,
        errors: errors
      }
    };
  }

  return {
    isValid: true,
    message: 'La contraseña cumple con todos los criterios de seguridad.',
    requirements: {
      minLength: requirements.minLength,
      hasUpperCase: requirements.hasUpperCase,
      hasLowerCase: requirements.hasLowerCase,
      hasNumber: requirements.hasNumber,
      hasSpecialChar: requirements.hasSpecialChar
    }
  };
};

module.exports = userCtrl;
