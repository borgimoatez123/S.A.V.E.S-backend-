const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  model: {
    type: String,
    enum: ['SAVES_PROTOTYPE_V1'],
    required: [true, 'Please add a vehicle model']
  },
  variant: {
    type: String,
    enum: ['SUV', 'SEDAN'],
    required: [true, 'Please add a vehicle variant']
  },
  plateNumber: {
    type: String,
    required: [true, 'Please add a plate number'],
    unique: true
  },
  year: {
    type: Number,
    required: [true, 'Please add a year']
  },
  color: {
    type: String,
    required: [true, 'Please add a color']
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Please add price per day']
  },
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Maintenance', 'Stolen', 'Accident'],
    default: 'Available'
  },
  location: {
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  },
  images: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
