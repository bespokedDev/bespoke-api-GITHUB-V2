// routes/enrollments.route.js
const express = require('express');
const router = express.Router();
const enrollmentCtrl = require('../controllers/enrollments.controllers'); // Importa el controlador de matrículas
const verifyToken = require('../middlewares/verifyToken'); // Importa tu middleware de verificación de token
const verifyRole = require('../middlewares/verifyRole'); // Importa el middleware de verificación de roles

// Rutas protegidas con JWT y validación de roles

// POST /api/enrollments - Crea una nueva matrícula
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), enrollmentCtrl.create);

// GET /api/enrollments - Lista todas las matrículas
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), enrollmentCtrl.list);

// GET /api/enrollments/professor/:professorId - Obtiene matrículas por ID de profesor
// Acceso: Admin y profesor
// Esta ruta específica debe ir ANTES de router.get('/:id')
router.get('/professor/:professorId', verifyToken, verifyRole('admin', 'professor'), enrollmentCtrl.getEnrollmentsByProfessorId);

// GET /api/enrollments/:id/detail - Obtiene el detalle completo de una matrícula
// Acceso: Admin y profesor
router.get('/:id/detail', verifyToken, verifyRole('admin', 'professor'), enrollmentCtrl.getDetail);

// GET /api/enrollments/:id/classes - Obtiene los registros de clases de un enrollment
// Acceso: Admin, profesor y estudiante
router.get('/:id/classes', verifyToken, verifyRole('admin', 'professor', 'student'), enrollmentCtrl.getClasses);

// GET /api/enrollments/:id - Obtiene una matrícula por su ID
// Acceso: Admin, profesor y estudiante
router.get('/:id', verifyToken, verifyRole('admin', 'professor', 'student'), enrollmentCtrl.getById);

// PUT /api/enrollments/:id - Actualiza una matrícula por su ID
// Acceso: Admin y profesor
router.put('/:id', verifyToken, verifyRole('admin', 'professor'), enrollmentCtrl.update);

// PATCH /api/enrollments/:id/deactivate - Desactiva una matrícula
// Acceso: Solo admin
router.patch('/:id/deactivate', verifyToken, verifyRole('admin'), enrollmentCtrl.deactivate);

// PATCH /api/enrollments/:id/activate - Activa una matrícula
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), enrollmentCtrl.activate);

module.exports = router;
