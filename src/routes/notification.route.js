// routes/notification.route.js
const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/notification.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/notifications - Crea una nueva notificación
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), notificationCtrl.create);

// GET /api/notifications - Lista todas las notificaciones
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), notificationCtrl.list);

// GET /api/notifications/user/my-notifications - Lista notificaciones del usuario autenticado
// Acceso: Cualquier usuario autenticado (student, professor, admin)
router.get('/user/my-notifications', verifyToken, notificationCtrl.getMyNotifications);

// GET /api/notifications/:id - Obtiene una notificación por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin', 'admin-jr'), notificationCtrl.getById);

// PUT /api/notifications/:id - Actualiza una notificación por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr'), notificationCtrl.update);

// PATCH /api/notifications/:id/anular - Anula una notificación
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'admin-jr'), notificationCtrl.anular);

// PATCH /api/notifications/:id/activate - Activa una notificación
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), notificationCtrl.activate);

module.exports = router;

