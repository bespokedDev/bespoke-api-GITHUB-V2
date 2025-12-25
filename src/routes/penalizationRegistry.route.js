// routes/penalizationRegistry.route.js
const express = require('express');
const router = express.Router();
const penalizationRegistryCtrl = require('../controllers/penalizationRegistry.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/penalization-registry - Crea un nuevo registro de penalización
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), penalizationRegistryCtrl.create);

// GET /api/penalization-registry/user/my-penalizations - Lista registros de penalización del usuario autenticado
// Acceso: Cualquier usuario autenticado (student, professor, admin)
router.get('/user/my-penalizations', verifyToken, penalizationRegistryCtrl.getMyPenalizations);

module.exports = router;

