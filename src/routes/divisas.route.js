// routes/divisas.route.js
const express = require('express');
const router = express.Router();
const divisaCtrl = require('../controllers/divisas.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/divisas - Crea una nueva divisa
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), divisaCtrl.create);

// GET /api/divisas - Lista todas las divisas
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), divisaCtrl.list);

// GET /api/divisas/:id - Obtiene una divisa por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin'), divisaCtrl.getById);

// PUT /api/divisas/:id - Actualiza una divisa por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), divisaCtrl.update);

// DELETE /api/divisas/:id - Elimina una divisa por su ID
// Acceso: Solo admin
router.delete('/:id', verifyToken, verifyRole('admin'), divisaCtrl.remove);

module.exports = router;