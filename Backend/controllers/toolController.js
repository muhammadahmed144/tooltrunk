import { ToolModel } from '../models/toolModel.js';
import { BookingModel } from '../models/bookingModel.js';
import { UserModel } from '../models/userModel.js';
import { verifyJwt } from '../utils/jwt.js';
import { redisService } from '../services/redisService.js';

function extractUserId(req) {
  // Check cookie first
  if (req.cookies && req.cookies.token) {
    const decoded = verifyJwt(req.cookies.token);
    if (decoded?.userId) return decoded.userId;
  }

  // Check Bearer header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const decoded = verifyJwt(token);
  return decoded?.userId || null;
}

export class ToolController {
  /**
   * GET /api/tools/public
   * Public discovery endpoint for guests & users with search, category, and postal code filter.
   * SRS Rule: Guests cannot view owner personal details.
   */
  static async getPublicTools(req, res) {
    const { search, category, postalCode } = req.query;
    const requesterId = extractUserId(req);

    // Redis Cache lookup
    const cacheKey = `tools:public:${search || ''}:${category || ''}:${postalCode || ''}:${requesterId ? 'member' : 'guest'}`;
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    try {
      const tools = await ToolModel.findPublic({ search, category, postalCode });

      // If guest, strip owner information from listings
      const sanitizedTools = tools.map((t) => {
        if (!requesterId) {
          const { ownerId: _, ownerName: _2, ownerAvatar: _3, ...guestTool } = t;
          return guestTool;
        }
        return t;
      });

      const responsePayload = { success: true, tools: sanitizedTools };

      // Cache for 2 minutes
      await redisService.set(cacheKey, responsePayload, 120);

      return res.status(200).json(responsePayload);
    } catch (err) {
      console.error('Get public tools error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Error fetching public tool listings.' });
    }
  }

  /**
   * GET /api/tools/public/:id
   * Tool details view with specifications.
   * SRS Rule: Guests cannot view owner details.
   */
  static async getToolById(req, res) {
    const { id } = req.params;
    const requesterId = extractUserId(req);

    // Redis Cache lookup
    const cacheKey = `tool:detail:${id}:${requesterId ? 'member' : 'guest'}`;
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    try {
      const tool = await ToolModel.findById(id);
      if (!tool) {
        return res.status(404).json({ success: false, error: 'Tool listing not found.' });
      }

      // If requester is not authenticated (Guest), strictly hide owner details
      if (!requesterId) {
        const { ownerId: _, ownerName: _2, ownerAvatar: _3, ...guestTool } = tool;
        const responsePayload = {
          success: true,
          tool: {
            ...guestTool,
            owner: null,
            isGuest: true,
          },
        };
        await redisService.set(cacheKey, responsePayload, 300);
        return res.status(200).json(responsePayload);
      }

      // If tool has an ownerId and requester is authenticated, attach owner details
      let ownerInfo = {
        name: tool.ownerName || 'Tool Owner',
        memberSince: tool.ownerMemberSince || 'Apr 2024',
        rating: tool.ownerRating || 4.8,
        reviewsCount: tool.ownerReviewsCount || 12,
        avatarUrl: tool.ownerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      };

      if (tool.ownerId) {
        const ownerUser = await UserModel.findById(tool.ownerId);
        if (ownerUser) {
          ownerInfo = {
            name: ownerUser.fullName || ownerInfo.name,
            memberSince: ownerUser.createdAt ? new Date(ownerUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ownerInfo.memberSince,
            rating: ownerUser.reputation ? Math.min(5, (4 + (ownerUser.reputation / 200))).toFixed(1) : ownerInfo.rating,
            reviewsCount: ownerUser.reputationHistory?.length || ownerInfo.reviewsCount,
            avatarUrl: ownerUser.avatarUrl || ownerInfo.avatarUrl,
          };
        }
      }

      const responsePayload = {
        success: true,
        tool: {
          ...tool,
          owner: ownerInfo,
          isGuest: false,
        },
      };

      await redisService.set(cacheKey, responsePayload, 300);
      return res.status(200).json(responsePayload);
    } catch (err) {
      console.error('Get tool by id error:', err);
      return res.status(500).json({ success: false, error: 'Error fetching tool details.' });
    }
  }

  /**
   * GET /api/tools
   * Fetches all tools owned by the authenticated user.
   */
  static async getTools(req, res) {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    try {
      const tools = await ToolModel.findByOwner(ownerId);
      return res.status(200).json({ success: true, tools });
    } catch (err) {
      console.error('Get tools controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error fetching tools.' });
    }
  }

  /**
   * POST /api/tools
   * Creates a new tool and registers it to the authenticated user's shelf.
   */
  static async createTool(req, res) {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    const {
      name,
      title,
      category,
      pricePerDay,
      dailyPoints,
      description,
      features,
      imageUrl,
      images,
      postalCode,
      location,
    } = req.body;

    const toolName = name || title;
    if (!toolName || typeof toolName !== 'string' || toolName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Tool name must be at least 2 characters.' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ success: false, error: 'Category is required.' });
    }

    const price = Number(pricePerDay || dailyPoints || 500);
    if (isNaN(price) || price < 1) {
      return res.status(400).json({ success: false, error: 'Price per day must be a valid positive number.' });
    }

    try {
      const ownerUser = await UserModel.findById(ownerId);

      const newTool = await ToolModel.create({
        ownerId,
        ownerName: ownerUser?.fullName || 'Tool Owner',
        ownerAvatar: ownerUser?.avatarUrl || '',
        postalCode: postalCode || ownerUser?.postalCode || '75000',
        location: location || `${ownerUser?.postalCode || '75000'}`,
        name: toolName.trim(),
        title: toolName.trim(),
        category: category.trim(),
        pricePerDay: price,
        dailyPoints: price,
        description: typeof description === 'string' ? description.trim() : '',
        features: Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []),
        imageUrl: imageUrl || (Array.isArray(images) && images[0]) || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
        images: Array.isArray(images) && images.length > 0 ? images : [imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'],
      });

      // Invalidate Redis caches
      await redisService.invalidateToolCache(newTool.id);

      return res.status(201).json({
        success: true,
        message: `"${newTool.name}" successfully added to your listings!`,
        tool: newTool,
      });
    } catch (err) {
      console.error('Create tool controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error creating tool.' });
    }
  }

  /**
   * PUT /api/tools/:id
   * Updates a tool's details. Constraint: Cannot edit if active or pending bookings exist.
   */
  static async updateTool(req, res) {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    const { id } = req.params;
    const { name, title, category, status, pricePerDay, dailyPoints, description, features, imageUrl, images } = req.body;

    const existing = await ToolModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tool not found.' });
    }
    if (existing.ownerId !== ownerId) {
      return res.status(403).json({ success: false, error: 'You are not authorized to update this tool.' });
    }

    // Constraint: check if any pending or active bookings exist
    const activeCount = await BookingModel.countActiveByTool(id);
    if (activeCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update tool while there are active or pending bookings.',
      });
    }

    const updates = {};
    const toolName = name || title;
    if (toolName && typeof toolName === 'string' && toolName.trim().length >= 2) {
      updates.name = toolName.trim();
      updates.title = toolName.trim();
    }
    if (category && typeof category === 'string') {
      updates.category = category.trim();
    }
    if (status && ['available', 'lent', 'inactive'].includes(status)) {
      updates.status = status;
    }
    const price = Number(pricePerDay || dailyPoints);
    if (!isNaN(price) && price >= 1) {
      updates.pricePerDay = price;
      updates.dailyPoints = price;
    }
    if (typeof description === 'string') {
      updates.description = description.trim();
    }
    if (Array.isArray(features)) {
      updates.features = features;
    }
    if (imageUrl) {
      updates.imageUrl = imageUrl;
    }
    if (Array.isArray(images)) {
      updates.images = images;
    }

    try {
      const updatedTool = await ToolModel.update(id, ownerId, updates);

      // Invalidate Redis cache
      await redisService.invalidateToolCache(id);

      return res.status(200).json({
        success: true,
        message: 'Tool updated successfully!',
        tool: updatedTool,
      });
    } catch (err) {
      console.error('Update tool controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error updating tool.' });
    }
  }

  /**
   * DELETE /api/tools/:id
   * Permanently removes a tool. Constraint: Cannot delete if active or pending bookings exist.
   */
  static async deleteTool(req, res) {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    const { id } = req.params;

    const existing = await ToolModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tool not found.' });
    }
    if (existing.ownerId !== ownerId) {
      return res.status(403).json({ success: false, error: 'You are not authorized to delete this tool.' });
    }

    // Constraint: check if any pending or active bookings exist
    const activeCount = await BookingModel.countActiveByTool(id);
    if (activeCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tool while there are active or pending bookings.',
      });
    }

    try {
      const deleted = await ToolModel.delete(id, ownerId);
      if (!deleted) {
        return res.status(500).json({ success: false, error: 'Failed to delete tool.' });
      }

      // Invalidate Redis cache
      await redisService.invalidateToolCache(id);

      return res.status(200).json({
        success: true,
        message: `"${existing.name}" has been removed from your shelf.`,
      });
    } catch (err) {
      console.error('Delete tool controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error deleting tool.' });
    }
  }
}
