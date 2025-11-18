// routes/penalizaciones.route.js
const express = require('express');
const router = express.Router();
const penalizacionCtrl = require('../controllers/penalizaciones.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// POST /api/penalties - Crea una nueva penalización
router.post('/', verifyToken, penalizacionCtrl.create);

// GET /api/penalties - Lista todas las penalizaciones
router.get('/', verifyToken, penalizacionCtrl.list);

// GET /api/penalties/:id - Obtiene una penalización por su ID
router.get('/:id', verifyToken, penalizacionCtrl.getById);

// PUT /api/penalties/:id - Actualiza los datos de una penalización por su ID
router.put('/:id', verifyToken, penalizacionCtrl.update);

// PATCH /api/penalties/:id/activate - Activa una penalización
router.patch('/:id/activate', verifyToken, penalizacionCtrl.activate);

// PATCH /api/penalties/:id/anular - Anula una penalización
router.patch('/:id/anular', verifyToken, penalizacionCtrl.anular);

module.exports = router;

