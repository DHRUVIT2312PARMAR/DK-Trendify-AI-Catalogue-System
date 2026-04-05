const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { ensureUploadDirectory, getUploadsDirectory } = require('../config/storage');

async function persistFile(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'dk-trendify',
            resource_type: 'image',
            public_id: `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          }
        );

        stream.end(file.buffer);
      });

      return {
        provider: 'cloudinary',
        path: uploadResult.secure_url,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      // Fall back to local storage if Cloudinary is unavailable or misconfigured.
    }
  }

  const uploadsDirectory = getUploadsDirectory();
  await ensureUploadDirectory(uploadsDirectory);

  const safeName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const targetPath = path.join(uploadsDirectory, safeName);
  await fs.writeFile(targetPath, file.buffer);

  return {
    provider: 'local',
    path: targetPath,
    url: `/uploads/${safeName}`,
    publicId: safeName,
  };
}

module.exports = {
  persistFile,
};
