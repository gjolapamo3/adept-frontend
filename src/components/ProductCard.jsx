import React, { useState } from 'react';
import OrderModal from './OrderModal';

export default function ProductCard({ product }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    name,
    description,
    category,
    image,
    currency = 'NGN',
    pricePerTon,
  } = product || {};

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
              {currency} {Number(pricePerTon || 0).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition"
          >
            Order / Quote
          </button>
        </div>
      </div>

      {isModalOpen && (
        <OrderModal product={product} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}