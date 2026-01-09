// routes/canvaDoc.route.js
const express = require('express');
const router = express.Router();
const canvaDocCtrl = require('../controllers/canvaDoc.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/canva-docs - Crea un nuevo documento Canva
// Acceso: Admin y profesor
router.post('/', verifyToken, verifyRole('admin', 'professor'), canvaDocCtrl.create);

// GET /api/canva-docs - Lista todos los documentos Canva
// Acceso: Admin, profesor y estudiante
router.get('/', verifyToken, verifyRole('admin', 'professor', 'student'), canvaDocCtrl.list);

// GET /api/canva-docs/:id - Obtiene un documento Canva por su ID
// Acceso: Admin, profesor y estudiante
router.get('/:id', verifyToken, verifyRole('admin', 'professor', 'student'), canvaDocCtrl.getById);

// PUT /api/canva-docs/:id - Actualiza un documento Canva por su ID
// Acceso: Admin y profesor
router.put('/:id', verifyToken, verifyRole('admin', 'professor'), canvaDocCtrl.update);

// PATCH /api/canva-docs/:id/anular - Anula un documento Canva
// Acceso: Admin y profesor
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'professor'), canvaDocCtrl.anular);

// PATCH /api/canva-docs/:id/activate - Activa un documento Canva
// Acceso: Admin y profesor
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'professor'), canvaDocCtrl.activate);

module.exports = router;

