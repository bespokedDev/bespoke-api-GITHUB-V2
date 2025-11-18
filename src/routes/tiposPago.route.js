// routes/tiposPago.route.js
const express = require('express');
const router = express.Router();
const tipoPagoCtrl = require('../controllers/tiposPago.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// POST /api/payment-types - Crea un nuevo tipo de pago
router.post('/', verifyToken, tipoPagoCtrl.create);

// GET /api/payment-types - Lista todos los tipos de pago
router.get('/', verifyToken, tipoPagoCtrl.list);

// GET /api/payment-types/:id - Obtiene un tipo de pago por su ID
router.get('/:id', verifyToken, tipoPagoCtrl.getById);

// PUT /api/payment-types/:id - Actualiza los datos de un tipo de pago por su ID
router.put('/:id', verifyToken, tipoPagoCtrl.update);

// PATCH /api/payment-types/:id/activate - Activa un tipo de pago
router.patch('/:id/activate', verifyToken, tipoPagoCtrl.activate);

// PATCH /api/payment-types/:id/anular - Anula un tipo de pago
router.patch('/:id/anular', verifyToken, tipoPagoCtrl.anular);

module.exports = router;

