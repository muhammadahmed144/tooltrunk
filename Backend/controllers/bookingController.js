import { BookingModel } from '../models/bookingModel.js';
import { ToolModel } from '../models/toolModel.js';
import { UserModel } from '../models/userModel.js';
import { emailService } from '../services/emailService.js';
import { redisService } from '../services/redisService.js';

export class BookingController {
  /**
   * POST /api/bookings
   * Creates a rental request (Borrower action)
   */
  static async createBooking(req, res) {
    const borrowerId = req.user?.userId;
    if (!borrowerId) {
      return res.status(401).json({ success: false, error: 'Authentication required to submit booking.' });
    }

    const { toolId, startDate, endDate } = req.body;

    if (!toolId || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Tool ID, start date, and end date are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Validate format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ success: false, error: 'Dates must be in valid YYYY-MM-DD format.' });
    }

    if (startDate < todayStr) {
      return res.status(400).json({ success: false, error: 'Rental start date cannot be in the past.' });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ success: false, error: 'Rental end date must be after the start date (minimum 1 day rental).' });
    }

    try {
      const tool = await ToolModel.findById(toolId);
      if (!tool) {
        return res.status(404).json({ success: false, error: 'Tool not found.' });
      }

      if (tool.ownerId === borrowerId) {
        return res.status(400).json({ success: false, error: 'You cannot book your own tool.' });
      }

      const borrower = await UserModel.findById(borrowerId);
      const owner = await UserModel.findById(tool.ownerId);

      const pricePerDay = Number(tool.pricePerDay || tool.dailyPoints || 800);

      // Atomic creation with immediate lock to eliminate race conditions
      const booking = await BookingModel.createAtomic({
        toolId: tool.id,
        toolTitle: tool.name || tool.title || 'Power Tool',
        toolImage: tool.imageUrl || (tool.images && tool.images[0]) || tool.image || '',
        pricePerDay,
        ownerId: tool.ownerId,
        ownerName: owner?.fullName || tool.ownerName || 'Tool Owner',
        borrowerId,
        borrowerName: borrower?.fullName || req.user?.email || 'Neighbor Borrower',
        borrowerEmail: borrower?.email || req.user?.email || '',
        borrowerPostalCode: borrower?.postalCode || '',
        startDate,
        endDate,
      });

      // Send email to owner asynchronously
      if (owner?.email) {
        emailService.sendRentalRequestReceived({
          ownerEmail: owner.email,
          ownerName: owner.fullName,
          borrowerName: booking.borrowerName,
          toolTitle: booking.toolTitle,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalDays: booking.totalDays,
          totalPrice: booking.totalPrice,
        }).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: 'Rental booking request submitted successfully!',
        booking,
      });
    } catch (err) {
      console.error('Create booking error:', err);
      const status = err.status || 500;
      return res.status(status).json({ success: false, error: err.message || 'Internal server error creating booking.' });
    }
  }

  /**
   * GET /api/bookings/borrower
   * Fetches all bookings made by the authenticated user
   */
  static async getBorrowerBookings(req, res) {
    const borrowerId = req.user?.userId;
    if (!borrowerId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    try {
      const bookings = await BookingModel.findByBorrower(borrowerId);
      return res.status(200).json({ success: true, bookings });
    } catch (err) {
      console.error('Get borrower bookings error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch bookings.' });
    }
  }

  /**
   * GET /api/bookings/owner
   * Fetches all incoming requests for tools owned by authenticated user
   */
  static async getOwnerBookings(req, res) {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    try {
      const bookings = await BookingModel.findByOwner(ownerId);
      return res.status(200).json({ success: true, bookings });
    } catch (err) {
      console.error('Get owner bookings error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch incoming requests.' });
    }
  }

  /**
   * PATCH /api/bookings/:id/status
   * Transitions booking state:
   * - Pending -> Approved / Rejected (Owner only)
   * - Approved -> Borrowed ("Confirm Handover" - Owner only)
   * - Borrowed -> Returned ("Mark as Returned" - Owner only)
   */
  static async updateStatus(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStates = ['Pending', 'Approved', 'Rejected', 'Borrowed', 'Returned'];
    if (!status || !validStates.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStates.join(', ')}` });
    }

    try {
      const booking = await BookingModel.findById(id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      const isOwner = booking.ownerId === userId;

      // SRS: Only the tool owner can accept, reject, confirm handover, or mark as returned
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Only the tool owner is authorized to manage booking status.' });
      }

      // State machine transition validation
      const current = booking.status;

      if (current === 'Pending') {
        if (!['Approved', 'Rejected'].includes(status)) {
          return res.status(400).json({ success: false, error: `Cannot transition from Pending to ${status}. Only 'Approved' or 'Rejected' allowed.` });
        }

        // When approving, strictly verify that no other Approved or Borrowed booking conflicts
        if (status === 'Approved') {
          const hasConflict = await BookingModel.hasApprovedCollision(
            booking.toolId,
            booking.startDate,
            booking.endDate,
            booking.id
          );
          if (hasConflict) {
            return res.status(409).json({
              success: false,
              error: 'Cannot approve booking: dates conflict with an existing approved rental.',
            });
          }

          // Auto-reject any other pending requests for the tool that overlap with these approved dates
          await BookingModel.autoRejectConflictingPending(
            booking.toolId,
            booking.startDate,
            booking.endDate,
            booking.id
          );
        }
      } else if (current === 'Approved') {
        if (status !== 'Borrowed') {
          return res.status(400).json({ success: false, error: `Cannot transition from Approved to ${status}. Only 'Borrowed' (Confirm Handover) is allowed.` });
        }
      } else if (current === 'Borrowed') {
        if (status !== 'Returned') {
          return res.status(400).json({ success: false, error: `Cannot transition from Borrowed to ${status}. Only 'Returned' is allowed.` });
        }
      } else if (current === 'Returned' || current === 'Rejected') {
        return res.status(400).json({ success: false, error: `Booking is already in a terminal state (${current}).` });
      }

      const updated = await BookingModel.updateStatus(id, status);

      // Invalidate tool cache since availability changed
      await redisService.invalidateToolCache(booking.toolId);

      // Notify borrower via email asynchronously
      if (booking.borrowerEmail) {
        emailService.sendRentalStatusUpdate({
          borrowerEmail: booking.borrowerEmail,
          borrowerName: booking.borrowerName,
          toolTitle: booking.toolTitle,
          status,
        }).catch(() => {});
      }

      // If marked as Returned, grant reputation points
      if (status === 'Returned') {
        try {
          await UserModel.addReputation(booking.ownerId, 15, `Completed tool rental for ${booking.toolTitle}`);
          await UserModel.addReputation(booking.borrowerId, 10, `Safely returned ${booking.toolTitle}`);
        } catch {
          // Non-blocking reputation update
        }
      }

      return res.status(200).json({
        success: true,
        message: `Booking successfully transitioned to ${status}!`,
        booking: updated,
      });
    } catch (err) {
      console.error('Update booking status error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to update booking status.' });
    }
  }

  /**
   * GET /api/bookings/tool/:toolId/availability
   * Public endpoint returning booked/locked dates for a tool
   */
  static async getToolAvailability(req, res) {
    const { toolId } = req.params;
    try {
      const ranges = await BookingModel.getToolLockedRanges(toolId);
      return res.status(200).json({ success: true, bookedRanges: ranges });
    } catch (err) {
      console.error('Get tool availability error:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve availability.' });
    }
  }
}
