const express = require('express');
const router = express.Router();
const professorBonusCtrl = require('../controllers/professorBonus.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles
// Todas las rutas son solo para admin

// POST /api/professor-bonuses - Crea un nuevo bono de profesor
// Acceso: admin
router.post('/', verifyToken, verifyRole('admin'), professorBonusCtrl.create);

// GET /api/professor-bonuses - Lista todos los bonos de profesores
// Acceso: admin
router.get('/', verifyToken, verifyRole('admin'), professorBonusCtrl.list);

// GET /api/professor-bonuses/professor/:professorId - Obtiene todos los bonos de un profesor específico
// Acceso: admin
router.get('/professor/:professorId', verifyToken, verifyRole('admin'), professorBonusCtrl.getBonusesByProfessorId);

// GET /api/professor-bonuses/:id - Obtiene un bono por su ID
// Esta ruta debe ir DESPUÉS de rutas específicas como /professor/:professorId para evitar conflictos
// Acceso: admin
router.get('/:id', verifyToken, verifyRole('admin'), professorBonusCtrl.getById);

// PUT /api/professor-bonuses/:id - Actualiza un bono de profesor
// Acceso: admin
router.put('/:id', verifyToken, verifyRole('admin'), professorBonusCtrl.update);

// DELETE /api/professor-bonuses/:id - Anula un bono de profesor (cambia status a 2)
// Acceso: admin
router.delete('/:id', verifyToken, verifyRole('admin'), professorBonusCtrl.remove);

module.exports = router;

