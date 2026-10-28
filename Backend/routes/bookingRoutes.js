import { Router } from 'express';
import { BookingController } from '../controllers/bookingController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export const bookingRouter = Router();

// Public route to view calendar availability for any tool
bookingRouter.get('/tool/:toolId/availability', BookingController.getToolAvailability);

// Protected routes require authentication
bookingRouter.use(authMiddleware);

// POST /api/bookings - create rental booking request
bookingRouter.post('/', BookingController.createBooking);

// GET /api/bookings/borrower - list rentals for borrower
bookingRouter.get('/borrower', BookingController.getBorrowerBookings);

// GET /api/bookings/owner - list incoming requests for owner
bookingRouter.get('/owner', BookingController.getOwnerBookings);

// PATCH /api/bookings/:id/status - transition booking state
bookingRouter.patch('/:id/status', BookingController.updateStatus);
