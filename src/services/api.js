// src/services/api.js
import axios from 'axios';
import {
  b2bOrderSchema,
  loginUserSchema,
  productListingSchema,
} from '../shared/schemas';

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

const firstIssueMessage = (error) => {
  const issueMessage = error?.issues?.[0]?.message;
  if (issueMessage) {
    return issueMessage;
  }

  return error?.message || 'Validation failed';
};

export const loginUser = async (credentials) => {
  const parsed = loginUserSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new Error(firstIssueMessage(parsed.error));
  }

  return request('/auth/login', {
    method: 'POST',
    data: parsed.data,
  });
};

export const fetchProducts = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return request(query ? `/products?${query}` : '/products', {
    method: 'GET',
  });
};

export const createProduct = async (productData) => {
  const parsed = productListingSchema.safeParse(productData);
  if (!parsed.success) {
    throw new Error(firstIssueMessage(parsed.error));
  }

  return request('/products', {
    method: 'POST',
    data: parsed.data,
  });
};

export const placeOrder = async (orderData) => {
  const parsed = b2bOrderSchema.safeParse(orderData);
  if (!parsed.success) {
    throw new Error(firstIssueMessage(parsed.error));
  }

  return request('/orders', {
    method: 'POST',
    data: parsed.data,
  });
};

export default api;
