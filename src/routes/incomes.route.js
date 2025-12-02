// src/routes/incomes.route.js
const express = require('express');
const router = express.Router();
const incomesCtrl = require('../controllers/income.controllers');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');
// const { createIncomeValidation } = require('../middlewares/validateIncome'); // Puedes crear un middleware de validación si es necesario

// Aquí puedes añadir un middleware de validación específico para incomes si lo necesitas.
// Por ejemplo:
// router.post('/', verifyToken, verifyRole('admin'), createIncomeValidation, incomesCtrl.create);

// Rutas protegidas con JWT y validación de roles

// GET /api/incomes/professors-payout-report - Genera reporte de pagos a profesores
// Acceso: Solo admin
router.get('/professors-payout-report', verifyToken, verifyRole('admin'), incomesCtrl.professorsPayoutReport);

// GET /api/incomes/summary-by-payment-method - Obtiene resumen de ingresos por método de pago
// Acceso: Solo admin
router.get('/summary-by-payment-method', verifyToken, verifyRole('admin'), incomesCtrl.getIncomesSummaryByPaymentMethod);

// POST /api/incomes - Crea un nuevo ingreso
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), incomesCtrl.create);

// GET /api/incomes - Lista todos los ingresos
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), incomesCtrl.list);

// GET /api/incomes/:id - Obtiene un ingreso por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin'), incomesCtrl.getById);

// PUT /api/incomes/:id - Actualiza un ingreso por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), incomesCtrl.update);

// DELETE /api/incomes/:id - Elimina un ingreso por su ID
// Acceso: Solo admin
router.delete('/:id', verifyToken, verifyRole('admin'), incomesCtrl.remove);

module.exports = router;