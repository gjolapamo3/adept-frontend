import api from './api';

export const fetchOrderStatus = async (reference) => {
  if (!reference) {
    throw new Error('A payment reference is required.');
  }

  const safeReference = encodeURIComponent(reference);

  try {
    // Primary lookup on transactions route where Monnify webhook records live.
    const response = await api.get(`/api/v1/transactions/${safeReference}`);
    return response?.data ?? response ?? null;
  } catch (error) {
    // Fallback to legacy escrow endpoint if transactions route is unavailable.
    try {
      const fallbackResponse = await api.get(`/api/v1/escrow/orders/${safeReference}`);
      return fallbackResponse?.data ?? fallbackResponse ?? null;
    } catch (fallbackError) {
      throw error;
    }
  }
};

// Backward-compatible export used by existing poller hook.
export const checkEscrowStatus = fetchOrderStatus;
