import { apiClient } from './client';

export async function getPublicTools({ search, category, postalCode } = {}, token = null) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'All Categories') params.append('category', category);
  if (postalCode) params.append('postalCode', postalCode);

  const query = params.toString();
  return apiClient(`/api/tools/public${query ? `?${query}` : ''}`, {
    method: 'GET',
    token: token || undefined,
  });
}

export async function getToolById(id, token = null) {
  return apiClient(`/api/tools/public/${id}`, {
    method: 'GET',
    token: token || undefined,
  });
}

export async function getTools(token) {
  return apiClient('/api/tools', {
    method: 'GET',
    token,
  });
}

export async function createTool(token, toolData) {
  return apiClient('/api/tools', {
    method: 'POST',
    token,
    body: toolData,
  });
}

export async function updateTool(token, toolId, toolData) {
  return apiClient(`/api/tools/${toolId}`, {
    method: 'PUT',
    token,
    body: toolData,
  });
}

export async function deleteTool(token, toolId) {
  return apiClient(`/api/tools/${toolId}`, {
    method: 'DELETE',
    token,
  });
}
