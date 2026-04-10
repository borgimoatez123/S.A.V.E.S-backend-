const express = require('express');
const { createDriverAlert, getAllDriverAlerts, deleteDriverAlert } = require('../controllers/driverAlertController');

const router = express.Router();

router.post('/', createDriverAlert);
router.get('/', getAllDriverAlerts);
router.delete('/:id', deleteDriverAlert);

module.exports = router;
