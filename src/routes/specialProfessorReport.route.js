// routes/specialProfessorReport.route.js
const express = require('express');
const router = express.Router();
const specialProfessorReportCtrl = require('../controllers/specialProfessorReport.controller');
const verifyToken = require('../middlewares/verifyToken');

// Ruta protegida con JWT

// GET /api/special-professor-report - Genera el reporte para el profesor excluido
router.get('/', verifyToken, specialProfessorReportCtrl.generateReport);

module.exports = router;