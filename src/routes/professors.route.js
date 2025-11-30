const express = require('express');
const router = express.Router();
const professorCtrl = require('../controllers/professors.controller');
const { createProfessorValidation } = require('../middlewares/validateProfessor');
const verifyToken = require('../middlewares/verifyToken');

// Rutas protegidas con JWT
router.post('/', verifyToken, createProfessorValidation, professorCtrl.create);
router.get('/', verifyToken, professorCtrl.list);
router.get('/:id/enrollments', verifyToken, professorCtrl.getEnrollments);
router.get('/:id', verifyToken, professorCtrl.getById);
router.put('/:id', verifyToken, professorCtrl.update);
router.patch('/:id/deactivate', verifyToken, professorCtrl.deactivate);
router.patch('/:id/activate', verifyToken, professorCtrl.activate);
router.patch('/uniformize-payment-ids', verifyToken, professorCtrl.uniformizePaymentIds);
router.get('/debug/payment-data', verifyToken, professorCtrl.logPaymentData);

module.exports = router;