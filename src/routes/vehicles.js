const express = require('express');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicles');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { validateVehicle } = require('../middleware/validators');

router
  .route('/')
  .get(getVehicles)
  .post(protect, authorize('admin'), validateVehicle, createVehicle);

router
  .route('/:id')
  .get(getVehicle)
  .put(protect, authorize('admin'), updateVehicle)
  .delete(protect, authorize('admin'), deleteVehicle);

module.exports = router;
