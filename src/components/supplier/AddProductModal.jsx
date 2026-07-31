import React, { useState } from 'react';

export default function AddProductModal({ isOpen, onClose, onProductCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Fertilizer',
    grade: 'Agro Grade',
    purity: '99%',
    pricePerTon: '',
    availableTonnage: '',
    packaging: '50kg Bags',
    originLocation: 'Kano, Nigeria',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (onProductCreated) {
        await onProductCreated(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-bold text-slate-900">List New Chemical Batch</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 font-bold text-slate-400 hover:text-slate-600"
            aria-label="Close add product modal"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
              Product Name / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Granular Urea (46% N)"
              value={formData.title}
              onChange={handleChange('title')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Category
              </label>
              <select
                value={formData.category}
                onChange={handleChange('category')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="Fertilizer">Fertilizer</option>
                <option value="Pesticide">Pesticide</option>
                <option value="Herbicide">Herbicide</option>
                <option value="Industrial Chemical">Industrial Chemical</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Grade
              </label>
              <select
                value={formData.grade}
                onChange={handleChange('grade')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="Agro Grade">Agro Grade</option>
                <option value="Tech Grade">Tech Grade</option>
                <option value="Industrial Grade">Industrial Grade</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Purity Level
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 99.5%"
                value={formData.purity}
                onChange={handleChange('purity')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Price per Ton (NGN)
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 450000"
                value={formData.pricePerTon}
                onChange={handleChange('pricePerTon')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Available Tonnage
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 500"
                value={formData.availableTonnage}
                onChange={handleChange('availableTonnage')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Packaging
              </label>
              <input
                type="text"
                placeholder="e.g. 50kg Bags / Bulk"
                value={formData.packaging}
                onChange={handleChange('packaging')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
              Origin Location
            </label>
            <input
              type="text"
              placeholder="e.g. Port Harcourt, Nigeria"
              value={formData.originLocation}
              onChange={handleChange('originLocation')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Add any product details, certifications, or delivery notes"
              value={formData.description}
              onChange={handleChange('description')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Publishing Listing...' : 'Publish Chemical Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
