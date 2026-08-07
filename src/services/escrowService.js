import api from './api';

export const fetchOrderStatus = async (reference) => {
  if (!reference) {
    throw new Error('A payment reference is required.');
  }

  try {
    const safeReference = encodeURIComponent(reference);
    const response = await api.get(`/api/v1/transactions/${safeReference}`);
    return response?.data ?? response ?? null;
  } catch (error) {
    console.error('Transaction fetch failed:', error);
    throw error;
  }
};

// Backward-compatible export used by existing poller hook.
export const checkEscrowStatus = fetchOrderStatus;
