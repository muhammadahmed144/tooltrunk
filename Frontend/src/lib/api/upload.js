import { axiosInstance } from './axiosClient';

export async function uploadToolImage(token, file) {
  const formData = new FormData();
  formData.append('image', file);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await axiosInstance.post('/upload/tool-image', formData, {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function uploadAvatar(token, file) {
  const formData = new FormData();
  formData.append('image', file);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await axiosInstance.post('/upload/avatar', formData, {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
