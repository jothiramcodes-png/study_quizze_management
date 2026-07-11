const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { login, refreshToken, getMe, changePassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

module.exports = router;