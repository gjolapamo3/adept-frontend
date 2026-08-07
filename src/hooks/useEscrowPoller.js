import { useState, useEffect, useRef, useCallback } from 'react';
import { checkEscrowStatus } from '../services/escrowService';

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
    const normalizedReference = typeof reference === 'string' ? reference.trim() : '';
    if (!normalizedReference || !enabled) {
      return;
    }

    const requestId = ++activeRequestRef.current;
    setLoading((currentLoading) => (currentLoading ? currentLoading : true));

    try {
      const data = await checkEscrowStatus(normalizedReference);
      if (requestId !== activeRequestRef.current) {
        return;
      }

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

        const isTerminalState = [
          'FUNDS_LOCKED',
          'IN_TRANSIT',
          'DELIVERY_VERIFIED',
          'FUNDS_RELEASED',
        ].includes(data.status);

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
    const normalizedReference = typeof reference === 'string' ? reference.trim() : '';
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
    refetch: fetchStatus,
  };
}
