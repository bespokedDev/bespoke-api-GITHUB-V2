const express = require('express');
const router = express.Router();

router.post('/', userCtrl.login);

module.exports = router;