const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.uploadUserPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('No file uploaded', 400));
  }

  const userId = req.user && req.user.id ? req.user.id : null;

  if (!userId) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.profileImage) {
    const oldFilename = path.basename(user.profileImage);
    const oldPath = path.join(process.cwd(), 'uploads', oldFilename);
    fs.unlink(oldPath, err => {});
  }

  user.profileImage = `/api/v1/auth/profile-image/${req.file.filename}`;
  await user.save();

  res.status(200).json({
    message: 'Photo uploaded successfully',
    imageUrl: user.profileImage
  });
});
