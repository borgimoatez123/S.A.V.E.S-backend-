const mongoose = require('mongoose');

const DetectionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Label is required'],
    trim: true,
  },
  confidence: {
    type: Number,
    required: [true, 'Confidence is required'],
    min: [0, 'Confidence must be >= 0'],
    max: [1, 'Confidence must be <= 1'],
  },
  isStop: {
    type: Boolean,
    required: true,
    default: false,
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Detection', DetectionSchema);
