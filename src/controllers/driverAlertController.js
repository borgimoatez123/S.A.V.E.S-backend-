const DriverAlert = require('../models/DriverAlert');

// @desc    Receive and store a driver alert
// @route   POST /api/driver-alerts
exports.createDriverAlert = async (req, res) => {
  try {
    const { alert_type, ear, mar, angle, duration_s } = req.body;

    if (!alert_type) {
      return res.status(400).json({ success: false, message: 'alert_type is required' });
    }

    const alert = await DriverAlert.create({ alert_type, ear, mar, angle, duration_s });
    console.log(`[DriverAlert] ${alert.alert_type} — duration: ${alert.duration_s}s`);
    return res.status(201).json({ success: true, data: alert });
  } catch (err) {
    console.error('[DriverAlert] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all driver alerts
// @route   GET /api/driver-alerts
exports.getAllDriverAlerts = async (req, res) => {
  try {
    const alerts = await DriverAlert.find().sort({ timestamp: -1 });
    return res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    console.error('[DriverAlert] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a driver alert
// @route   DELETE /api/driver-alerts/:id
exports.deleteDriverAlert = async (req, res) => {
  try {
    const alert = await DriverAlert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    return res.status(200).json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    console.error('[DriverAlert] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
