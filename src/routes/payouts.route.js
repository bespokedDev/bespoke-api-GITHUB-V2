// routes/payouts.route.js
const express = require('express');
const router = express.Router();
const payoutCtrl = require('../controllers/payouts.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas con JWT y validación de roles

// POST /api/payouts - Creates a new payout
// Acceso: Solo admin
router.post('/', verifyToken, verifyRole('admin'), payoutCtrl.create);

// GET /api/payouts - Lists all payouts
// Acceso: Solo admin
router.get('/', verifyToken, verifyRole('admin'), payoutCtrl.list);

// GET /api/payouts/professor/:professorId - Gets payouts by professor ID
// Acceso: Solo admin
router.get('/professor/:professorId', verifyToken, verifyRole('admin'), payoutCtrl.getPayoutsByProfessorId);

// GET /api/payouts/:id - Gets a payout by its ID
// Acceso: Solo admin
// This route should come AFTER specific routes like /professor/:professorId to avoid conflict
router.get('/:id', verifyToken, verifyRole('admin'), payoutCtrl.getById);

// PUT /api/payouts/:id - Updates a payout by its ID
// Acceso: Solo admin
router.put('/:id', verifyToken, verifyRole('admin'), payoutCtrl.update);

// PATCH /api/payouts/:id/deactivate - Deactivates a payout
// Acceso: Solo admin
router.patch('/:id/deactivate', verifyToken, verifyRole('admin'), payoutCtrl.deactivate);

// PATCH /api/payouts/:id/activate - Activates a payout
// Acceso: Solo admin
router.patch('/:id/activate', verifyToken, verifyRole('admin'), payoutCtrl.activate);

module.exports = router;
