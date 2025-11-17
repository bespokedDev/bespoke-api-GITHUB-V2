// routes/plans.route.js
const express = require('express');
const router = express.Router();
const planCtrl = require('../controllers/plans.controllers'); // Importa el controlador de planes
const verifyToken = require('../middlewares/verifyToken'); // Importa tu middleware de verificación de token

// Rutas protegidas con JWT

// POST /api/plans - Crea un nuevo plan
router.post('/', verifyToken, planCtrl.create);

// GET /api/plans - Lista todos los planes
router.get('/', verifyToken, planCtrl.list);

// GET /api/plans/:id - Obtiene un plan por su ID
router.get('/:id', verifyToken, planCtrl.getById);

// PUT /api/plans/:id - Actualiza un plan por su ID
router.put('/:id', verifyToken, planCtrl.update);

// PATCH /api/plans/:id/deactivate - Desactiva un plan
router.patch('/:id/deactivate', verifyToken, planCtrl.deactivate);

// PATCH /api/plans/:id/activate - Activa un plan
router.patch('/:id/activate', verifyToken, planCtrl.activate);

module.exports = router;