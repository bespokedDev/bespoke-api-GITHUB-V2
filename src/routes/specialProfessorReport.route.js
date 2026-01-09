// routes/specialProfessorReport.route.js
const express = require('express');
const router = express.Router();
const specialProfessorReportCtrl = require('../controllers/specialProfessorReport.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// GET /api/special-professor-report - Genera el reporte para el profesor excluido
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), specialProfessorReportCtrl.generateReport);

module.exports = router;