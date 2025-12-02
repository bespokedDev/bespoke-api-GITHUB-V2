// routes/generalPaymentTracker.route.js
const express = require('express');
const router = express.Router();
const generalPaymentTrackerCtrl = require('../controllers/generalPaymentTracker.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/general-payment-tracker - Guarda un reporte modificado
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), generalPaymentTrackerCtrl.saveModifiedReport);

// GET /api/general-payment-tracker - Lista todos los reportes guardados
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), generalPaymentTrackerCtrl.listAllSavedReports);

// GET /api/general-payment-tracker/special-reports - Lista reportes especiales guardados
// Acceso: Solo admin
router.get('/special-reports', verifyToken, verifyRole('admin'), generalPaymentTrackerCtrl.listSpecialSavedReports);

// GET /api/general-payment-tracker/:id - Obtiene un reporte por su ID
// Acceso: Solo admin
router.get('/:id', verifyToken, verifyRole('admin'), generalPaymentTrackerCtrl.getReportById);

module.exports = router;