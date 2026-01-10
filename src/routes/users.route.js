const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/users.controllers');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas públicas (no requieren autenticación)
router.post('/login', userCtrl.login);
router.post('/logout', userCtrl.logout);

// Rutas protegidas con JWT y validación de roles

// PATCH /api/users/:id/change-password - Cambia la contraseña de un usuario (admin)
// Acceso: Admin y el mismo usuario (se valida dentro del controlador)
router.patch('/:id/change-password', verifyToken, verifyRole('admin', 'admin-jr'), userCtrl.changePassword);

module.exports = router;