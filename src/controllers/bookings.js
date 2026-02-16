const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
exports.getBookings = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role !== 'admin') {
    query = Booking.find({ user: req.user.id }).populate({
      path: 'vehicle',
      select: 'model variant plateNumber'
    });
  } else {
    query = Booking.find().populate({
      path: 'vehicle',
      select: 'model variant plateNumber'
    }).populate({
      path: 'user',
      select: 'name email'
    });
  }

  const bookings = await query;

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate({
    path: 'vehicle',
    select: 'model variant plateNumber images'
  });

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner or admin
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to view this booking`, 401)
    );
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const vehicle = await Vehicle.findById(req.body.vehicle);

  if (!vehicle) {
    return next(
      new ErrorResponse(`Vehicle not found with id of ${req.body.vehicle}`, 404)
    );
  }

  // Check if vehicle is in maintenance, stolen, or accident
  if (['Maintenance', 'Stolen', 'Accident'].includes(vehicle.status)) {
    return next(new ErrorResponse(`Vehicle is currently ${vehicle.status}`, 400));
  }

  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  // Check for overlapping bookings
  const existingBookings = await Booking.find({
    vehicle: req.body.vehicle,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { startDate: { $lt: endDate }, endDate: { $gt: startDate } }
    ]
  });

  if (existingBookings.length > 0) {
    return next(new ErrorResponse('Vehicle is already booked for these dates', 400));
  }

  // Calculate total days
  const diffTime = Math.abs(endDate - startDate);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (totalDays <= 0) {
      return next(new ErrorResponse('End date must be after start date', 400));
  }

  req.body.totalDays = totalDays;
  req.body.totalPrice = totalDays * vehicle.pricePerDay;

  const booking = await Booking.create(req.body);

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner or admin
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this booking`, 401)
    );
  }

  // If status is being updated to confirmed, update vehicle status
  if (req.body.status === 'confirmed' && booking.status !== 'confirmed') {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'Booked' });
  }

  // If status is being updated to completed or cancelled, update vehicle status to Available
  if ((req.body.status === 'completed' || req.body.status === 'cancelled') && booking.status === 'confirmed') {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'Available' });
  }

  booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: booking
  });
});
