import React, { useEffect, useMemo, useState } from 'react';
import './EscrowPaymentPoller.css';

const TERMINAL_STATUSES = new Set([
  'FUNDS_LOCKED',
  'IN_TRANSIT',
  'DELIVERY_VERIFIED',
  'FUNDS_RELEASED',
]);

const WAITING_STATUSES = new Set([
  'PENDING',
  'AWAITING_PAYMENT',
  'PAYMENT_PENDING',
  'PAYMENT_PROCESSING',
]);

function getBadgeCopy(status) {
  if (!status || WAITING_STATUSES.has(status)) {
    return 'Waiting for your bank transfer to reflect via Monnify';
  }

  if (status === 'FAILED' || status === 'CANCELLED') {
    return 'Payment update failed. Please retry or contact support';
  }

  if (TERMINAL_STATUSES.has(status)) {
    return 'Payment confirmed. Escrow workflow has started';
  }

  return 'Checking payment status with Monnify';
}

function toDateValue(lastCheckedAt) {
  if (!lastCheckedAt) {
    return null;
  }

  const value =
    lastCheckedAt instanceof Date ? lastCheckedAt : new Date(lastCheckedAt);

  return Number.isNaN(value.getTime()) ? null : value;
}

function formatRelativeLastChecked(lastCheckedAt, nowMs) {
  const dateValue = toDateValue(lastCheckedAt);
  if (!dateValue) {
    return '';
  }

  const diffMs = Math.max(0, nowMs - dateValue.getTime());
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 2) {
    return 'checked just now';
  }

  if (diffSeconds < 60) {
    return `checked ${diffSeconds}s ago`;
  }

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) {
    return `checked ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `checked ${hours}h ago`;
}

export default function EscrowPaymentPoller({
  status,
  isPolling = false,
  lastCheckedAt = null,
}) {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!isPolling) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [isPolling]);

  if (!status && !isPolling) {
    return null;
  }

  const isTerminal = status && TERMINAL_STATUSES.has(status);
  const isError = status === 'FAILED' || status === 'CANCELLED';
  const isWaiting = !isTerminal && !isError;
  const relativeCheckTime = useMemo(
    () => formatRelativeLastChecked(lastCheckedAt, nowMs),
    [lastCheckedAt, nowMs]
  );

  const toneClass = isTerminal
    ? 'escrow-poller-badge--success'
    : isError
      ? 'escrow-poller-badge--error'
      : 'escrow-poller-badge--waiting';

  return (
    <div className="escrow-poller-wrap">
      <div
        role="status"
        aria-live="polite"
        className={`escrow-poller-badge ${toneClass}`}
      >
        <span className="escrow-poller-dot-shell" aria-hidden="true">
          {isWaiting ? (
            <span className="escrow-poller-dot-pulse" />
          ) : null}
          <span
            className={`escrow-poller-dot-core ${
              isTerminal
                ? 'escrow-poller-dot-core--success'
                : isError
                  ? 'escrow-poller-dot-core--error'
                  : 'escrow-poller-dot-core--waiting'
            }`}
          />
        </span>

        <span>{getBadgeCopy(status)}</span>
      </div>

      {isWaiting && relativeCheckTime ? (
        <p className="escrow-poller-meta" aria-live="off">
          Last {relativeCheckTime}
        </p>
      ) : null}
    </div>
  );
}