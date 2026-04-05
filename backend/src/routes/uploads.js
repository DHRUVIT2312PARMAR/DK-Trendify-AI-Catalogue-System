const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { analyzeSingle } = require('../controllers/analysisController');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { getUploadsDirectory } = require('../config/storage');

const uploadsRouter = express.Router();
const uploadDirectory = getUploadsDirectory();
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      callback(new Error('Only JPG, JPEG, PNG, and WEBP files are supported.'));
      return;
    }

    callback(null, true);
  },
});

uploadsRouter.post('/analyze', requireAuth, uploadLimiter, upload.single('image'), analyzeSingle);

module.exports = {
  uploadsRouter,
};
