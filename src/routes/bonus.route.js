const express = require('express');
const router = express.Router();
const bonusCtrl = require('../controllers/bonus.controller');
const verifyToken = require('../middlewares/verifyToken'); // Asumo que tienes este middleware de autenticación

// Rutas protegidas con JWT

// POST /api/bonuses - Crea un nuevo abono
router.post('/', verifyToken, bonusCtrl.create);

// GET /api/bonuses - Lista todos los abonos
router.get('/', verifyToken, bonusCtrl.list);

// GET /api/bonuses/professor/:idProfessor - Obtiene todos los abonos de un profesor específico
router.get('/professor/:idProfessor', verifyToken, bonusCtrl.getBonusesByProfessorId);

// GET /api/bonuses/:id - Obtiene un abono por su ID
// Esta ruta debe ir DESPUÉS de rutas específicas como /professor/:idProfessor para evitar conflictos
router.get('/:id', verifyToken, bonusCtrl.getById);

// DELETE /api/bonuses/:id - Elimina un abono por su ID
router.delete('/:id', verifyToken, bonusCtrl.remove);

module.exports = router;