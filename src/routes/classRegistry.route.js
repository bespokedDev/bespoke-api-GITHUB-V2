// routes/classRegistry.route.js
const express = require('express');
const router = express.Router();
const classRegistryCtrl = require('../controllers/classRegistry.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// GET /api/class-registry - Lista todos los registros de clase (con información básica)
router.get('/', verifyToken, classRegistryCtrl.list);

// POST /api/class-registry/:id/reschedule - Crea una nueva clase de tipo reschedule
router.post('/:id/reschedule', verifyToken, classRegistryCtrl.createReschedule);

// GET /api/class-registry/:id - Obtiene un registro de clase por su ID (con detalle completo)
router.get('/:id', verifyToken, classRegistryCtrl.getById);

// PUT /api/class-registry/:id - Actualiza los datos de un registro de clase
router.put('/:id', verifyToken, classRegistryCtrl.update);

module.exports = router;

