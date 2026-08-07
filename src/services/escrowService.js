import api from './api';

/**
 * Fetch latest escrow order status by payment reference.
 * @param {string} reference
 * @returns {Promise<object|null>}
 */
export const checkEscrowStatus = async (reference) => {
  if (!reference) {
    throw new Error('A payment reference is required.');
  }

  const safeReference = encodeURIComponent(reference);
  try {
    const response = await api.get(`/api/v1/escrow/orders/${safeReference}`);
    return response?.data ?? response ?? null;
  } catch (primaryRouteError) {
    const response = await api.get(`/api/v1/transactions/${safeReference}`);
    return response?.data ?? response ?? null;
  }
};
