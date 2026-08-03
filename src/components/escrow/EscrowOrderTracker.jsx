import React, { useEffect, useState } from 'react';
import EscrowPaymentPoller from './EscrowPaymentPoller';
import { useEscrowPoller } from '../../hooks/useEscrowPoller';

class TrackerSectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unable to render this tracker section right now.',
    };
  }

  componentDidCatch(error) {
    console.error('Escrow tracker section crashed:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="text-sm font-semibold text-amber-800">Tracker section recovered from an error</p>
          <p className="mt-1 text-xs text-amber-700">{this.state.errorMessage}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
          >
            Retry section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function TrackerResultPanel({ activeReference }) {
  const {
    order,
    isPolling,
    error: pollError,
    lastCheckedAt,
  } = useEscrowPoller(activeReference, {
    enabled: Boolean(activeReference),
  });

  const safeReference = typeof activeReference === 'string' ? activeReference : String(activeReference || '');
  const safeAmount = order?.amount != null && Number.isFinite(Number(order.amount))
    ? Number(order.amount).toLocaleString()
    : '-';
  const safeStatus = typeof order?.status === 'string' && order.status.trim() ? order.status : '-';
  const safeEmail = typeof (order?.customerEmail || order?.email) === 'string' && (order?.customerEmail || order?.email).trim()
    ? (order?.customerEmail || order?.email)
    : '-';
  const safeTimestamp = typeof (order?.updatedAt || order?.createdAt) === 'string' && (order?.updatedAt || order?.createdAt).trim()
    ? (order?.updatedAt || order?.createdAt)
    : '-';

  return (
    <>
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
                <td>{safeReference || '-'}</td>
                <td>{safeAmount}</td>
                <td>{safeStatus}</td>
                <td>{safeEmail}</td>
                <td>{safeTimestamp}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => {
                      if (safeReference) {
                        navigator?.clipboard?.writeText?.(safeReference).catch(() => {});
                      }
                    }}
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
        status={safeStatus === '-' ? undefined : safeStatus}
        isPolling={Boolean(isPolling)}
        lastCheckedAt={lastCheckedAt}
      />

      {pollError ? <p className="mt-3 text-left text-xs text-red-600">{pollError}</p> : null}
    </>
  );
}

export default function EscrowOrderTracker(props) {
  const safeProps = props && typeof props === 'object' ? props : {};
  const initialReference = safeProps.initialReference;
  const onTrack = typeof safeProps.onTrack === 'function' ? safeProps.onTrack : undefined;
  const title = typeof safeProps.title === 'string' && safeProps.title.trim()
    ? safeProps.title
    : 'Escrow Order Tracker';
  const description = typeof safeProps.description === 'string' && safeProps.description.trim()
    ? safeProps.description
    : 'Enter your payment reference to track virtual account funding and delivery status.';
  const placeholder = typeof safeProps.placeholder === 'string' && safeProps.placeholder.trim()
    ? safeProps.placeholder
    : 'e.g. ADEPT-REF-9082';

  const safeInitialReference = typeof initialReference === 'string' ? initialReference : String(initialReference ?? '');
  const [reference, setReference] = useState(safeInitialReference);
  const [activeReference, setActiveReference] = useState(safeInitialReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (initialReference == null) {
        return;
      }

      const nextReference = typeof initialReference === 'string'
        ? initialReference
        : String(initialReference ?? '');

      setReference((currentReference) => (
        currentReference === nextReference ? currentReference : nextReference
      ));
      setActiveReference((currentActiveReference) => (
        currentActiveReference === nextReference ? currentActiveReference : nextReference
      ));
      setError((currentError) => (currentError === '' ? currentError : ''));
    } catch (syncError) {
      console.error('Failed to sync tracker initial reference:', syncError);
      setReference('');
      setActiveReference('');
      setError('Unable to initialize tracking reference.');
    }
  }, [initialReference]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedReference = typeof reference === 'string' ? reference : String(reference ?? '');
    const trimmedRef = normalizedReference.trim();
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

        <TrackerSectionErrorBoundary>
          <TrackerResultPanel activeReference={activeReference} />
        </TrackerSectionErrorBoundary>
        {error ? <p className="mt-3 text-left text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
