// routes/categoryMoney.route.js
const express = require('express');
const router = express.Router();
const categoryMoneyCtrl = require('../controllers/categoryMoney.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles
// Todas las rutas son solo para admin

// POST /api/category-money - Crea una nueva categoría de dinero
// Acceso: admin
router.post('/', verifyToken, verifyRole('admin'), categoryMoneyCtrl.create);

// GET /api/category-money - Lista todas las categorías de dinero
// Acceso: admin
router.get('/', verifyToken, verifyRole('admin'), categoryMoneyCtrl.list);

// GET /api/category-money/:id - Obtiene una categoría de dinero por su ID
// Acceso: admin
router.get('/:id', verifyToken, verifyRole('admin'), categoryMoneyCtrl.getById);

// PUT /api/category-money/:id - Actualiza los datos de una categoría de dinero por su ID
// Acceso: admin
router.put('/:id', verifyToken, verifyRole('admin'), categoryMoneyCtrl.update);

// PATCH /api/category-money/:id/activate - Activa una categoría de dinero
// Acceso: admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), categoryMoneyCtrl.activate);

// PATCH /api/category-money/:id/anular - Anula una categoría de dinero
// Acceso: admin
router.patch('/:id/anular', verifyToken, verifyRole('admin'), categoryMoneyCtrl.anular);

module.exports = router;

