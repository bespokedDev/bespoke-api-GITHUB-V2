// routes/categoryClass.route.js
const express = require('express');
const router = express.Router();
const categoryClassCtrl = require('../controllers/categoryClass.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/category-class - Crea una nueva categoría de clase
// Acceso: admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), categoryClassCtrl.create);

// GET /api/category-class - Lista todas las categorías de clase
// Acceso: admin, professor
router.get('/', verifyToken, verifyRole('admin', 'professor', 'admin-jr'), categoryClassCtrl.list);

// GET /api/category-class/:id - Obtiene una categoría de clase por su ID
// Acceso: admin, professor
router.get('/:id', verifyToken, verifyRole('admin', 'professor'), categoryClassCtrl.getById);

// PUT /api/category-class/:id - Actualiza los datos de una categoría de clase por su ID
// Acceso: admin
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr', 'admin-jr'), categoryClassCtrl.update);

// PATCH /api/category-class/:id/activate - Activa una categoría de clase
// Acceso: admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), categoryClassCtrl.activate);

// PATCH /api/category-class/:id/anular - Anula una categoría de clase
// Acceso: admin
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'admin-jr'), categoryClassCtrl.anular);

module.exports = router;

