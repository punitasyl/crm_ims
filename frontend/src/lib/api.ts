import axios from 'axios';

// Get API URL from environment variable
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Ensure baseURL ends with /api (without trailing slash)
// If NEXT_PUBLIC_API_URL is set to https://crmims-production.up.railway.app
// it will become https://crmims-production.up.railway.app/api
let baseURL = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
// Remove trailing slash to avoid 307 redirects
baseURL = baseURL.replace(/\/$/, '');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Debug: Log request URL in development
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'Full URL:', config.baseURL + config.url);
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

