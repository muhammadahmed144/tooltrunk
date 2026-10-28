import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeInstance = null;

if (stripeSecretKey) {
  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
}

export const stripeService = {
  isConfigured() {
    return Boolean(stripeInstance);
  },

  getClient() {
    return stripeInstance;
  },

  /**
   * Create a Stripe Checkout Session for a tool rental booking
   */
  async createCheckoutSession({ booking, tool, user, successUrl, cancelUrl }) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your backend environment.');
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const finalSuccessUrl = successUrl || `${clientUrl}/dashboard?payment=success&bookingId=${booking.id}`;
    const finalCancelUrl = cancelUrl || `${clientUrl}/dashboard?payment=cancelled&bookingId=${booking.id}`;

    // Price in cents (or smallest currency unit). If in PKR, Stripe supports PKR in rupees or cents depending on currency config; for USD/CAD, multiply by 100
    const currency = (process.env.CURRENCY || 'usd').toLowerCase();
    const unitAmount = Math.round(Number(booking.totalPrice) * 100);

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email || booking.borrowerEmail,
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
        toolId: tool.id,
        ownerId: tool.ownerId,
        borrowerId: booking.borrowerId,
        totalDays: String(booking.totalDays),
      },
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Tool Rental: ${tool.name || tool.title}`,
              description: `Rental from ${booking.startDate} to ${booking.endDate} (${booking.totalDays} days)`,
              images: tool.imageUrl ? [tool.imageUrl] : [],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    });

    return session;
  },

  /**
   * Construct and verify webhook event using Stripe Webhook Secret
   */
  constructWebhookEvent(rawBody, signature) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured in backend environment.');
    }

    return stripeInstance.webhooks.constructEvent(rawBody, signature, webhookSecret);
  },
};
