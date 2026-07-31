import React, { useState } from 'react';
import Marketplace from './pages/Marketplace';
import SupplierDashboard from './pages/SupplierDashboard';
import EscrowOrderTracker from './components/escrow/EscrowOrderTracker';

export default function App() {
  const [activeTab, setActiveTab] = useState('marketplace');

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
        {activeTab === 'marketplace' && <Marketplace />}
        {activeTab === 'supplier' && <SupplierDashboard />}
        {activeTab === 'orders' && <EscrowOrderTracker />}
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
