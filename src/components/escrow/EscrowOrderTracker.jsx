import React, { useEffect, useMemo, useState } from 'react';
import EscrowPaymentPoller from './EscrowPaymentPoller';
import { useEscrowPoller } from '../../hooks/useEscrowPoller';

const WAITING_STATUSES = new Set([
  'PENDING',
  'AWAITING_PAYMENT',
  'PAYMENT_PENDING',
  'PAYMENT_PROCESSING',
]);

const TERMINAL_STATUSES = new Set([
  'FUNDS_LOCKED',
  'IN_TRANSIT',
  'DELIVERY_VERIFIED',
  'FUNDS_RELEASED',
]);

const STATUS_LABELS = {
  PENDING: 'Payment pending',
  AWAITING_PAYMENT: 'Payment pending',
  PAYMENT_PENDING: 'Payment pending',
  PAYMENT_PROCESSING: 'Payment being verified',
  FUNDS_LOCKED: 'Funds secured',
  IN_TRANSIT: 'In transit',
  DELIVERY_VERIFIED: 'Delivery verified',
  FUNDS_RELEASED: 'Funds released',
  FAILED: 'Action required',
  CANCELLED: 'Action required',
};

function formatDisplayTime(value) {
  if (!value) {
    return 'Awaiting update';
  }

  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return 'Awaiting update';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dateValue);
}

function getTimelineSteps(status, timestamp) {
  const baseTime = timestamp || new Date().toISOString();
  const steps = [
    {
      id: 'payment',
      title: 'Payment confirmation',
      detail: 'Bank transfer is being verified in the escrow queue.',
      time: baseTime,
      state: 'future',
    },
    {
      id: 'locks',
      title: 'Funds locked',
      detail: 'Your payment is secured until delivery is verified.',
      time: baseTime,
      state: 'future',
    },
    {
      id: 'transit',
      title: 'In transit',
      detail: 'The shipment is moving through the supply chain.',
      time: baseTime,
      state: 'future',
    },
    {
      id: 'release',
      title: 'Funds released',
      detail: 'The escrow balance can be settled to the supplier.',
      time: baseTime,
      state: 'future',
    },
  ];

  if (!status || WAITING_STATUSES.has(status)) {
    steps[0].state = 'active';
    return steps;
  }

  if (status === 'FAILED' || status === 'CANCELLED') {
    steps[0].state = 'error';
    steps[0].detail = 'Escrow review needs support attention before it can move forward.';
    return steps;
  }

  if (TERMINAL_STATUSES.has(status)) {
    steps.forEach((step, index) => {
      if (index < 3) {
        step.state = 'completed';
      }
    });
  }

  if (status === 'FUNDS_LOCKED') {
    steps[0].state = 'completed';
    steps[1].state = 'active';
    return steps;
  }

  if (status === 'IN_TRANSIT') {
    steps[0].state = 'completed';
    steps[1].state = 'completed';
    steps[2].state = 'active';
    return steps;
  }

  if (status === 'DELIVERY_VERIFIED') {
    steps[0].state = 'completed';
    steps[1].state = 'completed';
    steps[2].state = 'completed';
    steps[3].state = 'active';
    return steps;
  }

  if (status === 'FUNDS_RELEASED') {
    steps.forEach((step) => {
      step.state = 'completed';
    });
  }

  return steps;
}

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
    isPolling,
    error: pollError,
    lastCheckedAt,
  } = useEscrowPoller(activeReference, {
    enabled: Boolean(activeReference),
  });

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
    setActiveReference(trimmedRef);

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

  const orderStatus = order?.status || 'PENDING';
  const statusText = STATUS_LABELS[orderStatus] || 'Monitoring escrow';
  const timelineSteps = useMemo(
    () => getTimelineSteps(orderStatus, order?.updatedAt || order?.createdAt),
    [orderStatus, order?.updatedAt, order?.createdAt]
  );

  const handleDownloadReceipt = () => {
    if (!order) {
      return;
    }

    const receiptText = [
      'Escrow Receipt',
      `Reference: ${activeReference || '-'}`,
      `Amount: ${order?.amount != null ? `₦${Number(order.amount).toLocaleString()}` : '-'}`,
      `Status: ${statusText}`,
      `Customer: ${order?.customerEmail || order?.email || '-'}`,
      `Updated: ${formatDisplayTime(order?.updatedAt || order?.createdAt)}`,
      '',
      'Generated from the Adept Processing escrow tracker.',
    ].join('\n');

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `escrow-receipt-${(activeReference || 'order').replace(/\s+/g, '-').toLowerCase()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleJumpToDetails = () => {
    const target = document.getElementById('escrow-order-details');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-16">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-5 py-6 text-left text-white sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Secure escrow monitoring
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-slate-300">{description}</p>
            </div>
            <div className="inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Live updates
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </form>

          {order ? (
            <div id="escrow-order-details" className="tracker-card mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Order snapshot
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {activeReference || '-'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{statusText}</p>
                </div>
                <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {statusText}
                </div>
              </div>

              <div className="tracker-detail-grid mt-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Reference
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {activeReference || '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Amount
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {order?.amount != null ? `₦${Number(order.amount).toLocaleString()}` : '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Contact
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {order?.customerEmail || order?.email || '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Last update
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatDisplayTime(order?.updatedAt || order?.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      Escrow progress
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      A clearer view of where the transaction currently sits in the process.
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    <div className="font-semibold text-slate-700">
                      {formatDisplayTime(order?.updatedAt || order?.createdAt)}
                    </div>
                    <div>Last update</div>
                  </div>
                </div>

                <ol className="tracker-timeline mt-4">
                  {timelineSteps.map((step) => {
                    const iconMap = {
                      completed: '✓',
                      active: '⏳',
                      error: '!',
                      future: '•',
                    };

                    return (
                      <li key={step.id} className={`tracker-timeline-item tracker-timeline-item--${step.state}`}>
                        <span className={`tracker-step-icon tracker-step-icon--${step.state}`}>
                          {iconMap[step.state] || '•'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="tracker-step-title">{step.title}</p>
                            <p className="tracker-step-time">{formatDisplayTime(step.time)}</p>
                          </div>
                          <p className="tracker-step-detail">{step.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Download receipt
                </button>
                <a
                  href="mailto:support@adeptprocessing.com?subject=Escrow%20Order%20Support"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Contact support
                </a>
                <button
                  type="button"
                  onClick={handleJumpToDetails}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to order details
                </button>
              </div>
            </div>
          ) : (
            <div className="tracker-card mt-6 text-left">
              <p className="text-sm text-slate-600">
                No transaction rows yet. Track a payment reference to populate this overview with a live summary, timeline, and receipt actions.
              </p>
            </div>
          )}

          <EscrowPaymentPoller
            status={order?.status}
            isPolling={isPolling}
            lastCheckedAt={lastCheckedAt}
          />

          {pollError ? <p className="mt-3 text-left text-xs text-red-600">{pollError}</p> : null}
          {error ? <p className="mt-3 text-left text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
