const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const generateBookingConfirmationPdf = require('../utils/generateBookingConfirmationPdf');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
exports.getBookings = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role !== 'admin') {
    query = Booking.find({ user: req.user.id })
      .populate({
        path: 'vehicle',
        select: 'model pricePerDay'
      })
      .populate({
        path: 'adminId',
        select: 'name agencyName'
      })
      .populate({
        path: 'user',
        select: 'name email'
      });
  } else {
    query = Booking.find({ adminId: req.user.id })
      .populate({
        path: 'vehicle',
        select: 'model pricePerDay'
      })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'adminId',
        select: 'name agencyName'
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
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'vehicle',
      select: 'model pricePerDay'
    })
    .populate({
      path: 'adminId',
      select: 'name agencyName'
    })
    .populate({
      path: 'user',
      select: 'name email'
    });

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  if (req.user.role === 'admin') {
    if (booking.adminId.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to view this booking`,
          403
        )
      );
    }
  } else if (booking.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this booking`,
        403
      )
    );
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

exports.hasBooking = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const booking = await Booking.findOne({ user: userId });

  return res.status(200).json({
    success: true,
    hasBooking: !!booking
  });
});

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;
  delete req.body.agencyName;
  delete req.body.adminId;
  delete req.body.deliveredToClient;

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
  
  if (!vehicle.agency || !vehicle.agency.name) {
    return next(new ErrorResponse('Vehicle agency is missing', 400));
  }

  if (!vehicle.createdBy) {
    return next(new ErrorResponse('Vehicle adminId is missing', 400));
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

  // Derive agency info and adminId from vehicle
  req.body.agencyName = vehicle.agency.name;
  req.body.adminId = vehicle.createdBy;
  req.body.deliveredToClient = false; // Force default

  const booking = await Booking.create(req.body);

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking delivery status
// @route   PATCH /api/v1/bookings/:id/delivery
// @access  Private (Admin only)
exports.updateBookingDeliveryStatus = asyncHandler(async (req, res, next) => {
  const { deliveredToClient } = req.body;
  
  if (deliveredToClient === undefined) {
    return next(new ErrorResponse('Please provide deliveredToClient status', 400));
  }

  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Verify ownership - only the admin who owns the booking can update delivery status
  if (booking.adminId.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update delivery status for this booking`, 403)
    );
  }

  booking.deliveredToClient = deliveredToClient;
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
  const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse('Please provide a booking status', 400));
  }

  if (!allowedStatuses.includes(status)) {
    return next(new ErrorResponse('Invalid booking status', 400));
  }

  let booking = await Booking.findById(req.params.id);
  const previousStatus = booking?.status;

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  if (req.user.role === 'admin') {
    if (booking.adminId.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this booking`,
          403
        )
      );
    }
  } else if (booking.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this booking`,
        403
      )
    );
  }

  if (status === 'confirmed' && booking.status !== 'confirmed') {
    await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'Booked' });
  }

  if (
    (status === 'completed' || status === 'cancelled') &&
    booking.status === 'confirmed'
  ) {
    await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'Available' });
  }

  booking.status = status;
  await booking.save();

  booking = await Booking.findById(booking._id)
    .populate({
      path: 'adminId',
      select: 'name agencyName'
    })
    .populate({
      path: 'vehicle',
      select: 'model pricePerDay'
    })
    .populate({
      path: 'user',
      select: 'name email'
    });

  if (status === 'confirmed' && previousStatus !== 'confirmed') {
    if (!booking.user || !booking.user.email) {
      return next(new ErrorResponse('Booking user email is missing', 400));
    }

    const pdfBuffer = await generateBookingConfirmationPdf({
      booking,
      vehicle: booking.vehicle,
      user: booking.user
    });

    const subject = 'Booking Confirmation';
    const text = `Booking confirmed.\n\nBooking ID: ${booking._id}\nCar: ${booking.vehicle?.model || ''}\nStart date: ${new Date(booking.startDate).toISOString().split('T')[0]}\nEnd date: ${new Date(booking.endDate).toISOString().split('T')[0]}\nTotal price: ${booking.totalPrice}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="color: #0f172a;">Booking Confirmed</h2>
        <p>Your booking is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; font-weight: bold;">Booking ID</td><td>${booking._id}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Car</td><td>${booking.vehicle?.model || ''}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Start date</td><td>${new Date(booking.startDate).toISOString().split('T')[0]}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">End date</td><td>${new Date(booking.endDate).toISOString().split('T')[0]}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Total price</td><td>${booking.totalPrice}</td></tr>
        </table>
      </div>
    `;

    try {
      await sendEmail({
        to: booking.user.email,
        subject,
        text,
        html,
        attachments: [
          {
            filename: `booking-${booking._id}.pdf`,
            content: pdfBuffer
          }
        ]
      });
    } catch (err) {
      return next(new ErrorResponse(`Email sending failed: ${err.message}`, 500));
    }
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id);
  const previousStatus = booking?.status;

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  if (req.user.role === 'admin') {
    if (booking.adminId.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this booking`,
          403
        )
      );
    }
  } else if (booking.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this booking`,
        403
      )
    );
  }

  const forbiddenFields = [
    'agencyName',
    'adminId',
    'deliveredToClient',
    'user',
    'vehicle',
    'totalDays',
    'totalPrice'
  ];

  for (const field of forbiddenFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      return next(
        new ErrorResponse(`You are not allowed to update ${field}`, 403)
      );
    }
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

  booking = await Booking.findById(booking._id)
    .populate({
      path: 'adminId',
      select: 'name agencyName'
    })
    .populate({
      path: 'vehicle',
      select: 'model pricePerDay'
    })
    .populate({
      path: 'user',
      select: 'name email'
    });

  if (booking.status === 'confirmed' && previousStatus !== 'confirmed') {
    if (!booking.user || !booking.user.email) {
      return next(new ErrorResponse('Booking user email is missing', 400));
    }

    const pdfBuffer = await generateBookingConfirmationPdf({
      booking,
      vehicle: booking.vehicle,
      user: booking.user
    });

    const subject = 'Booking Confirmation';
    const text = `Booking confirmed.\n\nBooking ID: ${booking._id}\nCar: ${booking.vehicle?.model || ''}\nStart date: ${new Date(booking.startDate).toISOString().split('T')[0]}\nEnd date: ${new Date(booking.endDate).toISOString().split('T')[0]}\nTotal price: ${booking.totalPrice}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="color: #0f172a;">Booking Confirmed</h2>
        <p>Your booking is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; font-weight: bold;">Booking ID</td><td>${booking._id}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Car</td><td>${booking.vehicle?.model || ''}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Start date</td><td>${new Date(booking.startDate).toISOString().split('T')[0]}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">End date</td><td>${new Date(booking.endDate).toISOString().split('T')[0]}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Total price</td><td>${booking.totalPrice}</td></tr>
        </table>
      </div>
    `;

    try {
      await sendEmail({
        to: booking.user.email,
        subject,
        text,
        html,
        attachments: [
          {
            filename: `booking-${booking._id}.pdf`,
            content: pdfBuffer
          }
        ]
      });
    } catch (err) {
      return next(new ErrorResponse(`Email sending failed: ${err.message}`, 500));
    }
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});
