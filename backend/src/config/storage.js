const path = require('path');
const fs = require('fs/promises');

async function ensureUploadDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

function getUploadsDirectory() {
  return process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
}

module.exports = {
  ensureUploadDirectory,
  getUploadsDirectory,
};
