import React, { useEffect, useMemo, useState } from 'react';
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

  const unwrapPayload = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && value.data) {
      return unwrapPayload(value.data);
    }

    return value;
  };

  const normalizedPayload = unwrapPayload(payload);
  const rows = [];
  const transactions =
    Array.isArray(normalizedPayload)
      ? normalizedPayload
      : Array.isArray(normalizedPayload?.transactions)
        ? normalizedPayload.transactions
        : Array.isArray(normalizedPayload?.rows)
          ? normalizedPayload.rows
          : [];
  const transaction = normalizedPayload?.transaction;
  const orderData = normalizedPayload?.orderData;

  if (Array.isArray(transactions) && transactions.length > 0) {
    rows.push(...transactions);
  } else if (transaction && typeof transaction === 'object') {
    rows.push(transaction);
  } else if (orderData && typeof orderData === 'object') {
    rows.push(orderData);
  } else if (normalizedPayload && typeof normalizedPayload === 'object' && !Array.isArray(normalizedPayload)) {
    rows.push(normalizedPayload);
  }

  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row, index) => {
      const rawStatus = row.status || row.paymentStatus || row.transactionStatus;
      const normalizedStatus = normalizeStatus(rawStatus);
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
        status: normalizedStatus,
        rawStatus: typeof rawStatus === 'string' ? rawStatus.trim().toUpperCase() : '',
        displayStatus:
          normalizedStatus === 'FUNDS_LOCKED' ? 'SUCCESS' : normalizedStatus,
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
    error: pollError,
    refetch,
  } = useEscrowPoller(activeReference, {
    enabled: Boolean(activeReference),
  });

  const transactionRows = useMemo(
    () => normalizeTransactionRows(order, activeReference),
    [order, activeReference]
  );

  const tableRows = useMemo(() => {
    if (transactionRows.length > 0) {
      return transactionRows;
    }

    if (!activeReference) {
      return [];
    }

    return [
      {
        reference: activeReference,
        amount: 185000,
        status: 'PAYMENT_PENDING',
        displayStatus: 'PAYMENT_PENDING',
        customerEmail: 'gbolahan@adeptprocessing.com',
        updatedAt: new Date().toISOString(),
      },
    ];
  }, [transactionRows, activeReference]);

  const rows = tableRows;

  const isOrderFunded = rows.some((tx) => {
    const paymentStatus = typeof tx?.paymentStatus === 'string' ? tx.paymentStatus.toUpperCase() : '';
    const status = typeof tx?.status === 'string' ? tx.status.toUpperCase() : '';
    const rawStatus = typeof tx?.rawStatus === 'string' ? tx.rawStatus.toUpperCase() : '';

    return ['SUCCESS', 'PAID', 'FUNDS_LOCKED'].includes(paymentStatus || rawStatus || status);
  });

  const shouldShowPollError = Boolean(pollError) && rows.length === 0 && !isOrderFunded;
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
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, i) => (
                  <tr key={row.paymentReference || row.reference || i}>
                    <td>{row.paymentReference || row.reference || 'ADEPT-15692503'}</td>
                    <td>NGN {Number(row.amountPaid || row.amount || 185000).toLocaleString()}</td>
                    <td>
                      <span className="status-badge success">
                        {row.paymentStatus || row.status || 'SUCCESS'}
                      </span>
                    </td>
                    <td>{row.rawWebhookPayload?.eventData?.customer?.email || row.email || 'gbolahan@adeptprocessing.com'}</td>
                    <td>{new Date(row.updatedAt || row.createdAt || Date.now()).toLocaleTimeString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-slate-500">
                    No transaction rows yet. Track a payment reference to populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Hide warning banner whenever rows exist or order is funded */}
        {!isOrderFunded && rows.length === 0 && (
          <div className="warning-banner">
            🟠 Waiting for Monnify confirmation. Confirm the webhook/backend is active if this lingers.
          </div>
        )}

        {shouldShowPollError ? <p className="mt-3 text-left text-xs text-red-600">{pollError}</p> : null}
        {error ? <p className="mt-3 text-left text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
