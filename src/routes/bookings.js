const express = require('express');
const {
  getBookings,
  getBooking,
  hasBooking,
  createBooking,
  updateBooking,
  updateBookingDeliveryStatus,
  updateBookingStatus
} = require('../controllers/bookings');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validators');

router.use(protect);

router
  .route('/')
  .get(getBookings)
  .post(validateBooking, createBooking);

router.get('/has-booking', hasBooking);

router
  .route('/:id')
  .get(getBooking)
  .put(updateBooking);

router.route('/:id/delivery').patch(authorize('admin'), updateBookingDeliveryStatus);
router.route('/:id/status').patch(updateBookingStatus);

module.exports = router;
