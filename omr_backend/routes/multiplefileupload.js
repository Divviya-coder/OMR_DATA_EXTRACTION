const express = require('express');
const { uploadFiles } = require('../controllers/fileupload');
const router = express.Router();

// File upload route
router.post('/images', uploadFiles);

module.exports = router;
