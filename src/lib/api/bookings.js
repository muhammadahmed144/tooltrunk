import { apiClient } from './client';

export async function createBooking(token, bookingData) {
  return apiClient('/api/bookings', {
    method: 'POST',
    token,
    body: bookingData,
  });
}

export async function getBorrowerBookings(token) {
  return apiClient('/api/bookings/borrower', {
    method: 'GET',
    token,
  });
}

export async function getOwnerBookings(token) {
  return apiClient('/api/bookings/owner', {
    method: 'GET',
    token,
  });
}

export async function updateBookingStatus(token, bookingId, status) {
  return apiClient(`/api/bookings/${bookingId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function getToolAvailability(toolId) {
  return apiClient(`/api/bookings/tool/${toolId}/availability`, {
    method: 'GET',
  });
}
