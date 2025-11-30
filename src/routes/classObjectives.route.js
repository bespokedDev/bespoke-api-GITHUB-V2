// routes/classObjectives.route.js
const express = require('express');
const router = express.Router();
const classObjectiveCtrl = require('../controllers/classObjectives.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// POST /api/class-objectives - Crea un nuevo objetivo de clase
router.post('/', verifyToken, classObjectiveCtrl.create);

// GET /api/class-objectives - Lista todos los objetivos de clase (con información básica)
router.get('/', verifyToken, classObjectiveCtrl.list);

// GET /api/class-objectives/:id - Obtiene un objetivo de clase por su ID (con detalle completo)
router.get('/:id', verifyToken, classObjectiveCtrl.getById);

// PUT /api/class-objectives/:id - Actualiza los datos de un objetivo de clase
router.put('/:id', verifyToken, classObjectiveCtrl.update);

// PATCH /api/class-objectives/:id/anular - Anula un objetivo de clase
router.patch('/:id/anular', verifyToken, classObjectiveCtrl.anular);

module.exports = router;

