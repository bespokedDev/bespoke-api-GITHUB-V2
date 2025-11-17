// src/routes/incomes.route.js
const express = require('express');
const router = express.Router();
const incomesCtrl = require('../controllers/income.controllers');
const verifyToken = require('../middlewares/verifyToken'); // Asumiendo que tienes un middleware para verificar JWT
// const { createIncomeValidation } = require('../middlewares/validateIncome'); // Puedes crear un middleware de validación si es necesario

// Aquí puedes añadir un middleware de validación específico para incomes si lo necesitas.
// Por ejemplo:
// router.post('/', verifyToken, createIncomeValidation, incomesCtrl.create);

// Rutas protegidas con JWT
router.get('/professors-payout-report', verifyToken, incomesCtrl.professorsPayoutReport);
router.get('/summary-by-payment-method', verifyToken, incomesCtrl.getIncomesSummaryByPaymentMethod);
router.post('/', verifyToken, incomesCtrl.create);
router.get('/', verifyToken, incomesCtrl.list);
router.get('/:id', verifyToken, incomesCtrl.getById);
router.put('/:id', verifyToken, incomesCtrl.update);
router.delete('/:id', verifyToken, incomesCtrl.remove); // Para eliminar un ingreso



module.exports = router;