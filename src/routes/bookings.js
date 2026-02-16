const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking
} = require('../controllers/bookings');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validators');

router.use(protect);

router
  .route('/')
  .get(getBookings)
  .post(validateBooking, createBooking);

router
  .route('/:id')
  .get(getBooking)
  .put(updateBooking);

module.exports = router;
