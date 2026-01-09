const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/users.controllers');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST / - Login (si esta ruta se usa)
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), userCtrl.login);

module.exports = router;