import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import Marketplace from './pages/Marketplace';
import SupplierDashboard from './pages/SupplierDashboard';
import EscrowOrderTracker from './components/escrow/EscrowOrderTracker';
import SSOGateway from './components/SSOGateway';
import PricingDashboard from './components/PricingDashboard';
import ShipmentTracking from './components/ShipmentTracking';
import { getStoredAuthToken } from './utils/auth';
import { resolveOrderReference } from './utils/orderReference';

export default function App() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [latestOrderReference, setLatestOrderReference] = useState('');
  const [selectedEscrowRef, setSelectedEscrowRef] = useState('');
  const [shipmentPayload, setShipmentPayload] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedToken = getStoredAuthToken();
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('user');
          setUser({ name: 'Signed in', email: 'buyer@adept.local', role: localStorage.getItem('adept_user_role') || 'buyer' });
        }
      } else {
        setUser({ name: 'Signed in', email: 'buyer@adept.local', role: localStorage.getItem('adept_user_role') || 'buyer' });
      }
    }
  }, []);

  const handleOrderCreated = (reference) => {
    const nextReference = resolveOrderReference(reference);
    setLatestOrderReference(nextReference);
    setSelectedEscrowRef(nextReference);
    setActiveTab('orders');
  };

  const handleOrderSuccess = (orderResponse) => {
    const nextReference = resolveOrderReference(orderResponse?.escrowReference || orderResponse);
    if (nextReference) {
      setLatestOrderReference(nextReference);
      setSelectedEscrowRef(nextReference);
    }
    setActiveTab('orders');
  };

  const handleTrackReference = (reference) => {
    const nextReference = resolveOrderReference(reference);
    setLatestOrderReference(nextReference);
    setSelectedEscrowRef(nextReference);
  };

  const handleSsoSuccess = (profile) => {
    setUser(profile);
    setActiveTab('marketplace');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adept_auth_token');
    localStorage.removeItem('adept_user_role');
    setUser(null);
    setActiveTab('marketplace');
  };

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  if (!isAuthenticated) {
    return <SSOGateway onSuccess={handleSsoSuccess} />;
  }

  const tabs = [
    { key: 'marketplace', label: 'Spot Market' },
    { key: 'pricing', label: 'Pricing Desk' },
    { key: 'orders', label: 'Escrow & Settlements' },
    { key: 'supplier', label: 'Hub Logistics' },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-brand">
            <div className="app-brand__mark">A</div>
            <div className="app-brand__text">
              <div className="app-brand__wordmark">
                <span className="app-brand__name">ADEPT</span>
                <span className="app-brand__tagline">Industrial Supply Network</span>
              </div>
              <span className="app-live-badge">
                <span className="app-live-badge__dot" />
                LIVE
              </span>
            </div>
          </div>

          <div className="app-header__user">
            <div className="app-user-meta">
              <span className="app-user-meta__name">G. Jolapamo</span>
              <span className="app-user-meta__role">TRADING DESK</span>
            </div>
            <button type="button" onClick={handleSignOut} className="button-secondary app-header__exit">
              Exit
            </button>
          </div>
        </div>

        <nav className="app-tabs" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`app-tab ${activeTab === tab.key ? 'is-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {(activeTab === 'pricing' || activeTab === 'orders') && (
          <div className="escrow-trust-banner" role="status" aria-live="polite">
            <span className="escrow-trust-banner__icon" aria-hidden="true">🔒</span>
            <span>Escrow protected trade flow. Funds stay secured until delivery is confirmed.</span>
          </div>
        )}

        {activeTab === 'marketplace' && <Marketplace onOrderCreated={handleOrderCreated} />}
        {activeTab === 'supplier' && <SupplierDashboard />}
        {activeTab === 'pricing' && (
          <PricingDashboard onOpenShipmentTracking={(payload) => {
            setShipmentPayload(payload);
            const nextReference = resolveOrderReference(payload);
            setLatestOrderReference(nextReference);
            setSelectedEscrowRef(nextReference);
            setActiveTab('orders');
          }} />
        )}
        {activeTab === 'orders' && (
          <div className="orders-layout">
            <ShipmentTracking shipment={shipmentPayload} activeReference={selectedEscrowRef || latestOrderReference} />
            <EscrowOrderTracker initialReference={selectedEscrowRef || latestOrderReference} onTrack={handleTrackReference} />
          </div>
        )}
      </main>

      <a
        className="chat-support-fab"
        href="https://wa.me/19792489560"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Support"
      >
        <span className="chat-support-fab__icon" aria-hidden="true">💬</span>
        <span className="chat-support-fab__label">Chat Support</span>
      </a>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <p>© {new Date().getFullYear()} Adept Processing Nig LTD. All rights reserved.</p>
          <p>Industrial Chemical &amp; Fertilizer Supply Chain Marketplace</p>
        </div>
      </footer>
    </div>
  );
}
