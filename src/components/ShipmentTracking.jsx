import React, { useEffect, useMemo, useState } from 'react';
import './ShipmentTracking.css';
import { fetchOrderById } from '../services/api';

const statusStages = [
  { key: 'pending', label: 'Order placed' },
  { key: 'paid', label: 'Escrow funded' },
  { key: 'processing', label: 'Processing' },
  { key: 'in-transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'funds_released', label: 'Funds released' },
  { key: 'disputed', label: 'Disputed' },
];

const normalizeStatus = (value) => String(value || 'pending').trim().toLowerCase().replace(/\s+/g, '-');

const unwrapOrder = (payload) => payload?.data?.order || payload?.order || payload?.data || payload || null;

const formatNaira = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(amount)
    : 'Amount unavailable';
};

const formatWat = (value) => {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
};

const resolveStageIndex = (status) => {
  const normalized = normalizeStatus(status);
  const index = statusStages.findIndex((stage) => stage.key === normalized);
  return index >= 0 ? index : 0;
};

function ShipmentTrackingView({ shipment, activeReference = '' }) {
  const [liveOrder, setLiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStage, setActiveStage] = useState(0);
  const [activeHub, setActiveHub] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const orderReference = shipment?.orderId || shipment?.reference || activeReference;

  useEffect(() => {
    let isCurrent = true;
    if (!orderReference) {
      setLiveOrder(null);
      setError('');
      return undefined;
    }

    setLoading(true);
    setError('');
    fetchOrderById(orderReference)
      .then((payload) => {
        if (isCurrent) setLiveOrder(unwrapOrder(payload));
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError?.message || 'Unable to load live order updates.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [orderReference, retryKey]);

  const safeShipment = useMemo(
    () => ({
      ...(shipment || {}),
      ...(liveOrder || {}),
      orderId: liveOrder?.orderId || liveOrder?.reference || shipment?.orderId || shipment?.reference || activeReference || 'Order reference unavailable',
      item: liveOrder?.item || liveOrder?.productName || shipment?.item || 'Item unavailable',
      quantity: liveOrder?.quantity || liveOrder?.quantityMt || shipment?.quantity || shipment?.quantityMt,
      total: liveOrder?.total || liveOrder?.totalAmount || liveOrder?.amount || shipment?.total,
      supplier: liveOrder?.supplier?.name || liveOrder?.supplier || shipment?.supplier || 'Supplier unavailable',
      status: liveOrder?.status || liveOrder?.orderStatus || shipment?.status || 'pending',
    }),
    [liveOrder, shipment, activeReference]
  );

  const routeHubs = useMemo(() => {
    const route = safeShipment.route || safeShipment.hubs || safeShipment.logistics?.hubs;
    return Array.isArray(route) ? route.filter(Boolean).map((hub, index) => ({
      id: hub.id || hub.name || `hub-${index}`,
      name: hub.name || hub.location || `Transit hub ${index + 1}`,
      role: hub.role || hub.type || 'Transit hub',
    })) : [];
  }, [safeShipment]);

  const trackingStages = useMemo(() => {
    const currentIndex = resolveStageIndex(safeShipment.status);
    return statusStages.map((stage, index) => ({ ...stage, isComplete: index < currentIndex, isCurrent: index === currentIndex }));
  }, [safeShipment.status]);

  const escrowProtected = ['paid', 'processing', 'in-transit', 'delivered'].includes(normalizeStatus(safeShipment.status));

  useEffect(() => {
    setActiveStage(resolveStageIndex(safeShipment.status));
  }, [safeShipment.status]);

  const activeHubMeta = useMemo(
    () => routeHubs.find((hub) => hub.id === activeHub) || routeHubs[0],
    [activeHub, routeHubs]
  );

  const orderTimeline = useMemo(() => {
    const events = safeShipment.events || safeShipment.history || safeShipment.statusHistory;
    if (!Array.isArray(events)) {
      return [];
    }

    return events
      .filter((event) => event && typeof event === 'object')
      .map((event, index) => ({
        time: formatWat(event.timestamp || event.updatedAt || event.createdAt),
        status: event.status || event.title || 'Order update',
        text: event.message || event.description || 'Your order status has been updated.',
        tone: index % 2 === 0 ? 'incoming' : 'outgoing',
      }));
  }, [safeShipment]);

  const shareTrackingUrl = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adeptprocessing.com';
    const trackingLink = `${baseUrl}/?tab=orders&reference=${encodeURIComponent(safeShipment.orderId)}`;
    const shareText = `Order ${safeShipment.orderId}\nItem: ${safeShipment.item}\nStatus: ${safeShipment.status}\nQty: ${safeShipment.quantity || 'N/A'} MT\nTotal: ${formatNaira(safeShipment.total)}\nTracking: ${trackingLink}`;
    return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  }, [safeShipment]);

  const handleShareToWhatsApp = () => {
    window.open(shareTrackingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="shipment-tracking">
      {loading && (
        <div className="shipment-tracking__loading" role="status" aria-live="polite">
          Loading live order details...
        </div>
      )}
      {error && (
        <div className="shipment-tracking__retry-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Retry</button>
        </div>
      )}
      <div className="shipment-tracking__trust-banner" role="status" aria-live="polite">
        <span className="shipment-tracking__trust-banner-icon" aria-hidden="true">✓</span>
        <div>
          <strong>{escrowProtected ? 'Funds Protected in Escrow' : `Escrow status: ${normalizeStatus(safeShipment.status)}`}</strong>
          <span>{escrowProtected ? 'Your order is secured until delivery is confirmed.' : 'Payment protection will update when the provider confirms funding.'}</span>
        </div>
      </div>

      <div className="shipment-tracking__header">
        <div>
          <p className="shipment-tracking__eyebrow">Enterprise Shipment Intelligence</p>
          <h1>Order {safeShipment.orderId}</h1>
          <p>
            {safeShipment.item} • {safeShipment.quantity || 'N/A'} MT • {formatNaira(safeShipment.total)} • Supplier: {safeShipment.supplier}
          </p>
        </div>

        <div className="shipment-tracking__header-actions">
          <button type="button" className="shipment-tracking__share-button" onClick={handleShareToWhatsApp}>
            Share Order to WhatsApp
          </button>
          <div className="shipment-tracking__escrow-badge" role="status" aria-live="polite">
            <p>Escrow Security</p>
            <strong>{normalizeStatus(safeShipment.status) === 'funds_released' ? 'Funds released' : 'Order status: ' + normalizeStatus(safeShipment.status)}</strong>
            <span>{normalizeStatus(safeShipment.status) === 'disputed' ? 'Review required' : 'Live order status'}</span>
          </div>
        </div>
      </div>

      <div className="shipment-tracking__panel">
        <h2>Multi-stage progress</h2>
        <ol className="shipment-tracking__stepper">
          {trackingStages.map((stage, index) => {
            const isCompleted = stage.isComplete;
            const isCurrent = stage.isCurrent || index === activeStage;
            return (
              <li key={stage.key} className={isCurrent ? 'is-current' : isCompleted ? 'is-complete' : ''}>
                <button type="button" onClick={() => setActiveStage(index)}>
                  <span className="shipment-tracking__step-index">{index + 1}</span>
                  <span className="shipment-tracking__step-label">{stage.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="shipment-tracking__panel">
        <h2>Interactive transit route summary</h2>
        <p className="shipment-tracking__route-copy">
          {routeHubs.length > 0 ? 'Select a live transit hub to inspect the current freight leg.' : 'Live route details will appear when the logistics provider reports them.'}
        </p>

        {routeHubs.length > 0 && <div className="shipment-tracking__route-hubs" role="tablist" aria-label="Order transit hubs">
          {routeHubs.map((hub) => (
            <button
              key={hub.id}
              type="button"
              role="tab"
              aria-selected={activeHub === hub.id}
              className={activeHub === hub.id ? 'is-active' : ''}
              onClick={() => setActiveHub(hub.id)}
            >
              <strong>{hub.name}</strong>
              <span>{hub.role}</span>
            </button>
          ))}
        </div>}

        {routeHubs.length > 0 && <div className="shipment-tracking__route-visual" aria-live="polite">
          <div className="shipment-tracking__route-line" />
          {routeHubs.map((hub) => (
            <div key={hub.id} className={`shipment-tracking__route-stop ${activeHub === hub.id ? 'is-active' : ''}`}>
              <span className="shipment-tracking__stop-dot" />
              <p>{hub.name}</p>
            </div>
          ))}
        </div>}

        {activeHubMeta && <div className="shipment-tracking__hub-detail">
          <h3>{activeHubMeta.name}</h3>
          <p>{activeHubMeta.role}</p>
          <p>
            Current stage: <strong>{trackingStages[activeStage]?.label}</strong>
          </p>
        </div>}
      </div>

      <div className="shipment-tracking__panel shipment-tracking__timeline-panel">
        <div className="shipment-tracking__timeline-header">
          <h2>Order activity</h2>
          <span>Live updates</span>
        </div>
        <div className="shipment-tracking__timeline" aria-live="polite">
          {orderTimeline.length > 0 ? orderTimeline.map((item) => (
            <div key={`${item.status}-${item.time}`} className={`shipment-tracking__bubble shipment-tracking__bubble--${item.tone}`}>
              <div className="shipment-tracking__bubble-meta">
                <strong>{item.status}</strong>
                <time>{item.time}</time>
              </div>
              <p>{item.text}</p>
            </div>
          )) : (
            <p className="shipment-tracking__timeline-empty">
              Order activity will appear here as the supplier, payment provider, and carrier report updates.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

class ShipmentTrackingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="shipment-tracking shipment-tracking__error-state" role="alert">
          <h2>Order tracking is temporarily unavailable</h2>
          <p>Please refresh this page or try opening the order again.</p>
          <button type="button" onClick={() => window.location.reload()}>Refresh tracking</button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default function ShipmentTracking(props) {
  return (
    <ShipmentTrackingErrorBoundary>
      <ShipmentTrackingView {...props} />
    </ShipmentTrackingErrorBoundary>
  );
}
