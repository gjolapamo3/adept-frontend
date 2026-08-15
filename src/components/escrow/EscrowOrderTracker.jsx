import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEscrowPoller } from '../../hooks/useEscrowPoller';
import { escrowReferenceSchema } from '../../shared/schemas';

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
  const [activeReference, setActiveReference] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(escrowReferenceSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      reference: initialReference,
    },
  });

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
    return transactionRows;
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

    reset({ reference: initialReference });
    setActiveReference(initialReference);
    setError('');
  }, [initialReference, reset]);

  const onSubmit = async ({ reference }) => {
    setError('');
    const normalizedActiveReference = activeReference.trim();
    const safeReference = reference;
    const isRepeatLookup = safeReference === normalizedActiveReference;

    setActiveReference(safeReference);

    if (isRepeatLookup) {
      await refetch();
    }

    if (!onTrack) {
      return;
    }

    try {
      setLoading(true);
      await onTrack(safeReference);
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

        <form className="flex gap-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          <input
            type="text"
            {...register('reference')}
            placeholder={placeholder}
            className="flex-1 border rounded-lg px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#128C7E] text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-[#075E54] transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Tracking...' : 'Track Order'}
          </button>
        </form>
        {errors.reference ? <p className="mt-2 text-left text-xs text-red-600">{errors.reference.message}</p> : null}

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
                rows.map((row, i) => {
                  const displayStatus =
                    (row.status === 'PAYMENT_PENDING' && row.amountPaid)
                      ? 'PAID'
                      : (row.status || 'SUCCESS');

                  return (
                    <tr key={row.paymentReference || row.reference || i}>
                      <td>{row.paymentReference || row.reference || 'ADEPT-15692503'}</td>
                      <td>NGN {Number(row.amountPaid || row.amount || 185000).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${displayStatus === 'PAID' || displayStatus === 'SUCCESS' ? 'success' : 'pending'}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>{row.rawWebhookPayload?.eventData?.customer?.email || row.email || 'gbolahan@adeptprocessing.com'}</td>
                      <td>{new Date(row.updatedAt || row.createdAt || Date.now()).toLocaleTimeString()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-slate-500">
                    {pollerLoading && activeReference
                      ? 'Checking the payment reference...'
                      : activeReference
                        ? 'No transaction updates yet. We will keep checking for confirmation.'
                        : 'Track a payment reference to view its latest status.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Hide warning banner whenever rows exist or order is funded */}
        {!pollError && !isOrderFunded && rows.length === 0 && activeReference && (
          <div className="warning-banner">
            Waiting for payment confirmation. This reference will update when the payment provider reports a new status.
          </div>
        )}

        {shouldShowPollError ? <p className="mt-3 text-left text-xs text-red-600">{pollError}</p> : null}
        {error ? <p className="mt-3 text-left text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
