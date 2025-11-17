// routes/payouts.route.js
const express = require('express');
const router = express.Router();
const payoutCtrl = require('../controllers/payouts.controller');
const verifyToken = require('../middlewares/verifyToken');

// Protected routes with JWT

// POST /api/payouts - Creates a new payout
router.post('/', verifyToken, payoutCtrl.create);

// GET /api/payouts - Lists all payouts
router.get('/', verifyToken, payoutCtrl.list);

// NEW ROUTE! GET /api/payouts/professor/:professorId - Gets payouts by professor ID
router.get('/professor/:professorId', verifyToken, payoutCtrl.getPayoutsByProfessorId);

// GET /api/payouts/:id - Gets a payout by its ID
// This route should come AFTER specific routes like /professor/:professorId to avoid conflict
router.get('/:id', verifyToken, payoutCtrl.getById);

// PUT /api/payouts/:id - Updates a payout by its ID
router.put('/:id', verifyToken, payoutCtrl.update);

// PATCH /api/payouts/:id/deactivate - Deactivates a payout
router.patch('/:id/deactivate', verifyToken, payoutCtrl.deactivate);

// PATCH /api/payouts/:id/activate - Activates a payout
router.patch('/:id/activate', verifyToken, payoutCtrl.activate);

module.exports = router;
