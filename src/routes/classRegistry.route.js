// routes/classRegistry.route.js
const express = require('express');
const router = express.Router();
const classRegistryCtrl = require('../controllers/classRegistry.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// GET /api/class-registry - Lista todos los registros de clase (con información básica)
// Acceso: admin, professor, student
router.get('/', verifyToken, verifyRole('admin', 'professor', 'student'), classRegistryCtrl.list);

// GET /api/class-registry/range - Lista registros de clase por rango de fechas de un enrollment
// Acceso: admin, professor, student
router.get('/range', verifyToken, verifyRole('admin', 'professor', 'student'), classRegistryCtrl.listByDateRange);

// GET /api/class-registry/:id - Obtiene un registro de clase por su ID (con detalle completo)
// Acceso: admin, professor
router.get('/:id', verifyToken, verifyRole('admin', 'professor'), classRegistryCtrl.getById);

// PUT /api/class-registry/:id - Actualiza los datos de un registro de clase
// Acceso: admin, professor
router.put('/:id', verifyToken, verifyRole('admin', 'professor'), classRegistryCtrl.update);

// POST /api/class-registry/:id/reschedule - Crea una nueva clase de tipo reschedule
// Acceso: professor
router.post('/:id/reschedule', verifyToken, verifyRole('professor'), classRegistryCtrl.createReschedule);

module.exports = router;

