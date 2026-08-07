import React, { useEffect, useMemo, useState } from 'react';
import Marketplace from './pages/Marketplace';
import SupplierDashboard from './pages/SupplierDashboard';
import EscrowOrderTracker from './components/escrow/EscrowOrderTracker';
import SSOGateway from './components/SSOGateway';
import PricingDashboard from './components/PricingDashboard';
import ShipmentTracking from './components/ShipmentTracking';

export default function App() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [latestOrderReference, setLatestOrderReference] = useState('');
  const [shipmentPayload, setShipmentPayload] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedToken = localStorage.getItem('adept_auth_token');
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
    setLatestOrderReference(reference);
    setActiveTab('orders');
  };

  const handleTrackReference = (reference) => {
    setLatestOrderReference(reference);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="app-header">
        <div className="header-top-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="header-brand">
            <span className="brand-logo-icon">⚡</span>
            <div className="brand-text">
              <h1 className="brand-name">Adept Processing</h1>
              <span className="brand-badge">B2B Marketplace</span>
            </div>
          </div>

          <div className="header-user-menu">
            <span className="user-email" title={user?.email || user?.name || 'Signed in'}>
              {user?.email || user?.name || 'Signed in'}
            </span>
            <button onClick={handleSignOut} className="btn-signout" type="button">
              Sign out
            </button>
          </div>
        </div>

        <nav className="header-nav-bar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`nav-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
              type="button"
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab('supplier')}
              className={`nav-tab ${activeTab === 'supplier' ? 'active' : ''}`}
              type="button"
            >
              Supplier Portal
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`nav-tab ${activeTab === 'pricing' ? 'active' : ''}`}
              type="button"
            >
              Pricing Dashboard
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
              type="button"
            >
              My Escrow Orders
            </button>
          </nav>
      </header>

      <main className="flex-1">
        {activeTab === 'marketplace' && <Marketplace onOrderCreated={handleOrderCreated} />}
        {activeTab === 'supplier' && <SupplierDashboard />}
        {activeTab === 'pricing' && (
          <PricingDashboard onOpenShipmentTracking={(payload) => {
            setShipmentPayload(payload);
            setLatestOrderReference(payload?.orderId || '');
            setActiveTab('orders');
          }} />
        )}
        {activeTab === 'orders' && (
          <div className="space-y-6 py-6">
            <ShipmentTracking shipment={shipmentPayload} activeReference={latestOrderReference} />
            <EscrowOrderTracker initialReference={latestOrderReference} onTrack={handleTrackReference} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} Adept Processing Nig LTD. All rights reserved.</p>
          <p>Industrial Chemical & Fertilizer Supply Chain Marketplace</p>
        </div>
      </footer>
    </div>
  );
}
