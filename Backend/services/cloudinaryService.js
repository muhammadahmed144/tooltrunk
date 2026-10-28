import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure Multer memory storage
const storage = multer.memoryStorage();

// File filter: accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

export const cloudinaryService = {
  isConfigured() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  },

  /**
   * Upload buffer to Cloudinary
   */
  async uploadImageBuffer(buffer, folder = 'tooltrunk/tools') {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary credentials are not configured in environment variables.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  },

  /**
   * Delete image from Cloudinary by publicId
   */
  async deleteImage(publicId) {
    if (!this.isConfigured() || !publicId) return null;
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('Cloudinary delete error:', err.message);
      return null;
    }
  },
};
