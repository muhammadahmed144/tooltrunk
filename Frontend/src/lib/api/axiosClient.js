import axios from 'axios';

// Get API base URL from safe browser environment variable
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Default to relative /api for local dev proxy or direct fallback
  return typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api';
};

export const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Enables HTTP-only cookies transmission
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach token from localStorage if available (hybrid cookie + bearer support)
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standardizes error formatting
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data || {};
    const message = errorData.error || errorData.message || error.message || 'An unexpected error occurred.';
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.data = errorData;
    enhancedError.errors = errorData.errors || [];
    return Promise.reject(enhancedError);
  }
);

export default axiosInstance;
