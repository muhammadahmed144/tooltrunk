import { Router } from 'express';
import { upload, cloudinaryService } from '../services/cloudinaryService.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export const uploadRouter = Router();

/**
 * POST /api/upload/tool-image
 * Uploads tool photo to Cloudinary
 */
uploadRouter.post('/tool-image', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please provide an image file to upload.' });
  }

  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cloudinary is not configured in backend environment variables.',
      });
    }

    const result = await cloudinaryService.uploadImageBuffer(req.file.buffer, 'tooltrunk/tools');
    return res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (err) {
    console.error('Cloudinary tool image upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Image upload failed.' });
  }
});

/**
 * POST /api/upload/avatar
 * Uploads user profile photo to Cloudinary
 */
uploadRouter.post('/avatar', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please provide an image file to upload.' });
  }

  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cloudinary is not configured in backend environment variables.',
      });
    }

    const result = await cloudinaryService.uploadImageBuffer(req.file.buffer, 'tooltrunk/avatars');
    return res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (err) {
    console.error('Cloudinary avatar upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Avatar upload failed.' });
  }
});
