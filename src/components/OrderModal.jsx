import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { placeOrder } from '../services/api';
import { b2bOrderSchema, orderRequestFormSchema } from '../shared/schemas';

const OrderModal = ({ product, onClose, onOrderCreated, onSuccess }) => {
  const safeProduct = product && typeof product === 'object' ? product : {};

  const name = safeProduct.name || 'Product';
  const rawCurrency = String(safeProduct.currency || 'NGN').trim();
  const currency = rawCurrency ? `${rawCurrency} ` : 'NGN ';
  const price = Number(safeProduct.pricePerTon ?? safeProduct.price ?? safeProduct.unitPrice ?? 0);

  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const closeTimerRef = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid, submitCount, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderRequestFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      productId: String(safeProduct.id ?? safeProduct.productId ?? ''),
      quantityMt: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      deliveryNotes: '',
    },
  });

  const onInvalid = (validationErrors) => {
    const nextFieldErrors = {};
    Object.entries(validationErrors).forEach(([fieldName, error]) => {
      if (error?.message) {
        nextFieldErrors[fieldName] = error.message;
      }
    });
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length === 0) {
      setErrorMessage('Please correct the highlighted fields and try again.');
    }
  };

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
    backgroundColor: 'rgb(30, 41, 59)',
    color: '#ffffff',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    lineHeight: 1.35,
  };

  const fieldNameMap = {
    quantity: 'quantityMt',
  };

  const watchedValues = watch();
  const debugPayload = {
    values: watchedValues,
    errors: Object.fromEntries(
      Object.entries(errors || {}).map(([key, value]) => [key, value?.message || 'Invalid'])
    ),
    isDirty,
    isValid,
    submitCount,
    isSubmitting,
    submitting,
    errorMessage,
    successMessage,
  };

  const getFieldErrorMessage = (fieldName) => {
    const formErrorMessage = errors[fieldName]?.message;
    if (formErrorMessage) {
      return formErrorMessage;
    }
    return fieldErrors[fieldName] || '';
  };

  const getControlStyle = (overrides = {}) => ({
    ...controlStyle,
    ...overrides,
  });

  const getControlClassName = (fieldName) => {
    const hasError = Boolean(getFieldErrorMessage(fieldName));
    const stateClass = hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
      : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';
    return `w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors ${stateClass}`;
  };

  const mapIssuesToFieldErrors = (issues = []) => {
    const nextFieldErrors = {};
    issues.forEach((issue) => {
      const rawFieldName = issue?.path?.[0];
      const mappedFieldName = fieldNameMap[rawFieldName] || rawFieldName;
      if (mappedFieldName && !nextFieldErrors[mappedFieldName]) {
        nextFieldErrors[mappedFieldName] = issue.message;
      }
    });
    return nextFieldErrors;
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

  const onSubmit = async (formValues) => {
    setErrorMessage('');
    setFieldErrors({});
    setSuccessMessage('');

    const payload = {
      productId: String(safeProduct.id ?? safeProduct.productId ?? ''),
      productName: name,
      quantityMt: formValues.quantityMt,
      unitPrice: price,
      currency: rawCurrency || 'NGN',
      contactName: formValues.contactName || '',
      contactEmail: formValues.contactEmail || '',
      contactPhone: formValues.contactPhone || '',
      deliveryNotes: formValues.deliveryNotes || '',
    };

    let parsedPayload;
    try {
      parsedPayload = b2bOrderSchema.parse(payload);
      setFieldErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const nextFieldErrors = mapIssuesToFieldErrors(err.issues);
        setFieldErrors(nextFieldErrors);
        if (Object.keys(nextFieldErrors).length === 0) {
          setErrorMessage(err.issues[0]?.message || 'Invalid order request payload.');
        }
      } else {
        setErrorMessage('Invalid order request payload.');
      }
      return;
    }

    try {
      setSubmitting(true);
      const response = await placeOrder(parsedPayload);

      if (response?.success === false || response?.error) {
        throw new Error(response?.message || response?.error || 'Unable to submit request right now.');
      }

      const responseReference =
        response?.escrowReference ||
        response?.data?.escrowReference ||
        response?.data?.reference ||
        response?.reference ||
        response?.orderId;
      const fallbackReference = `ADEPT-${Date.now().toString().slice(-8)}`;
      const orderRef = String(responseReference || fallbackReference);
      setSuccessMessage(
        `Request submitted successfully. Reference: ${orderRef}`
      );

      if (onSuccess) {
        onSuccess(response);
      }

      if (onOrderCreated) {
        onOrderCreated(orderRef);
      }

      reset({
        productId: String(safeProduct.id ?? safeProduct.productId ?? ''),
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
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-3" noValidate>
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

            <div style={fieldGroupStyle}>
              <label htmlFor="quantityMt" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                Quantity (MT)
              </label>
              <input
                id="quantityMt"
                type="number"
                min="1"
                {...register('quantityMt')}
                className={getControlClassName('quantityMt')}
                style={getControlStyle()}
                aria-invalid={Boolean(getFieldErrorMessage('quantityMt'))}
                placeholder="e.g. 50"
              />
              {getFieldErrorMessage('quantityMt') ? <p className="mt-1 text-xs text-red-400">{getFieldErrorMessage('quantityMt')}</p> : null}
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="contactName" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                Contact Name
              </label>
              <input
                id="contactName"
                type="text"
                {...register('contactName')}
                className={getControlClassName('contactName')}
                style={getControlStyle()}
                aria-invalid={Boolean(getFieldErrorMessage('contactName'))}
                placeholder="Your name"
              />
              {getFieldErrorMessage('contactName') ? <p className="mt-1 text-xs text-red-400">{getFieldErrorMessage('contactName')}</p> : null}
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
                  type="email"
                  {...register('contactEmail')}
                  className={getControlClassName('contactEmail')}
                  style={getControlStyle()}
                  aria-invalid={Boolean(getFieldErrorMessage('contactEmail'))}
                  placeholder="you@company.com"
                />
                {getFieldErrorMessage('contactEmail') ? <p className="mt-1 text-xs text-red-400">{getFieldErrorMessage('contactEmail')}</p> : null}
              </div>
              <div style={fieldGroupStyle}>
                <label htmlFor="contactPhone" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                  Phone
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  {...register('contactPhone')}
                  className={getControlClassName('contactPhone')}
                  style={getControlStyle()}
                  aria-invalid={Boolean(getFieldErrorMessage('contactPhone'))}
                  placeholder="+234..."
                />
                {getFieldErrorMessage('contactPhone') ? <p className="mt-1 text-xs text-red-400">{getFieldErrorMessage('contactPhone')}</p> : null}
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="deliveryNotes" className="mb-1 block text-xs font-semibold text-slate-300" style={labelStyle}>
                Delivery Notes
              </label>
              <textarea
                id="deliveryNotes"
                rows="3"
                {...register('deliveryNotes')}
                className={getControlClassName('deliveryNotes')}
                style={getControlStyle({
                  resize: 'vertical',
                  minHeight: '5rem',
                })}
                aria-invalid={Boolean(getFieldErrorMessage('deliveryNotes'))}
                placeholder="Preferred location, timeline, packaging requirements..."
              />
              {getFieldErrorMessage('deliveryNotes') ? <p className="mt-1 text-xs text-red-400">{getFieldErrorMessage('deliveryNotes')}</p> : null}
            </div>

            {errorMessage && (
              <div className="my-2 rounded-md border border-red-500/50 bg-red-900/50 p-3 text-xs text-red-200">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <p className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                {successMessage}
              </p>
            )}

            <div className="my-2 max-h-32 overflow-auto rounded border border-red-800 bg-slate-900 p-2 text-left font-mono text-xs text-red-400">
              <p className="font-bold text-slate-300">Form Diagnostic State:</p>
              <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-relaxed text-red-300">
                {JSON.stringify(
                  {
                    isSubmitting,
                    isValid,
                    errors: Object.fromEntries(
                      Object.entries(errors || {}).map(([key, value]) => [key, value?.message || 'Invalid'])
                    ),
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="mt-4 flex items-center justify-end gap-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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
