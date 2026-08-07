import React, { useState } from 'react';
import OrderModal from './OrderModal';

class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    console.error('OrderModal render error:', error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return this.props.fallback(error);
    }
    return this.props.children;
  }
}

export default function ProductCard({ product, onOrderCreated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRenderError, setModalRenderError] = useState('');

  const {
    name,
    description,
    category,
    image,
    currency = 'NGN',
    pricePerTon,
    price,
    unitPrice,
  } = product || {};

  const displayPrice = pricePerTon ?? price ?? unitPrice ?? 0;

  const handleOpenModal = () => {
    setModalRenderError('');
    setIsModalOpen(true);
  };

  const handleModalError = (error) => {
    const message = error?.message || 'Unknown modal render error';
    setModalRenderError(message);
  };

  const modalFallback = (error) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-5 shadow-xl">
        <h4 className="text-base font-semibold text-red-700">Order modal failed to render</h4>
        <p className="mt-2 text-sm text-gray-700">
          {error?.message || 'Unexpected modal error.'}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="product-card">
        <div>
          <div className="product-card__media">
            {image ? (
              <img src={image} alt={name || 'Product image'} className="product-card__image" loading="lazy" />
            ) : (
              <div className="product-card__empty-state">
                No image available
              </div>
            )}
          </div>

          <p className="category-tag">
            {category || 'General'}
          </p>
          <h3>{name || 'Unnamed Product'}</h3>
          {description ? (
            <p className="product-card__description">{description}</p>
          ) : (
            <p className="product-card__description product-card__description--muted">No description available.</p>
          )}
        </div>

        <div className="product-card__footer">
          <div>
            <p className="product-card__label">Price per Ton</p>
            <p className="price-tag">
              {currency} {Number(displayPrice).toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="btn-order"
          >
            Order / Quote
          </button>
        </div>
      </div>

      {modalRenderError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-left text-xs text-red-700">
          Modal error: {modalRenderError}
        </div>
      )}

      {isModalOpen && (
        <ModalErrorBoundary onError={handleModalError} fallback={modalFallback}>
          <OrderModal
            product={product}
            onClose={() => setIsModalOpen(false)}
            onOrderCreated={onOrderCreated}
          />
        </ModalErrorBoundary>
      )}
    </>
  );
}