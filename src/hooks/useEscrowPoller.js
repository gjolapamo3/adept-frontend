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

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!reference || !enabled) {
      return;
    }

    setLoading(true);
    try {
      const data = await checkEscrowStatus(reference);
      if (data) {
        setOrder(data);
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
      console.error('Poller error fetching escrow status:', err);
      setError('Temporary error connecting to payment gateway.');
    } finally {
      setLoading(false);
    }
  }, [reference, enabled, stopPolling]);

  useEffect(() => {
    if (!reference || !enabled) {
      stopPolling();
      return undefined;
    }

    setAttempts(0);
    fetchStatus();

    timerRef.current = setInterval(() => {
      setAttempts((prev) => {
        const nextAttempts = prev + 1;
        if (nextAttempts >= maxAttempts) {
          stopPolling();
        }
        return nextAttempts;
      });

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
