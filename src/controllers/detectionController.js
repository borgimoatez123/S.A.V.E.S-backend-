const Detection = require('../models/Detection');

// @desc    Receive and store a traffic sign detection
// @route   POST /api/detections
// @access  Public (local prototype)
exports.createDetection = async (req, res) => {
  try {
    const { label, confidence, isStop, timestamp } = req.body;

    // Basic validation
    if (!label || confidence === undefined || isStop === undefined || !timestamp) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const detection = await Detection.create({ label, confidence, isStop, timestamp });

    // Console feedback
    if (isStop) {
      console.log('🚨 STOP SIGN DETECTED');
    } else {
      console.log(`Detection received: ${label}`);
    }

    return res.status(201).json({ success: true, data: detection });
  } catch (err) {
    console.error('[Detection] Error saving detection:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
