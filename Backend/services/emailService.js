import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
let resendClient = null;

if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
}

const DEFAULT_SENDER = process.env.EMAIL_FROM || 'ToolTrunk <onboarding@resend.dev>';

export const emailService = {
  isConfigured() {
    return Boolean(resendClient);
  },

  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Email Mock (No RESEND_API_KEY)] To: ${to} | Subject: "${subject}"`);
      }
      return { success: true, mocked: true };
    }

    try {
      const data = await resendClient.emails.send({
        from: DEFAULT_SENDER,
        to,
        subject,
        html,
        text,
      });
      return { success: true, data };
    } catch (err) {
      console.error('[Email Error] Failed to send email via Resend:', err.message);
      return { success: false, error: err.message };
    }
  },

  async sendWelcomeEmail({ email, name }) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to ToolTrunk - Neighborhood Tool Sharing!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">Welcome to ToolTrunk, ${name}!</h2>
          <p>You're now part of your local neighborhood tool sharing community.</p>
          <p>With ToolTrunk, you can easily:</p>
          <ul>
            <li>Browse and borrow tools from nearby verified neighbors</li>
            <li>Lend your unused tools to earn and build community reputation</li>
            <li>Coordinate secure handovers right in your postal area</li>
          </ul>
          <p>Start exploring tools today at <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">ToolTrunk</a>.</p>
        </div>
      `,
    });
  },

  async sendRentalRequestReceived({ ownerEmail, ownerName, borrowerName, toolTitle, startDate, endDate, totalDays, totalPrice }) {
    return this.sendEmail({
      to: ownerEmail,
      subject: `New Rental Request for ${toolTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">New Rental Request!</h2>
          <p>Hi ${ownerName},</p>
          <p><strong>${borrowerName}</strong> has requested to borrow your <strong>${toolTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Rental Period:</strong> ${startDate} to ${endDate} (${totalDays} days)</p>
            <p style="margin: 4px 0;"><strong>Total Price:</strong> Rs ${totalPrice}</p>
          </div>
          <p>Please log in to your ToolTrunk dashboard to review and approve or reject this request.</p>
        </div>
      `,
    });
  },

  async sendRentalStatusUpdate({ borrowerEmail, borrowerName, toolTitle, status }) {
    const isApproved = status === 'Approved';
    return this.sendEmail({
      to: borrowerEmail,
      subject: `Rental Request ${status}: ${toolTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${isApproved ? '#059669' : '#dc2626'};">Rental Request ${status}</h2>
          <p>Hi ${borrowerName},</p>
          <p>Your rental request for <strong>${toolTitle}</strong> has been marked as <strong>${status}</strong> by the owner.</p>
          ${isApproved ? '<p>You can now proceed with payment or coordinate physical pickup through your dashboard.</p>' : '<p>Feel free to browse other available tools in your neighborhood.</p>'}
        </div>
      `,
    });
  },

  async sendPaymentConfirmation({ email, name, toolTitle, amount, bookingId }) {
    return this.sendEmail({
      to: email,
      subject: `Payment Confirmed: ${toolTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">Payment Confirmed!</h2>
          <p>Hi ${name},</p>
          <p>Your payment of <strong>$${amount}</strong> for <strong>${toolTitle}</strong> (Booking #${bookingId}) has been successfully processed.</p>
          <p>Thank you for using ToolTrunk!</p>
        </div>
      `,
    });
  },
};
