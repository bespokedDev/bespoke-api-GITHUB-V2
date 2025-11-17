// routes/generalPaymentTracker.route.js
const express = require('express');
const router = express.Router();
const generalPaymentTrackerCtrl = require('../controllers/generalPaymentTracker.controller');
const verifyToken = require('../middlewares/verifyToken'); // Asumo que tienes este middleware

// Rutas protegidas con JWT

// POST /api/general-payment-tracker - Guarda un reporte modificado
router.post('/', verifyToken, generalPaymentTrackerCtrl.saveModifiedReport);

// GET /api/general-payment-tracker - Lista todos los reportes guardados (opcional)
router.get('/', verifyToken, generalPaymentTrackerCtrl.listAllSavedReports);

// GET /api/general-payment-tracker/special-reports
router.get('/special-reports', verifyToken, generalPaymentTrackerCtrl.listSpecialSavedReports);

router.get('/:id', verifyToken, generalPaymentTrackerCtrl.getReportById);

module.exports = router;