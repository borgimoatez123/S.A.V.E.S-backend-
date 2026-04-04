const express = require('express');
const { createDetection } = require('../controllers/detectionController');

const router = express.Router();

router.post('/', createDetection);

module.exports = router;
