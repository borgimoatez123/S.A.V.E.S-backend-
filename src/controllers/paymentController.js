const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const normalizeBooleanish = (value) => {
  return value === 1 || value === '1' || value === true;
};

exports.createCashPaymentForBooking = asyncHandler(async (req, res, next) => {
  const { bookingId, completed } = req.body;
  const markCompleted = normalizeBooleanish(completed);

  if (!bookingId) {
    return next(new ErrorResponse('bookingId is required', 400));
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${bookingId}`, 404));
  }

  if (booking.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to pay for this booking', 403));
  }

  if (booking.paymentStatus === 'paid') {
    return next(new ErrorResponse('Booking is already paid', 400));
  }

  const existingCashPayment = await Payment.findOne({
    booking: booking._id,
    user: req.user.id,
    method: 'cash',
    status: { $in: ['pending', 'completed'] }
  });

  if (existingCashPayment) {
    if (markCompleted && existingCashPayment.status !== 'completed') {
      existingCashPayment.status = 'completed';
      await existingCashPayment.save();

      booking.paymentStatus = 'paid';
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      data: existingCashPayment
    });
  }

  const vehicle = await Vehicle.findById(booking.vehicle);

  if (!vehicle) {
    return next(new ErrorResponse('Vehicle not found for this booking', 404));
  }

  const totalDays = booking.totalDays;

  if (!totalDays || totalDays <= 0) {
    return next(new ErrorResponse('Invalid booking duration', 400));
  }

  const amount = totalDays * vehicle.pricePerDay;

  const payment = await Payment.create({
    booking: booking._id,
    user: req.user.id,
    amount,
    method: 'cash',
    status: markCompleted ? 'completed' : 'pending',
    transactionId: null
  });

  if (markCompleted) {
    booking.paymentStatus = 'paid';
    await booking.save();
  }

  return res.status(201).json({
    success: true,
    data: payment
  });
});

exports.createCardPaymentForBooking = asyncHandler(async (req, res, next) => {
  const { bookingId, cardNumber, cvc, expMonth, expYear, completed } = req.body;
  const markCompleted = completed === undefined ? true : normalizeBooleanish(completed);

  if (!bookingId) {
    return next(new ErrorResponse('bookingId is required', 400));
  }

  if (!cardNumber) {
    return next(new ErrorResponse('cardNumber is required', 400));
  }

  const cardNumberStr = String(cardNumber).trim();
  if (cardNumberStr !== '4000056655665556') {
    return next(new ErrorResponse('Invalid card number', 400));
  }

  if (cvc === undefined || cvc === null) {
    return next(new ErrorResponse('cvc is required', 400));
  }

  const cvcStr = String(cvc).trim();
  if (!/^\d{3}$/.test(cvcStr)) {
    return next(new ErrorResponse('Invalid cvc', 400));
  }

  const expMonthNum = Number(expMonth);
  const expYearNum = Number(expYear);

  if (!Number.isInteger(expMonthNum) || expMonthNum < 1 || expMonthNum > 12) {
    return next(new ErrorResponse('Invalid expMonth', 400));
  }

  if (!Number.isInteger(expYearNum) || expYearNum <= 2026) {
    return next(new ErrorResponse('Invalid expYear', 400));
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${bookingId}`, 404));
  }

  if (booking.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to pay for this booking', 403));
  }

  if (booking.paymentStatus === 'paid') {
    return next(new ErrorResponse('Booking is already paid', 400));
  }

  const existingCardPayment = await Payment.findOne({
    booking: booking._id,
    user: req.user.id,
    method: 'card',
    status: { $in: ['pending', 'completed'] }
  });

  if (existingCardPayment) {
    if (markCompleted && existingCardPayment.status !== 'completed') {
      existingCardPayment.status = 'completed';
      existingCardPayment.transactionId = `CARD-${Date.now()}`;
      await existingCardPayment.save();

      booking.paymentStatus = 'paid';
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      data: existingCardPayment
    });
  }

  const vehicle = await Vehicle.findById(booking.vehicle);

  if (!vehicle) {
    return next(new ErrorResponse('Vehicle not found for this booking', 404));
  }

  const totalDays = booking.totalDays;

  if (!totalDays || totalDays <= 0) {
    return next(new ErrorResponse('Invalid booking duration', 400));
  }

  const amount = totalDays * vehicle.pricePerDay;

  const payment = await Payment.create({
    booking: booking._id,
    user: req.user.id,
    amount,
    method: 'card',
    status: markCompleted ? 'completed' : 'pending',
    transactionId: markCompleted ? `CARD-${Date.now()}` : null
  });

  if (markCompleted) {
    booking.paymentStatus = 'paid';
    await booking.save();
  }

  return res.status(201).json({
    success: true,
    data: payment
  });
});
