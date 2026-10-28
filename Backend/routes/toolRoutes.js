import { Router } from 'express';
import { ToolController } from '../controllers/toolController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export const toolRouter = Router();

// Public routes: Guests & users can browse listings and view details
toolRouter.get('/public', ToolController.getPublicTools);
toolRouter.get('/public/:id', ToolController.getToolById);

// Protected routes require authentication
toolRouter.use(authMiddleware);

// GET /api/tools — list all tools owned by current user
toolRouter.get('/', ToolController.getTools);

// POST /api/tools — create a new tool
toolRouter.post('/', ToolController.createTool);

// PUT /api/tools/:id — update a specific tool
toolRouter.put('/:id', ToolController.updateTool);

// DELETE /api/tools/:id — remove a tool from the shelf
toolRouter.delete('/:id', ToolController.deleteTool);
