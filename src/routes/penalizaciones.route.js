// routes/penalizaciones.route.js
const express = require('express');
const router = express.Router();
const penalizacionCtrl = require('../controllers/penalizaciones.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/penalties - Crea una nueva penalización
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), penalizacionCtrl.create);

// GET /api/penalties - Lista todas las penalizaciones
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), penalizacionCtrl.list);

// GET /api/penalties/:id - Obtiene una penalización por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin', 'admin-jr'), penalizacionCtrl.getById);

// PUT /api/penalties/:id - Actualiza los datos de una penalización por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr'), penalizacionCtrl.update);

// PATCH /api/penalties/:id/activate - Activa una penalización
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), penalizacionCtrl.activate);

// PATCH /api/penalties/:id/anular - Anula una penalización
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'admin-jr'), penalizacionCtrl.anular);

module.exports = router;

