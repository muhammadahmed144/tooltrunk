import { stripeService } from '../services/stripeService.js';
import { BookingModel } from '../models/bookingModel.js';
import { ToolModel } from '../models/toolModel.js';
import { UserModel } from '../models/userModel.js';
import { emailService } from '../services/emailService.js';
import { db } from '../utils/db.js';

// Cache processed event IDs for webhook idempotency
const processedEvents = new Set();

export class PaymentController {
  /**
   * POST /api/payments/create-checkout-session
   * Creates Stripe Checkout Session for a rental booking
   */
  static async createCheckoutSession(req, res) {
    const userId = req.user?.userId;
    const { bookingId, successUrl, cancelUrl } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required.' });
    }

    try {
      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      if (booking.borrowerId !== userId) {
        return res.status(403).json({ success: false, error: 'You are not authorized to pay for this booking.' });
      }

      const tool = await ToolModel.findById(booking.toolId);
      if (!tool) {
        return res.status(404).json({ success: false, error: 'Tool not found.' });
      }

      const user = await UserModel.findById(userId);

      if (!stripeService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'Stripe payments are not configured. Please configure STRIPE_SECRET_KEY in backend environment.',
        });
      }

      const session = await stripeService.createCheckoutSession({
        booking,
        tool,
        user: user || req.user,
        successUrl,
        cancelUrl,
      });

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (err) {
      console.error('Create checkout session error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to create payment session.' });
    }
  }

  /**
   * POST /api/payments/webhook
   * Listens for Stripe webhooks and updates booking payment status with idempotency
   */
  static async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }

    let event;
    try {
      // req.rawBody must be preserved for signature verification
      const rawBody = req.rawBody || req.body;
      event = stripeService.constructWebhookEvent(rawBody, sig);
    } catch (err) {
      console.error('Stripe webhook verification error:', err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    // Idempotency check: prevent duplicate event processing
    if (processedEvents.has(event.id)) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    processedEvents.add(event.id);
    if (processedEvents.size > 1000) {
      // Clear older entries
      const firstEntry = processedEvents.values().next().value;
      processedEvents.delete(firstEntry);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId || session.client_reference_id;

      if (bookingId) {
        try {
          const booking = await BookingModel.findById(bookingId);
          if (booking) {
            // Update payment record in database
            await db.run(
              'UPDATE bookings SET updated_at = ? WHERE id = ?',
              [new Date().toISOString(), bookingId]
            );

            // Send payment confirmation email asynchronously
            const recipientEmail = session.customer_email || booking.borrowerEmail;
            const recipientName = booking.borrowerName || 'Neighbor';
            emailService.sendPaymentConfirmation({
              email: recipientEmail,
              name: recipientName,
              toolTitle: booking.toolTitle,
              amount: booking.totalPrice,
              bookingId: booking.id,
            }).catch(() => {});

            console.log(`✅ Stripe payment verified for booking ${bookingId}`);
          }
        } catch (dbErr) {
          console.error(`Error updating booking ${bookingId} after payment:`, dbErr);
        }
      }
    }

    return res.status(200).json({ received: true });
  }

  /**
   * GET /api/payments/status/:bookingId
   * Checks payment status of a booking
   */
  static async getPaymentStatus(req, res) {
    const { bookingId } = req.params;
    try {
      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      return res.status(200).json({
        success: true,
        bookingId: booking.id,
        status: booking.status,
        totalPrice: booking.totalPrice,
      });
    } catch (err) {
      console.error('Get payment status error:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve payment status.' });
    }
  }
}
