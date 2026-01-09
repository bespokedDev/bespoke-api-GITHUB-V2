// routes/categoryNotification.route.js
const express = require('express');
const router = express.Router();
const categoryNotificationCtrl = require('../controllers/categoryNotification.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/category-notifications - Crea una nueva categoría de notificación
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), categoryNotificationCtrl.create);

// GET /api/category-notifications - Lista todas las categorías de notificación
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), categoryNotificationCtrl.list);

// GET /api/category-notifications/:id - Obtiene una categoría de notificación por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin', 'admin-jr'), categoryNotificationCtrl.getById);

// PUT /api/category-notifications/:id - Actualiza una categoría de notificación por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr'), categoryNotificationCtrl.update);

// PATCH /api/category-notifications/:id/anular - Anula una categoría de notificación
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'admin-jr'), categoryNotificationCtrl.anular);

// PATCH /api/category-notifications/:id/activate - Activa una categoría de notificación
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), categoryNotificationCtrl.activate);

module.exports = router;

