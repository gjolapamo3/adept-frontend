import React, { useState } from 'react';
import Marketplace from './pages/Marketplace';
import SupplierDashboard from './pages/SupplierDashboard';
import EscrowOrderTracker from './components/escrow/EscrowOrderTracker';

const TAB_KEYS = {
  MARKETPLACE: 'marketplace',
  SUPPLIER: 'supplier',
  ORDERS: 'orders',
};

const VALID_TABS = new Set(Object.values(TAB_KEYS));

const normalizeTabKey = (tabKey) => {
  if (typeof tabKey !== 'string') {
    return TAB_KEYS.MARKETPLACE;
  }

  const trimmedKey = tabKey.trim();
  return VALID_TABS.has(trimmedKey) ? trimmedKey : TAB_KEYS.MARKETPLACE;
};

class TabContentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Something went wrong while rendering this tab.',
    };
  }

  componentDidCatch(error) {
    console.error('Tab content render crash:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props?.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-left">
            <h2 className="text-base font-semibold text-red-800">This section failed to load</h2>
            <p className="mt-2 text-sm text-red-700">
              {this.state.errorMessage || 'An unexpected error occurred. You can safely return to Marketplace.'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Return to Marketplace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const normalizeOrderReference = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }

  if (input && typeof input === 'object') {
    const fromObject = input.reference ?? input.orderReference ?? input.orderId ?? input.id;
    if (fromObject != null) {
      return String(fromObject).trim();
    }
  }

  if (input == null) {
    return '';
  }

  return String(input).trim();
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.MARKETPLACE);
  const [latestOrderReference, setLatestOrderReference] = useState('');

  const setActiveTabSafely = (nextTab) => {
    try {
      setActiveTab((currentTab) => {
        const safeCurrent = normalizeTabKey(currentTab);
        const safeNext = normalizeTabKey(nextTab);
        return safeNext || safeCurrent || TAB_KEYS.MARKETPLACE;
      });
    } catch (error) {
      console.error('Tab switch failed:', error);
      setActiveTab(TAB_KEYS.MARKETPLACE);
    }
  };

  const handleOrderCreated = (referencePayload) => {
    try {
      const reference = normalizeOrderReference(referencePayload);
      setLatestOrderReference(reference);
      setActiveTabSafely(TAB_KEYS.ORDERS);
    } catch (error) {
      console.error('Order-created transition failed:', error);
      setLatestOrderReference('');
      setActiveTabSafely(TAB_KEYS.MARKETPLACE);
    }
  };

  const renderActiveTab = () => {
    try {
      const safeTab = normalizeTabKey(activeTab);

      if (safeTab === TAB_KEYS.SUPPLIER) {
        return <SupplierDashboard />;
      }

      if (safeTab === TAB_KEYS.ORDERS) {
        return (
          <TabContentErrorBoundary onReset={() => setActiveTabSafely(TAB_KEYS.MARKETPLACE)}>
            <EscrowOrderTracker
              key={latestOrderReference || 'orders-default'}
              initialReference={latestOrderReference || ''}
            />
          </TabContentErrorBoundary>
        );
      }

      return <Marketplace onOrderCreated={handleOrderCreated} />;
    } catch (error) {
      console.error('Tab render fallback triggered:', error);
      return <Marketplace onOrderCreated={handleOrderCreated} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:h-16 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-900 text-lg shadow-sm">
              A
            </div>
            <div className="min-w-0">
              <span className="dashboard-title block font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                Adept Processing
              </span>
              <span className="mt-1 block text-xs font-semibold text-emerald-400">
                B2B Marketplace
              </span>
            </div>
          </div>

          <nav className="filter-bar w-full sm:w-auto flex flex-wrap items-center justify-start sm:justify-end gap-2 text-sm font-medium">
            <button
              onClick={() => setActiveTabSafely(TAB_KEYS.MARKETPLACE)}
              className={`px-3 py-2 rounded-md transition ${
                activeTab === TAB_KEYS.MARKETPLACE
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTabSafely(TAB_KEYS.SUPPLIER)}
              className={`px-3 py-2 rounded-md transition ${
                activeTab === TAB_KEYS.SUPPLIER
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Supplier Portal
            </button>
            <button
              onClick={() => setActiveTabSafely(TAB_KEYS.ORDERS)}
              className={`px-3 py-2 rounded-md transition ${
                activeTab === TAB_KEYS.ORDERS
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Escrow Orders
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{renderActiveTab()}</main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} Adept Processing Nig LTD. All rights reserved.</p>
          <p>Industrial Chemical & Fertilizer Supply Chain Marketplace</p>
        </div>
      </footer>
    </div>
  );
}
