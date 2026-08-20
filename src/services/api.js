// src/services/api.js
import axios from 'axios';
import { getStoredAuthToken } from '../utils/auth';
import { resolveOrderReference } from '../utils/orderReference';
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
  timeout: 45000, // Render free tier can take ~30-40s to wake from a cold start
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = typeof localStorage !== 'undefined' ? getStoredAuthToken() : '';

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (path, options = {}) => {
  try {
    const response = await api.request({
      url: path,
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    return response.data;
  } catch (error) {
    if (error?.code === 'ECONNABORTED') {
      throw new Error('The server is taking longer than expected to respond (it may be waking up). Please try again in a moment.');
    }

    if (!error?.response) {
      throw new Error('Unable to reach the server. Please check your connection and try again.');
    }

    throw error;
  }
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
      throw new Error('Order service is unreachable. Check VITE_API_BASE_URL or VITE_API_URL and backend availability.');
    }
    throw error;
  }
};

export const fetchOrderById = async (orderId) => {
  const safeOrderId = resolveOrderReference(orderId);
  if (!safeOrderId) {
    throw new Error('An order reference is required.');
  }

  return request(`/api/orders/${encodeURIComponent(safeOrderId)}`, {
    method: 'GET',
  });
};

export default api;
