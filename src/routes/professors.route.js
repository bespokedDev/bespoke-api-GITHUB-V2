const express = require('express');
const router = express.Router();
const professorCtrl = require('../controllers/professors.controller');
const { createProfessorValidation } = require('../middlewares/validateProfessor');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/professors - Crear nuevo profesor
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), createProfessorValidation, professorCtrl.create);

// GET /api/professors - Listar todos los profesores
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), professorCtrl.list);

// GET /api/professors/:id/enrollments - Obtener enrollments de un profesor
// Acceso: Admin y professor
router.get('/:id/enrollments', verifyToken, verifyRole('admin', 'professor'), professorCtrl.getEnrollments);

// GET /api/professors/:id - Obtener profesor por ID
// Acceso: Admin y professor
router.get('/:id', verifyToken, verifyRole('admin', 'professor', 'admin-jr'), professorCtrl.getById);

// PUT /api/professors/:id - Actualizar profesor
// Acceso: Admin y professor
router.put('/:id', verifyToken, verifyRole('admin', 'professor', 'admin-jr'), professorCtrl.update);

// PATCH /api/professors/:id/deactivate - Desactivar profesor
// Acceso: Solo admin
router.patch('/:id/deactivate', verifyToken, verifyRole('admin', 'admin-jr'), professorCtrl.deactivate);

// PATCH /api/professors/:id/activate - Activar profesor
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), professorCtrl.activate);

// PATCH /api/professors/uniformize-payment-ids - Uniformizar IDs de pago
// Acceso: Solo admin
router.patch('/uniformize-payment-ids', verifyToken, verifyRole('admin', 'admin-jr'), professorCtrl.uniformizePaymentIds);

// GET /api/professors/debug/payment-data - Debug de datos de pago
// Acceso: Solo admin
router.get('/debug/payment-data', verifyToken, verifyRole('admin', 'admin-jr'), professorCtrl.logPaymentData);

module.exports = router;