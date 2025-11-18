// routes/classTypes.route.js
const express = require('express');
const router = express.Router();
const classTypeCtrl = require('../controllers/classTypes.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// POST /api/class-types - Crea un nuevo tipo de clase
router.post('/', verifyToken, classTypeCtrl.create);

// GET /api/class-types - Lista todos los tipos de clase
router.get('/', verifyToken, classTypeCtrl.list);

// GET /api/class-types/:id - Obtiene un tipo de clase por su ID
router.get('/:id', verifyToken, classTypeCtrl.getById);

// PUT /api/class-types/:id - Actualiza los datos de un tipo de clase por su ID
router.put('/:id', verifyToken, classTypeCtrl.update);

// PATCH /api/class-types/:id/activate - Activa un tipo de clase
router.patch('/:id/activate', verifyToken, classTypeCtrl.activate);

// PATCH /api/class-types/:id/anular - Anula un tipo de clase
router.patch('/:id/anular', verifyToken, classTypeCtrl.anular);

module.exports = router;

