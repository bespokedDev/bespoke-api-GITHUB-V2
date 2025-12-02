// routes/paymentMethods.route.js
const express = require('express');
const router = express.Router();
const paymentMethodCtrl = require('../controllers/paymentMethods.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/payment-methods - Crea un nuevo método de pago
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), paymentMethodCtrl.create);

// GET /api/payment-methods - Lista todos los métodos de pago
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), paymentMethodCtrl.list);

// GET /api/payment-methods/:id - Obtiene un método de pago por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin'), paymentMethodCtrl.getById);

// PUT /api/payment-methods/:id - Actualiza los datos de un método de pago por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), paymentMethodCtrl.update);

// PATCH /api/payment-methods/:id/activate - Activa un método de pago
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), paymentMethodCtrl.activate);

// PATCH /api/payment-methods/:id/deactivate - Desactiva un método de pago
// Acceso: Solo admin
router.patch('/:id/deactivate', verifyToken, verifyRole('admin'), paymentMethodCtrl.deactivate);

// DELETE /api/payment-methods/:id - Elimina un método de pago por su ID
// Acceso: Solo admin
router.delete('/:id', verifyToken, verifyRole('admin'), paymentMethodCtrl.remove);

module.exports = router;