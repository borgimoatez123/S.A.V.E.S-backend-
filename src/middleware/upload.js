const multer = require('multer');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads');
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const filename = `user_${timestamp}${ext}`;
    cb(null, filename);
  }
});

function fileFilter(req, file, cb) {
  const allowedMime = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedMime.includes(file.mimetype)) {
    return cb(new ErrorResponse('Only image files (jpg, jpeg, png) are allowed', 400));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;
