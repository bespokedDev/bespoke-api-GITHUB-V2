// middlewares/verifyRole.js
/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 * @param {Array<String>} allowedRoles - Array de roles permitidos (ej: ['admin', 'professor'])
 */
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    // El rol debe estar en req.user.role (viene del verifyToken)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        message: 'Acceso denegado: Rol no encontrado en el token' 
      });
    }

    const userRole = req.user.role;

    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Acceso denegado: Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
      });
    }

    // Si el rol es válido, continuar
    next();
  };
};

module.exports = verifyRole;

