const RealtimeLocation = require('../models/RealtimeLocation');

// @desc    Store a realtime location update
// @route   POST /api/realtime-location
// @access  Public
exports.createLocation = async (req, res) => {
  try {
    const { location, timestamp } = req.body;

    if (!location || location.latitude === undefined || location.longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Missing location fields' });
    }

    const entry = await RealtimeLocation.create({
      location,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    console.log(`📍 Location received: lat=${location.latitude}, lng=${location.longitude}`);

    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('[RealtimeLocation] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all realtime location entries
// @route   GET /api/realtime-location
// @access  Public
exports.getLocations = async (req, res) => {
  try {
    const locations = await RealtimeLocation.find().sort({ timestamp: -1 });
    return res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (err) {
    console.error('[RealtimeLocation] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
