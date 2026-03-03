const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createCashPaymentForBooking,
  createCardPaymentForBooking,
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/cash', protect, createCashPaymentForBooking);
router.post('/card', protect, createCardPaymentForBooking);

module.exports = router;
