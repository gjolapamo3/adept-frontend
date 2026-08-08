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
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 px-3 py-2.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2.5 sm:flex-row">
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-600/20 text-sm font-bold text-indigo-400">
                A
              </div>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs font-bold tracking-wide text-white sm:text-sm">
                  ADEPT PROCESSING
                </span>
                <span className="inline-flex items-center rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium whitespace-nowrap text-emerald-400">
                  <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="mr-1 hidden flex-col text-right lg:flex">
                <span className="text-xs font-medium text-slate-200">G. Jolapamo</span>
                <span className="text-[9px] font-mono text-indigo-400">TRADING DESK</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                Exit
              </button>
            </div>
          </div>

          <nav className="flex w-full items-center justify-center gap-1 overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/80 p-1 no-scrollbar sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Spot Market
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('escrow')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'escrow'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Escrow & Settlements
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('supplier')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
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
