import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  fetchSupplierListings,
  createProductListing,
  updateProductStock,
} from '../services/supplierService';
import {
  productListingSchema,
  updateProductStockSchema,
} from '../shared/schemas';
import './SupplierDashboard.css';

const INITIAL_FORM = {
  name: '',
  category: '',
  description: '',
  currency: 'NGN',
  pricePerTon: '',
  stock: '',
};

export default function SupplierDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [draftUpdates, setDraftUpdates] = useState({});
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productListingSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: INITIAL_FORM,
  });

  const loadListings = async () => {
    try {
      setError('');
      const data = await fetchSupplierListings();
      const nextListings = Array.isArray(data) ? data : data?.data || data?.products || [];
      setListings(nextListings);
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load supplier listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleCreateListing = async (formValues) => {
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await createProductListing(formValues);
      reset(INITIAL_FORM);
      setSuccessMessage('Product listing created successfully.');
      await loadListings();
    } catch (requestError) {
      setError(requestError?.message || 'Unable to create the product listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraftChange = (productId, field, value) => {
    setDraftUpdates((current) => ({
      ...current,
      [productId]: {
        stock: current[productId]?.stock ?? '',
        pricePerTon: current[productId]?.pricePerTon ?? '',
        [field]: value,
      },
    }));
  };

  const handleUpdateListing = async (productId) => {
    const draft = draftUpdates[productId] || {};
    const payload = {};

    if (draft.stock !== '') {
      payload.stock = Number(draft.stock);
    }

    if (draft.pricePerTon !== '') {
      payload.pricePerTon = Number(draft.pricePerTon);
    }

    if (Object.keys(payload).length === 0) {
      setError('Enter a stock or price update before saving.');
      return;
    }

    try {
      const parsed = updateProductStockSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Invalid update payload.');
      }

      setError('');
      setSuccessMessage('');
      await updateProductStock(productId, parsed.data);
      setSuccessMessage('Listing updated successfully.');
      setDraftUpdates((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      await loadListings();
    } catch (requestError) {
      setError(requestError?.message || 'Unable to update the listing.');
    }
  };

  return (
    <div className="supplier-portal-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <section className="supplier-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Supplier Workspace
            </p>
            <h1 className="supplier-workspace-title mt-2 text-3xl font-bold text-slate-900">Manage listings and live stock</h1>
            <p className="supplier-workspace-subtitle mt-3 max-w-2xl text-sm text-slate-600">
              Publish new chemical listings, adjust tonnage, and keep pricing current for marketplace buyers.
            </p>
          </div>
          <button
            type="button"
            onClick={loadListings}
            className="btn-secondary"
          >
            Refresh Listings
          </button>
        </div>
      </section>

      {(error || successMessage) && (
        <section className="space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-[1.1fr_1.4fr]">
        <form onSubmit={handleSubmit(handleCreateListing)} className="supplier-card space-y-4" noValidate>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Product Listing</h2>
            <p className="mt-1 text-sm text-slate-500">Add a fresh offer for buyers searching the marketplace.</p>
          </div>

          <input
            {...register('name')}
            placeholder="Product name"
            className="supplier-input"
          />
          {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
          <input
            {...register('category')}
            placeholder="Category"
            className="supplier-input"
          />
          {errors.category ? <p className="text-xs text-red-600">{errors.category.message}</p> : null}
          <textarea
            {...register('description')}
            placeholder="Product description"
            rows="4"
            className="supplier-input supplier-textarea"
          />
          {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <input
              {...register('currency')}
              placeholder="Currency"
              className="supplier-input"
            />
            <input
              {...register('pricePerTon')}
              type="number"
              min="0"
              placeholder="Price per ton"
              className="supplier-input"
            />
            <input
              {...register('stock')}
              type="number"
              min="0"
              placeholder="Stock tons"
              className="supplier-input"
            />
          </div>
          {errors.currency ? <p className="text-xs text-red-600">{errors.currency.message}</p> : null}
          {errors.pricePerTon ? <p className="text-xs text-red-600">{errors.pricePerTon.message}</p> : null}
          {errors.stock ? <p className="text-xs text-red-600">{errors.stock.message}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>

        <section className="supplier-card">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Managed Listings</h2>
              <p className="mt-1 text-sm text-slate-500">Update live stock tons or revise price per ton.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {listings.length} Listings
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading supplier listings...</div>
          ) : listings.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No supplier listings found yet.</div>
          ) : (
            <div className="mt-6 space-y-4">
              {listings.map((listing, index) => {
                const listingId = listing.id || listing._id || `listing-${index}`;
                const draft = draftUpdates[listingId] || {};
                const currency = listing.currency || 'NGN';
                const stockValue = draft.stock ?? '';
                const priceValue = draft.pricePerTon ?? '';

                return (
                  <article key={listingId} className="supplier-listing-card">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 border border-emerald-100">
                          {listing.category || 'General'}
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">{listing.name || 'Unnamed Product'}</h3>
                        <p className="mt-2 text-sm text-slate-600">{listing.description || 'No description provided.'}</p>
                        <div className="mt-4 flex flex-wrap gap-6 text-sm">
                          <div>
                            <p className="text-slate-500">Current Price</p>
                            <p className="font-semibold text-slate-900">
                              {currency} {Number(listing.pricePerTon || listing.price || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Available Stock</p>
                            <p className="font-semibold text-slate-900">
                              {Number(listing.stock || 0).toLocaleString()} tons
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
                        <input
                          type="number"
                          min="0"
                          value={stockValue}
                          onChange={(event) => handleDraftChange(listingId, 'stock', event.target.value)}
                          placeholder="New stock tons"
                          className="supplier-input"
                        />
                        <input
                          type="number"
                          min="0"
                          value={priceValue}
                          onChange={(event) => handleDraftChange(listingId, 'pricePerTon', event.target.value)}
                          placeholder="New price per ton"
                          className="supplier-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateListing(listingId)}
                          className="sm:col-span-2 btn-secondary"
                        >
                          Save Stock Update
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}