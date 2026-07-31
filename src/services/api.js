// Adept-Frontend/src/services/api.js

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

// Helper for authenticated header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const buildUrl = (path) => {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedPath.startsWith('/api/')) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
};

const request = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  return response.json();
};

const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, data) => request(path, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  patch: (path, data) => request(path, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// --- AUTHENTICATION ---
export const loginUser = async (credentials) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return res.json();
};

// --- MARKETPLACE / PRODUCTS ---
export const fetchProducts = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_BASE_URL}/products?${query}`);
  return res.json();
};

export const createProduct = async (productData) => {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData)
  });
  return res.json();
};

// --- ORDERS ---
export const placeOrder = async (orderData) => {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData)
  });
  return res.json();
};

export default api;
