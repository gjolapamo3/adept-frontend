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

  const handleSsoSuccess = (profile) => {
    setUser(profile);
    setActiveTab('marketplace');
  };

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  if (!isAuthenticated) {
    return <SSOGateway onSuccess={handleSsoSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:h-16 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-900 text-lg shadow-sm">
              A
            </div>
            <div className="min-w-0">
              <span className="dashboard-title block font-bold text-base sm:text-lg tracking-tight text-white leading-tight">Adept Processing</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded-full border border-slate-700">
                B2B Marketplace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
              {user?.name || 'Signed in'}
            </span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('adept_auth_token');
                localStorage.removeItem('adept_user_role');
                setUser(null);
                setActiveTab('marketplace');
              }}
              className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 transition hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>

          <nav className="filter-bar w-full sm:w-auto flex items-center justify-center sm:justify-end gap-1 sm:gap-2 text-sm font-medium">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-2 rounded-md transition ${
                activeTab === 'marketplace'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab('supplier')}
              className={`px-3 py-2 rounded-md transition ${
                activeTab === 'supplier'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Supplier Portal
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3 py-2 rounded-md transition ${
                activeTab === 'pricing'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Pricing Dashboard
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-md transition ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Escrow Orders
            </button>
          </nav>
        </div>
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
            <ShipmentTracking shipment={shipmentPayload} />
            <EscrowOrderTracker initialReference={latestOrderReference} />
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
