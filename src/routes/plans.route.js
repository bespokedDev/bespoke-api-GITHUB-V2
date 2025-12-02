// routes/plans.route.js
const express = require('express');
const router = express.Router();
const planCtrl = require('../controllers/plans.controllers'); // Importa el controlador de planes
const verifyToken = require('../middlewares/verifyToken'); // Importa tu middleware de verificación de token
const verifyRole = require('../middlewares/verifyRole'); // Importa el middleware de verificación de roles

// Rutas protegidas con JWT y validación de roles

// POST /api/plans - Crea un nuevo plan
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), planCtrl.create);

// GET /api/plans - Lista todos los planes
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), planCtrl.list);

// GET /api/plans/:id - Obtiene un plan por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin'), planCtrl.getById);

// PUT /api/plans/:id - Actualiza un plan por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), planCtrl.update);

// PATCH /api/plans/:id/deactivate - Desactiva un plan
// Acceso: Solo admin
router.patch('/:id/deactivate', verifyToken, verifyRole('admin'), planCtrl.deactivate);

// PATCH /api/plans/:id/activate - Activa un plan
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), planCtrl.activate);

module.exports = router;