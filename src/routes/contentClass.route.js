// routes/contentClass.route.js
const express = require('express');
const router = express.Router();
const contentClassCtrl = require('../controllers/contentClass.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/content-class - Crea un nuevo contenido de clase
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), contentClassCtrl.create);

// GET /api/content-class - Lista todos los contenidos de clase
// Acceso: Admin y profesor
router.get('/', verifyToken, verifyRole('admin', 'professor'), contentClassCtrl.list);

// GET /api/content-class/:id - Obtiene un contenido de clase por su ID
// Acceso: Admin y profesor
router.get('/:id', verifyToken, verifyRole('admin', 'professor'), contentClassCtrl.getById);

// PUT /api/content-class/:id - Actualiza los datos de un contenido de clase por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), contentClassCtrl.update);

// PATCH /api/content-class/:id/activate - Activa un contenido de clase
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), contentClassCtrl.activate);

// PATCH /api/content-class/:id/anular - Anula un contenido de clase
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin'), contentClassCtrl.anular);

module.exports = router;

