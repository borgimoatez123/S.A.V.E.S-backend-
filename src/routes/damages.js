const express = require('express');
const { createDamage } = require('../controllers/damageController');

const router = express.Router();

// POST /api/damages
router.post('/', createDamage);

module.exports = router;
