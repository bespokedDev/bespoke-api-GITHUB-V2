// routes/evaluations.route.js
const express = require('express');
const router = express.Router();
const evaluationCtrl = require('../controllers/evaluations.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/evaluations - Crea una nueva evaluación
// Acceso: Solo profesor
router.post('/', verifyToken, verifyRole('professor'), evaluationCtrl.create);

// GET /api/evaluations/enrollment/:enrollmentId - Lista todas las evaluaciones de un enrollment específico
// Acceso: Profesor, admin y estudiante
router.get('/enrollment/:enrollmentId', verifyToken, verifyRole('admin', 'professor', 'student'), evaluationCtrl.listByEnrollment);

// GET /api/evaluations/class/:classRegistryId - Lista todas las evaluaciones de un registro de clase
// Acceso: Profesor, admin y estudiante
router.get('/class/:classRegistryId', verifyToken, verifyRole('admin', 'professor', 'student'), evaluationCtrl.listByClass);

// GET /api/evaluations/:id - Obtiene una evaluación por su ID
// Acceso: Profesor, admin y estudiante
router.get('/:id', verifyToken, verifyRole('admin', 'professor', 'student'), evaluationCtrl.getById);

// PUT /api/evaluations/:id - Actualiza una evaluación por su ID
// Acceso: Profesor y admin
router.put('/:id', verifyToken, verifyRole('admin', 'professor'), evaluationCtrl.update);

// PATCH /api/evaluations/:id/anular - Anula una evaluación
// Acceso: Admin y profesor
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'professor'), evaluationCtrl.anular);

// PATCH /api/evaluations/:id/activate - Activa una evaluación
// Acceso: Admin y profesor
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'professor'), evaluationCtrl.activate);

module.exports = router;

