import { useMemo, useState } from 'react';
import './ShipmentTracking.css';

const trackingStages = [
  'Order Placed',
  'Escrow Funded',
  'Quality Provenance Verified',
  'In Transit (Freight)',
  'Delivered at Hub',
];

const corridorHubs = [
  { id: 'lagos', name: 'Lagos', role: 'Marine export gate' },
  { id: 'port-harcourt', name: 'Port Harcourt', role: 'Energy logistics node' },
  { id: 'kano', name: 'Kano', role: 'Northern distribution hub' },
];

export default function ShipmentTracking({ shipment, activeReference = '' }) {
  const [activeStage, setActiveStage] = useState(3);
  const [activeHub, setActiveHub] = useState(corridorHubs[0].id);

  const safeShipment = useMemo(
    () => ({
      orderId: shipment?.orderId || activeReference || 'ADEPT-15692503',
      item: shipment?.item || 'Urea 46% Granular',
      quantity: shipment?.quantity || 100,
      total: shipment?.total || 185000,
      supplier: shipment?.supplier || 'Primary Producer',
    }),
    [shipment, activeReference]
  );

  const activeHubMeta = useMemo(
    () => corridorHubs.find((hub) => hub.id === activeHub) || corridorHubs[0],
    [activeHub]
  );

  return (
    <section className="shipment-tracking">
      <div className="shipment-tracking__header">
        <div>
          <p className="shipment-tracking__eyebrow">Enterprise Shipment Intelligence</p>
          <h1>Order {safeShipment.orderId}</h1>
          <p>
            {safeShipment.item} • {safeShipment.quantity} MT • NGN {Number(safeShipment.total).toLocaleString()} • Supplier: {safeShipment.supplier}
          </p>
        </div>

        <div className="shipment-tracking__escrow-badge" role="status" aria-live="polite">
          <p>Escrow Security</p>
          <strong>Verified by We Build-IT LLC</strong>
          <span>Escrow lock: active</span>
        </div>
      </div>

      <div className="shipment-tracking__panel">
        <h2>Multi-stage progress</h2>
        <ol className="shipment-tracking__stepper">
          {trackingStages.map((stage, index) => {
            const isCompleted = index < activeStage;
            const isCurrent = index === activeStage;
            return (
              <li key={stage} className={isCurrent ? 'is-current' : isCompleted ? 'is-complete' : ''}>
                <button type="button" onClick={() => setActiveStage(index)}>
                  <span className="shipment-tracking__step-index">{index + 1}</span>
                  <span className="shipment-tracking__step-label">{stage}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="shipment-tracking__panel">
        <h2>Interactive transit route summary</h2>
        <p className="shipment-tracking__route-copy">
          Route corridor: Lagos → Port Harcourt → Kano. Select a hub to inspect current freight leg context.
        </p>

        <div className="shipment-tracking__route-hubs" role="tablist" aria-label="West African freight corridor hubs">
          {corridorHubs.map((hub) => (
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
        </div>

        <div className="shipment-tracking__route-visual" aria-live="polite">
          <div className="shipment-tracking__route-line" />
          {corridorHubs.map((hub) => (
            <div key={hub.id} className={`shipment-tracking__route-stop ${activeHub === hub.id ? 'is-active' : ''}`}>
              <span className="shipment-tracking__stop-dot" />
              <p>{hub.name}</p>
            </div>
          ))}
        </div>

        <div className="shipment-tracking__hub-detail">
          <h3>{activeHubMeta.name}</h3>
          <p>{activeHubMeta.role}</p>
          <p>
            Current stage: <strong>{trackingStages[activeStage]}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
