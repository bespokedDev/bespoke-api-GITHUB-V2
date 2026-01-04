// routes/professorType.route.js
const express = require('express');
const router = express.Router();
const professorTypeCtrl = require('../controllers/professorType.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/professor-types - Crea un nuevo tipo de profesor
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), professorTypeCtrl.create);

// GET /api/professor-types - Lista todos los tipos de profesor
// Acceso: Admin y profesor
router.get('/', verifyToken, verifyRole('admin', 'professor'), professorTypeCtrl.list);

// GET /api/professor-types/:id - Obtiene un tipo de profesor por su ID
// Acceso: Admin y profesor
router.get('/:id', verifyToken, verifyRole('admin', 'professor'), professorTypeCtrl.getById);

// PUT /api/professor-types/:id - Actualiza los datos de un tipo de profesor por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), professorTypeCtrl.update);

// PATCH /api/professor-types/:id/activate - Activa un tipo de profesor
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), professorTypeCtrl.activate);

// PATCH /api/professor-types/:id/anular - Anula un tipo de profesor
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin'), professorTypeCtrl.anular);

module.exports = router;
