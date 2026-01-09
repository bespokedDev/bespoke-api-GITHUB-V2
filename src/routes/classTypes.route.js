// routes/classTypes.route.js
const express = require('express');
const router = express.Router();
const classTypeCtrl = require('../controllers/classTypes.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/class-types - Crea un nuevo tipo de clase
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), classTypeCtrl.create);

// GET /api/class-types - Lista todos los tipos de clase
// Acceso: Admin y profesor
router.get('/', verifyToken, verifyRole('admin', 'professor', 'admin-jr'), classTypeCtrl.list);

// GET /api/class-types/:id - Obtiene un tipo de clase por su ID
// Acceso: Admin y profesor
router.get('/:id', verifyToken, verifyRole('admin', 'professor', 'admin-jr'), classTypeCtrl.getById);

// PUT /api/class-types/:id - Actualiza los datos de un tipo de clase por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr'), classTypeCtrl.update);

// PATCH /api/class-types/:id/activate - Activa un tipo de clase
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), classTypeCtrl.activate);

// PATCH /api/class-types/:id/anular - Anula un tipo de clase
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'admin-jr'), classTypeCtrl.anular);

module.exports = router;

