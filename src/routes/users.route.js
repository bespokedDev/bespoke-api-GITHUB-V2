const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/users.controllers');

router.post('/login', userCtrl.login);

router.post('/logout', userCtrl.logout);

module.exports = router;