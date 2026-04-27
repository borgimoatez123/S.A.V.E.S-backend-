const express = require('express');
const router = express.Router();
const { createLocation, getLocations } = require('../controllers/realtimeLocationController');

router.route('/').post(createLocation).get(getLocations);

module.exports = router;
