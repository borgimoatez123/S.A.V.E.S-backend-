const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  if (typeof name === 'undefined' && typeof email === 'undefined') {
    return next(new ErrorResponse('Please provide fields to update', 400));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (typeof name !== 'undefined') {
    user.name = name;
  }

  if (typeof email !== 'undefined') {
    user.email = email;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

exports.updateMyPassword = asyncHandler(async (req, res, next) => {
  const { verifyFace, newPassword } = req.body;

  if (verifyFace !== true) {
    return next(new ErrorResponse('Face verification required', 403));
  }

  if (!newPassword) {
    return next(new ErrorResponse('Please provide a new password', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

exports.updateAgency = asyncHandler(async (req, res, next) => {
  const { agencyName, agencyLocation } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (typeof agencyName !== 'undefined') {
    user.agencyName = agencyName;
  }

  if (typeof agencyLocation !== 'undefined') {
    user.agencyLocation = agencyLocation;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get agency info
// @route   GET /api/v1/auth/agency
// @access  Public
exports.getAgency = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ role: 'admin' });

  if (!user) {
    return next(new ErrorResponse('Agency info not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      agencyName: user.agencyName,
      agencyLocation: user.agencyLocation,
      email: user.email
    }
  });
});

exports.getProfileImage = asyncHandler(async (req, res, next) => {
  const requested = req.params.filename;
  const filename = path.basename(requested);

  if (filename !== requested) {
    return next(new ErrorResponse('File not found', 404));
  }

  const filePath = path.resolve(process.cwd(), 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return next(new ErrorResponse('File not found', 404));
  }

  res.sendFile(filePath);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
