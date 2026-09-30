/**
 * Core API client helper for ToolTrunk
 */
export async function apiClient(endpoint, options = {}) {
  const { token, body, headers = {}, ...customConfig } = options;

  const config = {
    method: options.method || (body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && typeof body === 'object') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
