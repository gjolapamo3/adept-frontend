// src/services/api.js
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://adept-backend-fojr.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (path, options = {}) => {
  const response = await api.request({
    url: path,
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  return response.data;
};

export const loginUser = async (credentials) => request('/auth/login', {
  method: 'POST',
  data: credentials,
});

export const fetchProducts = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return request(query ? `/products?${query}` : '/products', {
    method: 'GET',
  });
};

export const createProduct = async (productData) => request('/products', {
  method: 'POST',
  data: productData,
});

export const placeOrder = async (orderData) => request('/orders', {
  method: 'POST',
  data: orderData,
});

export default api;
