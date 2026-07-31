import React from 'react';

export default function OrderModal({ product, onClose }) {
  const name = product?.name || 'Unnamed Product';
  const currency = product?.currency || 'NGN';
  const pricePerTon = Number(product?.pricePerTon || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">Order / Quote Request</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close order modal"
          >
            x
          </button>
        </div>

        <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="text-sm text-gray-600">
            Price per Ton: <span className="font-semibold">{currency} {pricePerTon.toLocaleString()}</span>
          </p>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Connect this modal to your order form or quote workflow.
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
