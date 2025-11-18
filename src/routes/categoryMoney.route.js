// routes/categoryMoney.route.js
const express = require('express');
const router = express.Router();
const categoryMoneyCtrl = require('../controllers/categoryMoney.controller');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT

// POST /api/category-money - Crea una nueva categoría de dinero
router.post('/', verifyToken, categoryMoneyCtrl.create);

// GET /api/category-money - Lista todas las categorías de dinero
router.get('/', verifyToken, categoryMoneyCtrl.list);

// GET /api/category-money/:id - Obtiene una categoría de dinero por su ID
router.get('/:id', verifyToken, categoryMoneyCtrl.getById);

// PUT /api/category-money/:id - Actualiza los datos de una categoría de dinero por su ID
router.put('/:id', verifyToken, categoryMoneyCtrl.update);

// PATCH /api/category-money/:id/activate - Activa una categoría de dinero
router.patch('/:id/activate', verifyToken, categoryMoneyCtrl.activate);

// PATCH /api/category-money/:id/anular - Anula una categoría de dinero
router.patch('/:id/anular', verifyToken, categoryMoneyCtrl.anular);

module.exports = router;

