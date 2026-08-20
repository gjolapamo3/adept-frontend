import api from './api';
import { resolveOrderReference } from '../utils/orderReference';

export const fetchOrderStatus = async (reference) => {
  const safeReference = resolveOrderReference(reference);
  if (!safeReference) {
    throw new Error('A payment reference is required.');
  }

  try {
    const encodedReference = encodeURIComponent(safeReference);
    const response = await api.get(`/api/v1/transactions/${encodedReference}`);
    return response?.data ?? response ?? null;
  } catch (error) {
    console.error('Transaction fetch failed:', error);
    throw error;
  }
};

// Backward-compatible export used by existing poller hook.
export const checkEscrowStatus = fetchOrderStatus;
