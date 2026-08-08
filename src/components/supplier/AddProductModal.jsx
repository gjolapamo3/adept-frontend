import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productListingSchema } from '../../shared/schemas';

export default function AddProductModal({ isOpen, onClose, onProductCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const defaultValues = {
    title: '',
    category: 'Fertilizer',
    grade: 'Agro Grade',
    purity: '99%',
    pricePerTon: '',
    availableTonnage: '',
    packaging: '50kg Bags',
    originLocation: 'Kano, Nigeria',
    description: 'Chemical product listing',
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productListingSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues,
  });

  if (!isOpen) return null;

  const onSubmit = async (formValues) => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      if (onProductCreated) {
        await onProductCreated(formValues);
      }
      reset(defaultValues);
      onClose();
    } catch (error) {
      console.error('Failed to create product:', error);
      setErrorMessage(error?.message || 'Failed to create product listing.');
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
              Product Name / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Granular Urea (46% N)"
              {...register('title')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
            />
            {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Category
              </label>
              <select
                {...register('category')}
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
                {...register('grade')}
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
                placeholder="e.g. 99.5%"
                {...register('purity')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              />
              {errors.purity ? <p className="mt-1 text-xs text-red-600">{errors.purity.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Price per Ton (NGN)
              </label>
              <input
                type="number"
                placeholder="e.g. 450000"
                {...register('pricePerTon')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              />
              {errors.pricePerTon ? <p className="mt-1 text-xs text-red-600">{errors.pricePerTon.message}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Available Tonnage
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                {...register('availableTonnage')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
              />
              {errors.availableTonnage ? <p className="mt-1 text-xs text-red-600">{errors.availableTonnage.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                Packaging
              </label>
              <input
                type="text"
                placeholder="e.g. 50kg Bags / Bulk"
                {...register('packaging')}
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
              {...register('originLocation')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
            />
            {errors.originLocation ? <p className="mt-1 text-xs text-red-600">{errors.originLocation.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Add any product details, certifications, or delivery notes"
              {...register('description')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
            />
            {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Publishing Listing...' : 'Publish Chemical Listing'}
          </button>
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        </form>
      </div>
    </div>
  );
}
