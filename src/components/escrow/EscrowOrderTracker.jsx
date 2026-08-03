import React, { useState } from 'react';

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
    if (!this.state.hasError && !this.state.errorMessage) {
      return;
    }

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

function TrackerResultPanel({ activeReference, isSearching = false, refreshedAt = null }) {
  const safeReference = typeof activeReference === 'string' ? activeReference : String(activeReference || '');
  const normalizedReference = safeReference.trim();

  const fallbackStatus = normalizedReference
    ? 'Reference captured. Escrow workflow is ready for review.'
    : 'Enter a reference to preview the escrow workflow.';

  const fallbackAmount = normalizedReference ? '—' : '—';
  const fallbackTimeline = [
    'Reference received',
    'Payment check queued',
    'Escrow review pending',
  ];

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Escrow workflow preview</p>
          <p className="mt-1 text-xs text-slate-600">{fallbackStatus}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          {isSearching ? 'Searching...' : normalizedReference ? 'Ready' : 'Pending'}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{normalizedReference || 'No reference yet'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{fallbackAmount}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
          {refreshedAt ? (
            <p className="text-[11px] text-slate-400">Updated {refreshedAt}</p>
          ) : null}
        </div>
        <ul className="mt-2 space-y-2">
          {fallbackTimeline.map((entry, index) => (
            <li key={`${entry}-${index}`} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>{entry}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
  const [reference, setReference] = useState(() => safeInitialReference);
  const [activeReference, setActiveReference] = useState(() => safeInitialReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshStamp, setRefreshStamp] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedReference = typeof reference === 'string' ? reference : String(reference ?? '');
    const trimmedRef = normalizedReference.trim();

    if (!trimmedRef) {
      setError('Payment reference is required.');
      return;
    }

    if (activeReference === trimmedRef && !error) {
      return;
    }

    setError('');
    setLoading(true);
    setActiveReference(trimmedRef);
    setRefreshStamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    if (!onTrack) {
      setLoading(false);
      return;
    }

    try {
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
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Track'}
          </button>
        </form>

        <TrackerSectionErrorBoundary>
          <TrackerResultPanel activeReference={activeReference} isSearching={loading} refreshedAt={refreshStamp} />
        </TrackerSectionErrorBoundary>
        {error ? <p className="mt-3 text-left text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
