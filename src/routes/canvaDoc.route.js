// routes/canvaDoc.route.js
const express = require('express');
const router = express.Router();
const canvaDocCtrl = require('../controllers/canvaDoc.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/canva-docs - Crea un nuevo documento Canva
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), canvaDocCtrl.create);

// GET /api/canva-docs - Lista todos los documentos Canva
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), canvaDocCtrl.list);

// GET /api/canva-docs/:id - Obtiene un documento Canva por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin'), canvaDocCtrl.getById);

// PUT /api/canva-docs/:id - Actualiza un documento Canva por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), canvaDocCtrl.update);

// PATCH /api/canva-docs/:id/anular - Anula un documento Canva
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin'), canvaDocCtrl.anular);

// PATCH /api/canva-docs/:id/activate - Activa un documento Canva
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), canvaDocCtrl.activate);

module.exports = router;

