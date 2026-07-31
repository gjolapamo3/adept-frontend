import React from 'react';

function formatRelativeTime(isoDate) {
  if (!isoDate) {
    return '';
  }

  const timestamp = new Date(isoDate);
  if (Number.isNaN(timestamp.getTime())) {
    return '';
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 1000));

  if (deltaSeconds < 2) {
    return 'just now';
  }

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  return `${Math.floor(deltaMinutes / 60)}h ago`;
}

function getStatusMeta(connectionStatus, isConnected) {
  if (isConnected || connectionStatus === 'connected') {
    return {
      dotClass: 'bg-emerald-500',
      shellClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      label: 'Live feed connected',
      pulse: true,
    };
  }

  if (connectionStatus === 'reconnecting' || connectionStatus === 'connecting') {
    return {
      dotClass: 'bg-amber-500',
      shellClass: 'border-amber-200 bg-amber-50 text-amber-700',
      label: connectionStatus === 'connecting' ? 'Connecting live feed' : 'Reconnecting live feed',
      pulse: true,
    };
  }

  if (connectionStatus === 'error') {
    return {
      dotClass: 'bg-rose-500',
      shellClass: 'border-rose-200 bg-rose-50 text-rose-700',
      label: 'Live feed unavailable',
      pulse: false,
    };
  }

  return {
    dotClass: 'bg-slate-400',
    shellClass: 'border-slate-200 bg-slate-100 text-slate-700',
    label: 'Live feed disconnected',
    pulse: false,
  };
}

export default function LiveStreamBadge({
  connectionStatus = 'idle',
  isConnected = false,
  reconnectAttempt = 0,
  lastEventAt = null,
  error = '',
  onReconnect,
  className = '',
}) {
  const { shellClass, dotClass, label, pulse } = getStatusMeta(connectionStatus, isConnected);
  const relativeEventTime = formatRelativeTime(lastEventAt);

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`.trim()}>
      <p
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${shellClass}`}
      >
        <span className="relative inline-flex h-2 w-2" aria-hidden="true">
          {pulse ? (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${dotClass}`} />
          ) : null}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
        </span>
        {label}
      </p>

      {relativeEventTime ? (
        <p className="text-[11px] text-slate-500">Last market event {relativeEventTime}</p>
      ) : null}

      {!isConnected && reconnectAttempt > 0 ? (
        <p className="text-[11px] text-slate-500">Reconnect attempts: {reconnectAttempt}</p>
      ) : null}

      {!isConnected && error ? (
        <button
          type="button"
          onClick={onReconnect}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Retry live stream
        </button>
      ) : null}
    </div>
  );
}