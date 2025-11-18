// routes/categoryClass.route.js
const express = require('express');
const router = express.Router();
const categoryClassCtrl = require('../controllers/categoryClass.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// POST /api/category-class - Crea una nueva categoría de clase
router.post('/', verifyToken, categoryClassCtrl.create);

// GET /api/category-class - Lista todas las categorías de clase
router.get('/', verifyToken, categoryClassCtrl.list);

// GET /api/category-class/:id - Obtiene una categoría de clase por su ID
router.get('/:id', verifyToken, categoryClassCtrl.getById);

// PUT /api/category-class/:id - Actualiza los datos de una categoría de clase por su ID
router.put('/:id', verifyToken, categoryClassCtrl.update);

// PATCH /api/category-class/:id/activate - Activa una categoría de clase
router.patch('/:id/activate', verifyToken, categoryClassCtrl.activate);

// PATCH /api/category-class/:id/anular - Anula una categoría de clase
router.patch('/:id/anular', verifyToken, categoryClassCtrl.anular);

module.exports = router;

