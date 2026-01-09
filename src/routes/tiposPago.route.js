// routes/tiposPago.route.js
const express = require('express');
const router = express.Router();
const tipoPagoCtrl = require('../controllers/tiposPago.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/payment-types - Crea un nuevo tipo de pago
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), tipoPagoCtrl.create);

// GET /api/payment-types - Lista todos los tipos de pago
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), tipoPagoCtrl.list);

// GET /api/payment-types/:id - Obtiene un tipo de pago por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin', 'admin-jr'), tipoPagoCtrl.getById);

// PUT /api/payment-types/:id - Actualiza los datos de un tipo de pago por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr'), tipoPagoCtrl.update);

// PATCH /api/payment-types/:id/activate - Activa un tipo de pago
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), tipoPagoCtrl.activate);

// PATCH /api/payment-types/:id/anular - Anula un tipo de pago
// Acceso: Solo admin
router.patch('/:id/anular', verifyToken, verifyRole('admin', 'admin-jr'), tipoPagoCtrl.anular);

module.exports = router;

