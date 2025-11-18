// routes/contentClass.route.js
const express = require('express');
const router = express.Router();
const contentClassCtrl = require('../controllers/contentClass.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// POST /api/content-class - Crea un nuevo contenido de clase
router.post('/', verifyToken, contentClassCtrl.create);

// GET /api/content-class - Lista todos los contenidos de clase
router.get('/', verifyToken, contentClassCtrl.list);

// GET /api/content-class/:id - Obtiene un contenido de clase por su ID
router.get('/:id', verifyToken, contentClassCtrl.getById);

// PUT /api/content-class/:id - Actualiza los datos de un contenido de clase por su ID
router.put('/:id', verifyToken, contentClassCtrl.update);

// PATCH /api/content-class/:id/activate - Activa un contenido de clase
router.patch('/:id/activate', verifyToken, contentClassCtrl.activate);

// PATCH /api/content-class/:id/anular - Anula un contenido de clase
router.patch('/:id/anular', verifyToken, contentClassCtrl.anular);

module.exports = router;

