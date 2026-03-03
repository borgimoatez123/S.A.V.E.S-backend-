const express = require('express');
const {
  register,
  login,
  getMe,
  updateMe,
  updateMyPassword,
  getProfileImage,
  updateAgency,
  getAgency
} = require('../controllers/auth');
const { uploadUserPhoto } = require('../controllers/users');
const { validateRegister, validateLogin } = require('../middleware/validators');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/agency', getAgency);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, updateMyPassword);
router.post('/upload-photo', protect, upload.single('photo'), uploadUserPhoto);
router.get('/profile-image/:filename', protect, getProfileImage);
router.put('/agency', protect, authorize('admin'), updateAgency);

module.exports = router;
