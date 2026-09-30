import { apiClient } from './client';

export async function loginUser(credentials) {
  return apiClient('/api/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export async function registerUser(userData) {
  return apiClient('/api/auth/register', {
    method: 'POST',
    body: userData,
  });
}

export async function getCurrentUser(token) {
  return apiClient('/api/auth/me', {
    method: 'GET',
    token,
  });
}

export async function updateProfile(token, profileData) {
  return apiClient('/api/profile/update', {
    method: 'POST',
    token,
    body: profileData,
  });
}

export async function deleteAccount(token) {
  return apiClient('/api/auth/profile/delete', {
    method: 'DELETE',
    token,
  });
}

export async function addReputation(token, description, points) {
  return apiClient('/api/reputation/add', {
    method: 'POST',
    token,
    body: { description, points: Number(points) },
  });
}
