// Adept-Frontend/src/services/api.js

const resolveApiBaseUrl = () => {
  const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const configuredUrl =
    viteEnv?.VITE_API_URL ||
    viteEnv?.VITE_BACKEND_URL ||
    viteEnv?.VITE_API_BASE_URL ||
    (typeof process !== 'undefined'
      ? process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL
      : '') ||
    '/api';

  return configuredUrl.endsWith('/') ? configuredUrl.slice(0, -1) : configuredUrl;
};

const API_BASE_URL = resolveApiBaseUrl();

if (typeof console !== 'undefined') {
  const usingFallback = API_BASE_URL === '/api' || API_BASE_URL.includes('localhost');
  const message = `[api] Base URL resolved to: ${API_BASE_URL}`;
  if (usingFallback) {
    console.warn(`${message} (fallback/local value detected)`);
  } else {
    console.info(message);
  }
}

// Helper for authenticated header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const buildUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

  if (normalizedBase.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
};

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
};

const request = async (path, options = {}) => {
  const url = buildUrl(path);

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch (networkError) {
    throw new Error(
      `Failed to reach API at ${url}. Verify VITE_API_URL (or VITE_BACKEND_URL) and backend CORS settings.`
    );
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `Request failed (${response.status} ${response.statusText})`
    );
  }

  return payload;
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
  return api.post('/auth/login', credentials);
};

// --- MARKETPLACE / PRODUCTS ---
export const fetchProducts = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return api.get(query ? `/products?${query}` : '/products');
};

export const createProduct = async (productData) => {
  return api.post('/products', productData);
};

// --- ORDERS ---
export const placeOrder = async (orderData) => {
  return api.post('/orders', orderData);
};

export default api;
