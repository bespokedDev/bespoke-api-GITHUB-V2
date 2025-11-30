// routes/enrollments.route.js
const express = require('express');
const router = express.Router();
const enrollmentCtrl = require('../controllers/enrollments.controllers'); // Importa el controlador de matrículas
const verifyToken = require('../middlewares/verifyToken'); // Importa tu middleware de verificación de token

// Rutas protegidas con JWT

// POST /api/enrollments - Crea una nueva matrícula
router.post('/', verifyToken, enrollmentCtrl.create);

// GET /api/enrollments - Lista todas las matrículas
router.get('/', verifyToken, enrollmentCtrl.list);

// ¡NUEVA RUTA! GET /api/enrollments/professor/:professorId - Obtiene matrículas por ID de profesor
// Esta ruta específica debe ir ANTES de router.get('/:id')
router.get('/professor/:professorId', verifyToken, enrollmentCtrl.getEnrollmentsByProfessorId);

// GET /api/enrollments/:id/detail - Obtiene el detalle completo de una matrícula
router.get('/:id/detail', verifyToken, enrollmentCtrl.getDetail);

// GET /api/enrollments/:id/classes - Obtiene los registros de clases de un enrollment
router.get('/:id/classes', verifyToken, enrollmentCtrl.getClasses);

// GET /api/enrollments/:id - Obtiene una matrícula por su ID
router.get('/:id', verifyToken, enrollmentCtrl.getById);

// PUT /api/enrollments/:id - Actualiza una matrícula por su ID
router.put('/:id', verifyToken, enrollmentCtrl.update);

// PATCH /api/enrollments/:id/deactivate - Desactiva una matrícula
router.patch('/:id/deactivate', verifyToken, enrollmentCtrl.deactivate);

// PATCH /api/enrollments/:id/activate - Activa una matrícula
router.patch('/:id/activate', verifyToken, enrollmentCtrl.activate);

module.exports = router;
