const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/students.controllers'); // Importa el controlador de estudiantes
const verifyToken = require('../middlewares/verifyToken'); // Importa tu middleware de verificación de token
const verifyRole = require('../middlewares/verifyRole'); // Importa el middleware de verificación de roles

// Middleware de validación para la creación de estudiantes (opcional, puedes crear uno similar a validateProfessor)
// const { createStudentValidation } = require('../middlewares/validateStudent'); // Ejemplo si lo creas

// Rutas protegidas con JWT y validación de roles

// POST /api/students - Crea un nuevo estudiante
// Acceso: Solo admin
// Si creas una validación específica, úsala aquí:
// router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), createStudentValidation, studentCtrl.create);
router.post('/', verifyToken, verifyRole('admin', 'admin-jr'), studentCtrl.create);

// GET /api/students - Lista todos los estudiantes
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin', 'admin-jr'), studentCtrl.list);

// GET /api/students/info/:id - Obtiene información del saldo del estudiante
// Acceso: Admin, estudiante y profesor
// Esta ruta debe estar antes de /:id para evitar conflictos
router.get('/info/:id', verifyToken, verifyRole('admin', 'student', 'professor'), studentCtrl.studentInfo);

// GET /api/students/:studentId/enrollment/:enrollmentId - Obtiene información detallada de un enrollment específico y todas sus clases
// Acceso: Admin, estudiante y profesor
// Esta ruta debe estar antes de /:id para evitar conflictos
router.get('/:studentId/enrollment/:enrollmentId', verifyToken, verifyRole('admin', 'student', 'professor'), studentCtrl.getEnrollmentDetails);

// GET /api/students/:id - Obtiene un estudiante por su ID
// Acceso: Admin, estudiante y profesor
router.get('/:id', verifyToken, verifyRole('admin', 'student', 'professor', 'admin-jr'), studentCtrl.getById);

// PUT /api/students/:id - Actualiza un estudiante por su ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin', 'admin-jr'), studentCtrl.update);

// PATCH /api/students/:id/deactivate - Desactiva un estudiante
// Acceso: Solo admin
router.patch('/:id/deactivate', verifyToken, verifyRole('admin', 'admin-jr'), studentCtrl.deactivate);

// PATCH /api/students/:id/activate - Activa un estudiante
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin', 'admin-jr'), studentCtrl.activate);

module.exports = router;