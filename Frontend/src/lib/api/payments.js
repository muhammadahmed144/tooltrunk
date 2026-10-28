import { apiClient } from './client';

export async function createCheckoutSession(token, { bookingId, successUrl, cancelUrl }) {
  return apiClient('/api/payments/create-checkout-session', {
    method: 'POST',
    token,
    body: { bookingId, successUrl, cancelUrl },
  });
}

export async function getPaymentStatus(token, bookingId) {
  return apiClient(`/api/payments/status/${bookingId}`, {
    method: 'GET',
    token,
  });
}
