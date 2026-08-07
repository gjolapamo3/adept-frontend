import React from 'react';
import LiveStreamBadge from '../components/common/LiveStreamBadge';
import ProductCard from '../components/ProductCard';
import useMarketplaceEvents from '../hooks/useMarketplaceEvents';
import './Marketplace.css';

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

export default function Marketplace({ onOrderCreated }) {
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
    <div className="marketplace-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="marketplace-hero-card">
        <div className="marketplace-hero-layout">
          <div>
            <p className="marketplace-eyebrow">Trusted Supply Marketplace</p>
            <h1>Industrial chemicals and fertilizer sourcing</h1>
            <p>
              Browse verified products, compare ton pricing, and place escrow-backed order requests with confidence.
            </p>
          </div>
          <div className="marketplace-status-card">
            <p>Secure B2B procurement</p>
            <p className="marketplace-status-copy">Escrow tracked • Delivery coordination • Bulk pricing</p>
            <LiveStreamBadge
              className="marketplace-stream-badge"
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

      <div className="product-grid">
        {liveProducts.map((product) => (
          <ProductCard
            key={product.id || product.productId || product.name}
            product={product}
            onOrderCreated={onOrderCreated}
          />
        ))}
      </div>
    </div>
  );
}
