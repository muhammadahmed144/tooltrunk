import { axiosInstance } from './axiosClient';

/**
 * Core API client helper for ToolTrunk
 * Uses centralized Axios client while maintaining backward compatibility with existing fetch callers.
 */
export async function apiClient(endpoint, options = {}) {
  const { token, body, headers = {}, method = (body ? 'POST' : 'GET'), ...customConfig } = options;

  // Normalize endpoint: if endpoint starts with /api/, strip it since axiosInstance baseURL already includes /api
  let cleanEndpoint = endpoint;
  if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4); // e.g. /api/auth/login -> /auth/login
  } else if (cleanEndpoint === '/api') {
    cleanEndpoint = '/';
  }

  const requestHeaders = { ...headers };
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await axiosInstance({
      url: cleanEndpoint,
      method: method.toLowerCase(),
      data: body,
      headers: requestHeaders,
      ...customConfig,
    });

    return response.data;
  } catch (err) {
    // Re-throw enhanced error so calling code catches error with .message and .status
    throw err;
  }
}
