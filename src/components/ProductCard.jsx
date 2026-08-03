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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
        <div>
          <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-md bg-gray-100">
            {image ? (
              <img src={image} alt={name || 'Product image'} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                No image available
              </div>
            )}
          </div>

          <p className="mb-2 inline-flex rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
            {category || 'General'}
          </p>
          <h3 className="text-lg font-bold text-gray-900">{name || 'Unnamed Product'}</h3>
          {description ? (
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">{description}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-400">No description available.</p>
          )}
        </div>

        <div className="border-t pt-3 mt-2 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Price per Ton</p>
            <p className="text-xl font-extrabold text-emerald-800">
              {currency} {Number(displayPrice).toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition"
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