import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Checks whether real Cloudinary credentials have been provided
 */
export function isCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    return false;
  }

  // Check if they are just the default placeholders from .env.example
  const placeholders = [
    'your_cloudinary_cloud_name',
    'your_cloudinary_api_key',
    'your_cloudinary_api_secret',
  ];

  if (
    placeholders.includes(CLOUDINARY_CLOUD_NAME) ||
    placeholders.includes(CLOUDINARY_API_KEY) ||
    placeholders.includes(CLOUDINARY_API_SECRET)
  ) {
    return false;
  }

  return true;
}

/**
 * Uploads an image buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer from memory storage
 * @param {Object} options - Custom Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'roomsync/listings',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export const cloudinaryService = {
  isConfigured: isCloudinaryConfigured,
  uploadToCloudinary: uploadToCloudinary,
};

export default cloudinary;
