import { useState, useEffect, useRef, useCallback } from 'react';
import { checkEscrowStatus } from '../services/escrowService';
import { resolveOrderReference } from '../utils/orderReference';

const TERMINAL_STATUSES = new Set([
  'FUNDS_LOCKED',
  'IN_TRANSIT',
  'DELIVERY_VERIFIED',
  'FUNDS_RELEASED',
]);

const normalizeStatus = (rawStatus) => {
  const value = typeof rawStatus === 'string' ? rawStatus.trim().toUpperCase() : '';
  if (!value) {
    return 'PAYMENT_PENDING';
  }

  if (value === 'SUCCESS' || value === 'PAID') {
    return 'FUNDS_LOCKED';
  }

  if (value === 'PENDING' || value === 'PROCESSING' || value === 'AWAITING_PAYMENT') {
    return 'PAYMENT_PENDING';
  }

  return value;
};

const getPayloadCandidate = (payload) => {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }

  if (Array.isArray(payload.transactions)) {
    return payload.transactions[0] ?? null;
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows[0] ?? null;
  }

  if (payload.data) {
    return getPayloadCandidate(payload.data);
  }

  if (payload.transaction) {
    return getPayloadCandidate(payload.transaction);
  }

  return payload;
};

const normalizeOrder = (payload, fallbackReference) => {
  const candidate = getPayloadCandidate(payload);
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const rawStatus = candidate.status || candidate.paymentStatus || candidate.transactionStatus;
  const status = normalizeStatus(rawStatus);

  return {
    ...candidate,
    reference:
      candidate.reference ||
      candidate.paymentReference ||
      candidate.orderReference ||
      candidate.transactionReference ||
      fallbackReference,
    amount:
      candidate.amount ??
      candidate.amountPaid ??
      candidate.totalPayable ??
      candidate.settlementAmount ??
      null,
    customerEmail:
      candidate.customerEmail ||
      candidate.email ||
      candidate.customer?.email ||
      candidate.rawWebhookPayload?.eventData?.customer?.email ||
      null,
    status,
    paymentStatus: typeof rawStatus === 'string' ? rawStatus.toUpperCase() : rawStatus,
    updatedAt:
      candidate.updatedAt ||
      candidate.rawWebhookPayload?.eventData?.paidOn ||
      candidate.createdAt ||
      null,
  };
};

/**
 * Custom hook to poll escrow payment status until a terminal state is reached.
 * @param {string} reference - The ADEPT-REF-xxxx payment reference code
 * @param {object} options - Configuration options
 */
export function useEscrowPoller(
  reference,
  { interval = 5000, maxAttempts = 60, enabled = true } = {}
) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const timerRef = useRef(null);
  const attemptsRef = useRef(0);
  const activeRequestRef = useRef(0);
  const lastConfigRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    const normalizedReference = resolveOrderReference(reference);
    if (!normalizedReference || !enabled) {
      return;
    }

    const requestId = ++activeRequestRef.current;
    setLoading((currentLoading) => (currentLoading ? currentLoading : true));

    try {
      const payload = await checkEscrowStatus(normalizedReference);
      if (requestId !== activeRequestRef.current) {
        return;
      }

      setLastCheckedAt(new Date().toISOString());

      const data = normalizeOrder(payload, normalizedReference);

      if (data) {
        setOrder((currentOrder) => {
          if (
            currentOrder &&
            currentOrder.reference === data.reference &&
            currentOrder.status === data.status &&
            currentOrder.amount === data.amount
          ) {
            return currentOrder;
          }

          return data;
        });
        setError(null);

        const isTerminalState = TERMINAL_STATUSES.has(data.status);

        if (isTerminalState) {
          stopPolling();
        }
      }
    } catch (err) {
      if (requestId === activeRequestRef.current) {
        console.error('Poller error fetching escrow status:', err);
        setError('Temporary Monnify connectivity issue. Confirm the webhook/backend is active.');
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [reference, enabled, stopPolling]);

  useEffect(() => {
    const normalizedReference = resolveOrderReference(reference);
    const configSignature = `${normalizedReference || ''}|${Boolean(enabled)}|${interval}|${maxAttempts}`;

    if (lastConfigRef.current === configSignature) {
      return undefined;
    }

    lastConfigRef.current = configSignature;
    activeRequestRef.current += 1;
    attemptsRef.current = 0;
    setAttempts(0);
    stopPolling();

    if (!normalizedReference || !enabled) {
      setOrder(null);
      setError(null);
      setLastCheckedAt(null);
      setLoading(false);
      return undefined;
    }

    setError(null);
    fetchStatus();

    timerRef.current = setInterval(() => {
      if (attemptsRef.current >= maxAttempts) {
        stopPolling();
        return;
      }

      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      fetchStatus();
    }, interval);

    return () => {
      stopPolling();
    };
  }, [reference, enabled, interval, maxAttempts, fetchStatus, stopPolling]);

  return {
    order,
    loading,
    error,
    isPolling: !!timerRef.current,
    attempts,
    lastCheckedAt,
    refetch: fetchStatus,
  };
}
