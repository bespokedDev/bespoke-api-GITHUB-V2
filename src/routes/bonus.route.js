const express = require('express');
const router = express.Router();
const bonusCtrl = require('../controllers/bonus.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles
// Todas las rutas son solo para admin

// POST /api/bonuses - Crea un nuevo abono
// Acceso: admin
router.post('/', verifyToken, verifyRole('admin'), bonusCtrl.create);

// GET /api/bonuses - Lista todos los abonos
// Acceso: admin
router.get('/', verifyToken, verifyRole('admin'), bonusCtrl.list);

// GET /api/bonuses/professor/:idProfessor - Obtiene todos los abonos de un profesor específico
// Acceso: admin
router.get('/professor/:idProfessor', verifyToken, verifyRole('admin'), bonusCtrl.getBonusesByProfessorId);

// GET /api/bonuses/:id - Obtiene un abono por su ID
// Esta ruta debe ir DESPUÉS de rutas específicas como /professor/:idProfessor para evitar conflictos
// Acceso: admin
router.get('/:id', verifyToken, verifyRole('admin'), bonusCtrl.getById);

// DELETE /api/bonuses/:id - Elimina un abono por su ID
// Acceso: admin
router.delete('/:id', verifyToken, verifyRole('admin'), bonusCtrl.remove);

module.exports = router;