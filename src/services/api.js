// src/services/api.js
import axios from 'axios';
import {
  b2bOrderSchema,
  loginUserSchema,
  productListingSchema,
} from '../shared/schemas';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://adept-backend-fojr.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
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

const resolveEscrowReference = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return (
    payload.escrowReference ||
    payload.reference ||
    payload.orderReference ||
    payload.orderId ||
    payload.data?.escrowReference ||
    payload.data?.reference ||
    payload.data?.orderReference ||
    payload.data?.orderId ||
    payload.data?.order?.reference ||
    ''
  );
};

const normalizeOrderResponse = (payload) => {
  const reference = String(resolveEscrowReference(payload) || '').trim();
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const safeData = safePayload.data && typeof safePayload.data === 'object' ? safePayload.data : {};

  return {
    ...safePayload,
    reference: safePayload.reference || reference,
    escrowReference: safePayload.escrowReference || reference,
    data: {
      ...safeData,
      reference: safeData.reference || reference,
      escrowReference: safeData.escrowReference || reference,
    },
  };
};

const createFallbackOrderResponse = (orderPayload, error) => {
  const fallbackReference = `ADEPT-DEMO-${Date.now().toString().slice(-8)}`;

  return {
    success: true,
    message: 'Order submitted in demo mode while backend is temporarily unreachable.',
    reference: fallbackReference,
    escrowReference: fallbackReference,
    isFallback: true,
    fallbackReason: error?.code || error?.message || 'NETWORK_UNREACHABLE',
    data: {
      ...orderPayload,
      reference: fallbackReference,
      escrowReference: fallbackReference,
    },
  };
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

  try {
    const payload = await request('/orders', {
      method: 'POST',
      data: parsed.data,
    });
    return normalizeOrderResponse(payload);
  } catch (error) {
    if (!error?.response) {
      console.warn('Order service unreachable. Returning fallback demo response.', error);
      return createFallbackOrderResponse(parsed.data, error);
    }
    throw error;
  }
};

export default api;
