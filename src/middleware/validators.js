const { check, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

exports.validateRegister = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  validate
];

exports.validateLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  validate
];

exports.validateVehicle = [
  check('model', 'Model is required').isIn(['SAVES_PROTOTYPE_V1', 'SAVES_miniPROTOTYPE_V1']),
  check('variant', 'Variant is required').isIn(['SUV', 'SEDAN']),
  check('plateNumber', 'Plate number is required').not().isEmpty(),
  check('year', 'Year is required').isNumeric(),
  check('color', 'Color is required').not().isEmpty(),
  check('pricePerDay', 'Price per day is required').isNumeric(),
  check('location.city', 'City is required').not().isEmpty(),
  validate
];

exports.validateBooking = [
  check('vehicle', 'Vehicle ID is required').isMongoId(),
  check('startDate', 'Start date is required').isISO8601(),
  check('endDate', 'End date is required').isISO8601(),
  check('pickupLocation', 'Pickup location is required').not().isEmpty(),
  check('returnLocation', 'Return location is required').not().isEmpty(),
  validate
];
