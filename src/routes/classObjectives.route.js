// routes/classObjectives.route.js
const express = require('express');
const router = express.Router();
const classObjectiveCtrl = require('../controllers/classObjectives.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/class-objectives - Crea un nuevo objetivo de clase
// Acceso: admin
router.post('/', verifyToken, verifyRole('admin'), classObjectiveCtrl.create);

// GET /api/class-objectives - Lista todos los objetivos de clase (con información básica)
// Acceso: admin, professor
router.get('/', verifyToken, verifyRole('admin', 'professor'), classObjectiveCtrl.list);

// GET /api/class-objectives/:id - Obtiene un objetivo de clase por su ID (con detalle completo)
// Acceso: admin, professor
router.get('/:id', verifyToken, verifyRole('admin', 'professor'), classObjectiveCtrl.getById);

// PUT /api/class-objectives/:id - Actualiza los datos de un objetivo de clase
// Acceso: admin
router.put('/:id', verifyToken, verifyRole('admin'), classObjectiveCtrl.update);

// PATCH /api/class-objectives/:id/anular - Anula un objetivo de clase
// Acceso: admin
router.patch('/:id/anular', verifyToken, verifyRole('admin'), classObjectiveCtrl.anular);

module.exports = router;

