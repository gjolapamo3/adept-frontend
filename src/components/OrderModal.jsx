import React from 'react';

const OrderModal = ({ product, onClose }) => {
  if (!product) return null;

  // Normalize pricing fallbacks
  const name = product.name || 'Product';
  const currency = product.currency || '$';
  const price = product.pricePerTon ?? product.price ?? product.unitPrice ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-md rounded-xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-emerald-400">Request Quote / Order</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
            <p className="text-sm font-medium text-slate-200">{name}</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {currency}
              {price}{' '}
              <span className="text-xs text-slate-400 font-normal">/ MT</span>
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Direct orders and quote lockouts are currently processed in demo mode.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
