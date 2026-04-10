const mongoose = require('mongoose');

const DriverAlertSchema = new mongoose.Schema({
  alert_type: {
    type: String,
    enum: ['YEUX_FERMES', 'BAILLEMENT', 'TETE_PENCHEE'],
    required: [true, 'alert_type is required'],
  },
  ear:        { type: Number },
  mar:        { type: Number },
  angle:      { type: Number },
  duration_s: { type: Number },
  timestamp:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('DriverAlert', DriverAlertSchema);
