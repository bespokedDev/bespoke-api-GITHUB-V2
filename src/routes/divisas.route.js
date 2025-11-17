// routes/divisas.route.js
const express = require('express');
const router = express.Router();
const divisaCtrl = require('../controllers/divisas.controller');
const verifyToken = require('../middlewares/verifyToken'); // Asumo que tienes este middleware de autenticación

// Rutas protegidas con JWT

// POST /api/divisas - Crea una nueva divisa
router.post('/', verifyToken, divisaCtrl.create);

// GET /api/divisas - Lista todas las divisas
router.get('/', verifyToken, divisaCtrl.list);

// GET /api/divisas/:id - Obtiene una divisa por su ID
router.get('/:id', verifyToken, divisaCtrl.getById);

// PUT /api/divisas/:id - Actualiza una divisa por su ID
router.put('/:id', verifyToken, divisaCtrl.update);

// DELETE /api/divisas/:id - Elimina una divisa por su ID
router.delete('/:id', verifyToken, divisaCtrl.remove);

module.exports = router;