const express = require('express');
const { fetchFromUrl } = require('../controllers/compareController');

const router = express.Router();

router.post('/url', fetchFromUrl);

module.exports = router;