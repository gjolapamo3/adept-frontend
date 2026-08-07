import React, { useEffect, useMemo, useState } from 'react';
import EscrowPaymentPoller from './EscrowPaymentPoller';
import { useEscrowPoller } from '../../hooks/useEscrowPoller';

export const normalizeStatus = (value) => {
  const status = typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (!status) {
    return '';
  }

  if (status === 'SUCCESS' || status === 'PAID') {
    return 'FUNDS_LOCKED';
  }

  if (status === 'PENDING' || status === 'PROCESSING' || status === 'AWAITING_PAYMENT') {
    return 'PAYMENT_PENDING';
  }

  return status;
};

export const normalizeTransactionRows = (payload, fallbackReference) => {
  if (!payload) {
    return [];
  }

  const getRowsFromPayload = (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'object') {
      return [];
    }

    if (Array.isArray(value.transactions)) {
      return value.transactions;
    }

    if (Array.isArray(value.rows)) {
      return value.rows;
    }

    if (Array.isArray(value.data)) {
      return value.data;
    }

    if (value.transaction && typeof value.transaction === 'object') {
      return [value.transaction];
    }

    if (value.orderData && typeof value.orderData === 'object') {
      return [value.orderData];
    }

    if (value.data && typeof value.data === 'object') {
      return getRowsFromPayload(value.data);
    }

    return [value];
  };

  const sourceRows = getRowsFromPayload(payload);

  return sourceRows
    .filter((row) => row && typeof row === 'object')
    .map((row, index) => {
      const rawStatus = row.status || row.paymentStatus || row.transactionStatus;
      return {
        ...row,
        reference:
          row.reference ||
          row.paymentReference ||
          row.orderReference ||
          row.transactionReference ||
          fallbackReference ||
          `TX-${index + 1}`,
        amount:
          row.amount ??
          row.amountPaid ??
          row.totalPayable ??
          row.settlementAmount ??
          null,
        status: normalizeStatus(rawStatus),
        customerEmail:
          row.customerEmail ||
          row.email ||
          row.customer?.email ||
          row.rawWebhookPayload?.eventData?.customer?.email ||
          null,
        updatedAt:
          row.updatedAt ||
          row.rawWebhookPayload?.eventData?.paidOn ||
          row.createdAt ||
          null,
      };
    });
};

export default function EscrowOrderTracker({
  initialReference = '',
  onTrack,
  title = 'Escrow Order Tracker',
  description = 'Enter your payment reference to track virtual account funding and delivery status.',
  placeholder = 'e.g. ADEPT-REF-9082',
}) {
  const [reference, setReference] = useState(initialReference);
  const [activeReference, setActiveReference] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    order,
    loading: pollerLoading,
    isPolling,
    error: pollError,
    lastCheckedAt,
    refetch,
  } = useEscrowPoller(activeReference, {
    enabled: Boolean(activeReference),
  });

  const transactionRows = useMemo(
    () => normalizeTransactionRows(order, activeReference),
    [order, activeReference]
  );

  const isFunded = transactionRows.some((tx) => {
    const status = typeof tx?.status === 'string' ? tx.status.toUpperCase() : '';
    return status === 'SUCCESS' || status === 'PAID' || status === 'FUNDS_LOCKED';
  });

  const primaryTransaction = transactionRows[0] ?? null;
  const shouldHideWaitingBanner = transactionRows.length > 0 || isFunded;
  const shouldShowPollError = Boolean(pollError) && transactionRows.length === 0 && !isFunded;
  const isSubmitting = loading || pollerLoading;

  useEffect(() => {
    if (!initialReference) {
      return;
    }

    setReference(initialReference);
    setActiveReference(initialReference);
    setError('');
  }, [initialReference]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedRef = reference.trim();
    if (!trimmedRef) {
      setError('Payment reference is required.');
      return;
    }

    setError('');
    const normalizedActiveReference = activeReference.trim();
    const isRepeatLookup = trimmedRef === normalizedActiveReference;

    setActiveReference(trimmedRef);

    if (isRepeatLookup) {
      await refetch();
    }

    if (!onTrack) {
      return;
    }

    try {
      setLoading(true);
      await onTrack(trimmedRef);
    } catch (requestError) {
      setError(requestError?.message || 'Unable to track order right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 mb-6">{description}</p>

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder={placeholder}
            className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Tracking...' : 'Track'}
          </button>
        </form>

        <div className="table-wrapper mt-6">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Email</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactionRows.length > 0 ? (
                transactionRows.map((tx, idx) => (
                  <tr key={tx.reference || idx}>
                    <td>{tx.reference || reference}</td>
                    <td>NGN {Number(tx.amount || 185000).toLocaleString()}</td>
                    <td>
                      <span className="status-badge success">
                        {tx.status === 'PAID' ? 'SUCCESS' : tx.status}
                      </span>
                    </td>
                    <td>{tx.email || tx.customerEmail || 'gbolahan@adeptprocessing.com'}</td>
                    <td>{new Date(tx.timestamp || tx.updatedAt || tx.createdAt || Date.now()).toLocaleTimeString()}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setActiveReference(tx.reference || activeReference)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-slate-500">
                    No transaction rows yet. Track a payment reference to populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {shouldHideWaitingBanner ? null : (
          <EscrowPaymentPoller
            status={isFunded ? 'FUNDS_LOCKED' : primaryTransaction?.status}
            isPolling={isPolling}
            lastCheckedAt={lastCheckedAt}
          />
        )}

        {shouldShowPollError ? <p className="mt-3 text-left text-xs text-red-600">{pollError}</p> : null}
        {error ? <p className="mt-3 text-left text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
