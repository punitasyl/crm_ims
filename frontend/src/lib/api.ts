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
  // Add trailing slash for root routes (e.g., /products, /customers) to avoid 307 redirects
  // FastAPI routes with @router.get("/") expect trailing slash
  // But don't add for specific endpoints (e.g., /auth/login, /auth/register)
  if (config.url) {
    const [path, query] = config.url.split('?');
    const pathParts = path.split('/').filter(p => p); // Remove empty parts
    
    // Add trailing slash if:
    // 1. Path has exactly 1 segment (root route like /products, /customers)
    // 2. Path doesn't already end with /
    // 3. Path doesn't end with a number (ID like /products/123)
    if (pathParts.length === 1 && !path.endsWith('/') && !path.match(/\/\d+$/)) {
      config.url = query ? `${path}/?${query}` : `${path}/`;
    }
  }
  
  // Debug: Log request URL in development
  if (process.env.NODE_ENV === 'development') {
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url || ''}` : config.url;
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'Full URL:', fullUrl);
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

