const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/students.controllers'); // Importa el controlador de estudiantes
const verifyToken = require('../middlewares/verifyToken'); // Importa tu middleware de verificación de token

// Middleware de validación para la creación de estudiantes (opcional, puedes crear uno similar a validateProfessor)
// const { createStudentValidation } = require('../middlewares/validateStudent'); // Ejemplo si lo creas

// Rutas protegidas con JWT

// POST /api/students - Crea un nuevo estudiante
// Si creas una validación específica, úsala aquí:
// router.post('/', verifyToken, createStudentValidation, studentCtrl.create);
router.post('/', verifyToken, studentCtrl.create);

// GET /api/students - Lista todos los estudiantes
router.get('/', verifyToken, studentCtrl.list);

// GET /api/students/info/:id - Obtiene información del saldo del estudiante
// Esta ruta debe estar antes de /:id para evitar conflictos
router.get('/info/:id', verifyToken, studentCtrl.studentInfo);

// GET /api/students/:id - Obtiene un estudiante por su ID
router.get('/:id', verifyToken, studentCtrl.getById);

// PUT /api/students/:id - Actualiza un estudiante por su ID
router.put('/:id', verifyToken, studentCtrl.update);

// PATCH /api/students/:id/deactivate - Desactiva un estudiante
router.patch('/:id/deactivate', verifyToken, studentCtrl.deactivate);

// PATCH /api/students/:id/activate - Activa un estudiante
router.patch('/:id/activate', verifyToken, studentCtrl.activate);

module.exports = router;