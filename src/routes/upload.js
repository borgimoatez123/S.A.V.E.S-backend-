const express = require('express');
const { receiveImage, listImages, getImage } = require('../controllers/uploadController');

const router = express.Router();

// Raw binary handled globally in server.js via express.raw()
router.post('/', receiveImage);

// GET /api/upload              → list all saved images
// GET /api/upload/:filename    → download/view a specific image
router.get('/', listImages);
router.get('/:filename', getImage);

module.exports = router;
