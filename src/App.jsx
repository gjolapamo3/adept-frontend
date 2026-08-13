import React, { useEffect, useMemo, useState } from 'react';
import Marketplace from './pages/Marketplace';
import SupplierDashboard from './pages/SupplierDashboard';
import EscrowOrderTracker from './components/escrow/EscrowOrderTracker';
import SSOGateway from './components/SSOGateway';
import PricingDashboard from './components/PricingDashboard';
import ShipmentTracking from './components/ShipmentTracking';
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 px-3 py-2.5 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-sm">
                  A
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-wide text-xs sm:text-sm whitespace-nowrap">
                    ADEPT PROCESSING
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    LIVE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right mr-1">
                  <span className="text-xs font-medium text-slate-200">G. Jolapamo</span>
                  <span className="text-[9px] text-indigo-400 font-mono">TRADING DESK</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
                >
                  Exit
                </button>
              </div>
            </div>

            <nav className="w-full md:w-auto flex items-center justify-between md:justify-start gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
              <button
                type="button"
                onClick={() => setActiveTab('marketplace')}
                className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-all text-center whitespace-nowrap ${
                  activeTab === 'marketplace'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Spot Market
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-all text-center whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Escrow & Settlements
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('supplier')}
                className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-all text-center whitespace-nowrap ${
                  activeTab === 'supplier'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hub Logistics
              </button>
            </nav>
          </div>
        </header>

      <main className="flex-1">
        {activeTab === 'marketplace' && <Marketplace onOrderCreated={handleOrderCreated} onOrderSuccess={handleOrderSuccess} />}
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
            <ShipmentTracking shipment={shipmentPayload} activeReference={selectedEscrowRef || latestOrderReference} />
            <EscrowOrderTracker initialReference={selectedEscrowRef || latestOrderReference} onTrack={handleTrackReference} />
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
