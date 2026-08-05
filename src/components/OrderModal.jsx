import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { placeOrder } from '../services/api';

const OrderModal = ({ product, onClose, onOrderCreated }) => {
  const safeProduct = product && typeof product === 'object' ? product : {};

  const name = safeProduct.name || 'Product';
  const rawCurrency = String(safeProduct.currency || 'NGN').trim();
  const currency = rawCurrency ? `${rawCurrency} ` : 'NGN ';
  const price = Number(safeProduct.pricePerTon ?? safeProduct.price ?? safeProduct.unitPrice ?? 0);

  const [formData, setFormData] = useState({
    quantityMt: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    deliveryNotes: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const closeTimerRef = useRef(null);

  const fieldGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'rgb(203, 213, 225)',
  };

  const controlStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    border: '1px solid rgb(51, 65, 85)',
    backgroundColor: 'rgb(30, 41, 59)',
    color: '#ffffff',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    lineHeight: 1.35,
  };

  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleChange = (event) => {
    const { name: fieldName, value } = event.target;
    setFormData((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const quantityValue = Number(formData.quantityMt);
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setErrorMessage('Enter a valid quantity in metric tons.');
      return;
    }

    if (!formData.contactEmail.trim() && !formData.contactPhone.trim()) {
      setErrorMessage('Provide either a contact email or phone number.');
      return;
    }

    const payload = {
      productId: safeProduct.id ?? safeProduct.productId,
      productName: name,
      quantityMt: quantityValue,
      unitPrice: price,
      currency: rawCurrency || 'NGN',
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      deliveryNotes: formData.deliveryNotes.trim(),
    };

    try {
      setSubmitting(true);
      const response = await placeOrder(payload);

      if (response?.success === false || response?.error) {
        throw new Error(response?.message || response?.error || 'Unable to submit request right now.');
      }

      const responseReference = response?.data?.reference || response?.reference || response?.orderId;
      const fallbackReference = `ADEPT-${Date.now().toString().slice(-8)}`;
      const orderRef = String(responseReference || fallbackReference);
      setSuccessMessage(
        `Request submitted successfully. Reference: ${orderRef}`
      );

      if (onOrderCreated) {
        onOrderCreated(orderRef);
      }

      setFormData({
        quantityMt: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        deliveryNotes: '',
      });

      closeTimerRef.current = window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (requestError) {
      setErrorMessage(requestError?.message || 'Unable to submit request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 p-4 backdrop-blur-md"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '100vh',
        padding: '16px',
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-auto flex min-h-full w-full max-w-sm items-center justify-center"
        style={{
          margin: '0 auto',
          minHeight: '100%',
          width: '100%',
          maxWidth: '24rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="relative w-full max-h-[90dvh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '90dvh',
            overflowY: 'auto',
            borderRadius: '0.75rem',
            border: '1px solid rgb(51, 65, 85)',
            backgroundColor: 'rgb(15, 23, 42)',
            padding: '1.5rem',
            color: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 id="order-modal-title" className="text-base font-bold text-emerald-400">Request Quote / Order</h3>
            <button
              onClick={onClose}
              type="button"
              className="px-2 py-1 text-lg font-bold text-slate-400 hover:text-white"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 py-4 text-left">
            <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3">
              <p className="text-sm font-semibold text-slate-100">{name}</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">
                {currency}{price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ MT</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div style={fieldGroupStyle}>
              <label htmlFor="quantityMt" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                Quantity (MT)
              </label>
              <input
                id="quantityMt"
                name="quantityMt"
                type="number"
                min="1"
                value={formData.quantityMt}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                style={controlStyle}
                placeholder="e.g. 50"
                required
              />
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="contactName" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                Contact Name
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                style={controlStyle}
                placeholder="Your name"
              />
            </div>

            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={fieldGroupStyle}>
                <label htmlFor="contactEmail" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                  Email
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  style={controlStyle}
                  placeholder="you@company.com"
                />
              </div>
              <div style={fieldGroupStyle}>
                <label htmlFor="contactPhone" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                  Phone
                </label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  style={controlStyle}
                  placeholder="+234..."
                />
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="deliveryNotes" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                Delivery Notes
              </label>
              <textarea
                id="deliveryNotes"
                name="deliveryNotes"
                rows="3"
                value={formData.deliveryNotes}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                style={{
                  ...controlStyle,
                  resize: 'vertical',
                  minHeight: '5rem',
                }}
                placeholder="Preferred location, timeline, packaging requirements..."
              />
            </div>

            {errorMessage && (
              <p className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                {successMessage}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={onClose}
                type="button"
                disabled={submitting}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default OrderModal;
