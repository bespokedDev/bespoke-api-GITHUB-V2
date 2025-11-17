// tests/helpers/authHelper.js
// Helper para generar tokens JWT de prueba
const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT válido para usar en las pruebas
 * @param {Object} payload - Datos del usuario (opcional)
 * @returns {string} Token JWT
 */
const generateTestToken = (payload = {}) => {
  const defaultPayload = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'admin',
    ...payload
  };

  return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test-secret-key-for-jwt', {
    expiresIn: '1h'
  });
};

/**
 * Retorna un header de autorización con token válido
 * @param {Object} payload - Datos del usuario (opcional)
 * @returns {Object} Header de autorización
 */
const getAuthHeader = (payload = {}) => {
  const token = generateTestToken(payload);
  return {
    Authorization: `Bearer ${token}`
  };
};

module.exports = {
  generateTestToken,
  getAuthHeader
};

