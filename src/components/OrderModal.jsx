import React from 'react';
import { createPortal } from 'react-dom';

const OrderModal = ({ product, onClose }) => {
  if (!product) return null;

  const name = product.name || 'Product';
  const currency = product.currency || 'NGN ';
  const price = product.pricePerTon ?? product.price ?? product.unitPrice ?? 0;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-emerald-400">Request Quote / Order</h3>
          <button
            onClick={onClose}
            type="button"
            className="px-2 py-1 text-lg font-bold text-slate-400 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 py-4 text-left">
          <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3">
            <p className="text-sm font-semibold text-slate-100">{name}</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              {currency}{price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ MT</span>
            </p>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Direct orders and quote lockouts are currently processed in demo mode.
          </p>
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default OrderModal;
