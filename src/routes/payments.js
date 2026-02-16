const express = require('express');
const { createPayment } = require('../controllers/payments');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createPayment);

module.exports = router;
