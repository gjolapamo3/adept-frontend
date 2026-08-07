import React, { useEffect, useState } from 'react';
import EscrowPaymentPoller from './EscrowPaymentPoller';
import { useEscrowPoller } from '../../hooks/useEscrowPoller';

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
            disabled={loading}
            className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Tracking...' : 'Track'}
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
              {order ? (
                <tr>
                  <td>{activeReference || '-'}</td>
                  <td>{order?.amount != null ? Number(order.amount).toLocaleString() : '-'}</td>
                  <td>{order?.status || '-'}</td>
                  <td>{order?.customerEmail || order?.email || '-'}</td>
                  <td>{order?.updatedAt || order?.createdAt || '-'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setActiveReference((current) => current)}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
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

        <EscrowPaymentPoller
          status={order?.status}
          isPolling={isPolling}
          lastCheckedAt={lastCheckedAt}
        />

        {pollError ? <p className="mt-3 text-left text-xs text-red-600">{pollError}</p> : null}
        {error ? <p className="mt-3 text-left text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
