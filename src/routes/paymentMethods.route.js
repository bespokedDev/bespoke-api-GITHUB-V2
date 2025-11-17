// routes/paymentMethods.route.js
const express = require('express');
const router = express.Router();
const paymentMethodCtrl = require('../controllers/paymentMethods.controller');
const verifyToken = require('../middlewares/verifyToken'); // Asumo que tienes este middleware de autenticación

// Rutas protegidas con JWT

// POST /api/payment-methods - Crea un nuevo método de pago
router.post('/', verifyToken, paymentMethodCtrl.create);

// GET /api/payment-methods - Lista todos los métodos de pago
router.get('/', verifyToken, paymentMethodCtrl.list);

// GET /api/payment-methods/:id - Obtiene un método de pago por su ID
router.get('/:id', verifyToken, paymentMethodCtrl.getById);

// PUT /api/payment-methods/:id - Actualiza los datos de un método de pago por su ID
router.put('/:id', verifyToken, paymentMethodCtrl.update);

// PATCH /api/payment-methods/:id/activate - Activa un método de pago
router.patch('/:id/activate', verifyToken, paymentMethodCtrl.activate);

// PATCH /api/payment-methods/:id/deactivate - Desactiva un método de pago
router.patch('/:id/deactivate', verifyToken, paymentMethodCtrl.deactivate);

// DELETE /api/payment-methods/:id - Elimina un método de pago por su ID
router.delete('/:id', verifyToken, paymentMethodCtrl.remove);

module.exports = router;