import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const OrderModal = ({ product, onClose }) => {
  if (!product) return null;

  // Standardize currency formatting
  const name = product.name || 'Product';
  const rawCurrency = (product.currency || 'NGN').trim();
  const currency = rawCurrency ? `${rawCurrency} ` : 'NGN ';
  const price = product.pricePerTon ?? product.price ?? product.unitPrice ?? 0;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 text-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-emerald-400">Request Quote / Order</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white px-2 py-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-3 text-left">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <p className="text-sm font-semibold text-slate-100">{name}</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">
              {currency}{price.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ MT</span>
            </p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct orders and quote lockouts are currently processed in demo mode.
          </p>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default OrderModal;
