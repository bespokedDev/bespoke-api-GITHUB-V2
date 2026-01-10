// routes/conversationalAttendance.route.js
const express = require('express');
const router = express.Router();
const conversationalAttendanceCtrl = require('../controllers/conversationalAttendance.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles
// Todas las rutas son solo para admin y admin-jr

// POST /api/conversational-attendance - Crea un nuevo conversational attendance
// Acceso: admin, admin-jr
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), conversationalAttendanceCtrl.create);

// GET /api/conversational-attendance - Lista todos los conversational attendance
// Acceso: admin, admin-jr
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), conversationalAttendanceCtrl.list);

// GET /api/conversational-attendance/:id - Obtiene un conversational attendance por su ID
// Acceso: admin, admin-jr
router.get('/:id', verifyToken, verifyRole('admin', 'admin-jr'), conversationalAttendanceCtrl.getById);

// PUT /api/conversational-attendance/:id - Actualiza los datos de un conversational attendance por su ID
// Acceso: admin, admin-jr
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr'), conversationalAttendanceCtrl.update);

// PATCH /api/conversational-attendance/:id/activate - Activa un conversational attendance
// Acceso: admin, admin-jr
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), conversationalAttendanceCtrl.activate);

// PATCH /api/conversational-attendance/:id/anular - Anula un conversational attendance
// Acceso: admin, admin-jr
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'admin-jr'), conversationalAttendanceCtrl.anular);

module.exports = router;
