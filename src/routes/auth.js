const express = require('express');
const { register, login, getMe } = require('../controllers/auth');
const { validateRegister, validateLogin } = require('../middleware/validators');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);

module.exports = router;
