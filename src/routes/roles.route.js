// routes/roles.route.js
const express = require('express');
const router = express.Router();
const roleCtrl = require('../controllers/roles.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/roles - Crea un nuevo rol (solo admin)
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), roleCtrl.create);

// GET /api/roles - Lista todos los roles (solo admin)
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), roleCtrl.list);

// GET /api/roles/:id - Obtiene un rol por su ID (solo admin)
router.get('/:id', verifyToken, verifyRole('admin', 'admin-jr'), roleCtrl.getById);

module.exports = router;

