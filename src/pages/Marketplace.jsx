import React from 'react';
import LiveStreamBadge from '../components/common/LiveStreamBadge';
import useMarketplaceEvents from '../hooks/useMarketplaceEvents';

const sampleProducts = [
  {
    id: 1,
    name: 'Urea 46% Granular',
    description: 'Premium nitrogen fertilizer for large-scale agricultural supply chains.',
    category: 'Fertilizer',
    pricePerTon: 185000,
    currency: 'NGN',
    image: '',
  },
  {
    id: 2,
    name: 'NPK 20:10:10',
    description: 'Balanced nutrient blend for mixed crop and commercial farming needs.',
    category: 'Fertilizer',
    pricePerTon: 210000,
    currency: 'NGN',
    image: '',
  },
  {
    id: 3,
    name: 'Ammonium Sulphate',
    description: 'High-purity industrial-grade fertilizer for demand planning and bulk procurement.',
    category: 'Industrial Chemical',
    pricePerTon: 175000,
    currency: 'NGN',
    image: '',
  },
];

export default function Marketplace() {
  const {
    products,
    connectionStatus,
    isConnected,
    error: streamError,
    reconnectAttempt,
    lastEventAt,
    reconnect,
  } = useMarketplaceEvents(sampleProducts, {
    eventSourceUrl: '/marketplace/events',
  });

  const liveProducts = products.length > 0 ? products : sampleProducts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Trusted Supply Marketplace</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Industrial chemicals and fertilizer sourcing</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Browse verified products, compare ton pricing, and place escrow-backed order requests with confidence.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Secure B2B procurement</p>
            <p className="mt-1">Escrow tracked • Delivery coordination • Bulk pricing</p>
            <LiveStreamBadge
              className="mt-3"
              connectionStatus={connectionStatus}
              isConnected={isConnected}
              reconnectAttempt={reconnectAttempt}
              lastEventAt={lastEventAt}
              error={streamError}
              onReconnect={reconnect}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {liveProducts.map((product) => (
          <div
            key={product.id || product.productId || product.name}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex h-36 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
              {product.image ? product.image : 'Product image'}
            </div>
            <p className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {product.category || 'Product'}
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{product.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs text-slate-500">Price per Ton</p>
                <p className="text-lg font-bold text-slate-900">
                  {product.currency || 'NGN'}{' '}
                  {Number(
                    product.pricePerTon ??
                      product.price ??
                      product.unitPrice ??
                      0
                  ).toLocaleString()}
                </p>
                {product.stockTonnage != null || product.inventoryTons != null ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Stock:{' '}
                    {Number(
                      product.stockTonnage ?? product.inventoryTons
                    ).toLocaleString()}{' '}
                    tons
                  </p>
                ) : null}
              </div>
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Order / Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
