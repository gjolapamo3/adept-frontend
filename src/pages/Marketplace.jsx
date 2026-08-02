import React from 'react';
import LiveStreamBadge from '../components/common/LiveStreamBadge';
import ProductCard from '../components/ProductCard';
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {liveProducts.map((product) => (
          <ProductCard
            key={product.id || product.productId || product.name}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
