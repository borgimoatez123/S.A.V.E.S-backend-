const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create payment
// @route   POST /api/v1/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const booking = await Booking.findById(req.body.booking);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.body.booking}`, 404)
    );
  }

  // Check if user owns the booking
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to pay for this booking', 401));
  }

  const payment = await Payment.create(req.body);

  // Update booking payment status
  if (payment.status === 'completed') {
      booking.paymentStatus = 'paid';
      await booking.save();
  }

  res.status(201).json({
    success: true,
    data: payment
  });
});
