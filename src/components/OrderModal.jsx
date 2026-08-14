import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getStoredAuthToken } from "../utils/auth";
import "./OrderModal.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://adept-backend-fojr.onrender.com";
const ORDER_API_BASE_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

export const orderRequestFormSchema = z.object({
  quantityMt: z.coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .positive("Quantity must be greater than 0"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Phone number is required"),
  shippingAddress: z.string().min(5, "Shipping address is required"),
});

export default function OrderModal({ isOpen, onClose, onOrderCreated, product }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedQuantity, setSubmittedQuantity] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm({
    resolver: zodResolver(orderRequestFormSchema),
    defaultValues: {
      quantityMt: "",
      contactName: "",
      email: "",
      phone: "",
      shippingAddress: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const resetModal = () => {
    reset();
    setErrorMessage(null);
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmittedQuantity(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const productId = product?._id || product?.productId || product?.product_id || product?.id || product?.slug;
      const quantity = Number(data.quantityMt);
      const unitPrice = Number(
        product?.unit_price ??
        product?.unitPrice ??
        product?.pricePerTon ??
        product?.price ??
        0
      );

      if (!productId || String(productId).trim().length === 0) {
        console.error("Invalid order submission: missing product_id", { product });
        throw new Error("This product is missing a valid MongoDB product ID. Please choose another product.");
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        console.error("Invalid order submission: invalid quantity", { quantity: data.quantityMt });
        throw new Error("Quantity must be greater than 0.");
      }

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        console.error("Invalid order submission: invalid unit_price", { product, unitPrice });
        throw new Error("This product is missing a valid unit price. Please choose another product.");
      }

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const buyerId =
        storedUser?.user_id ||
        storedUser?.buyer_id ||
        storedUser?.id ||
        localStorage.getItem("user_id") ||
        localStorage.getItem("buyer_id") ||
        "";
      const token = getStoredAuthToken();

      const payload = {
        buyer_id: buyerId,
        items: [
          {
            product_id: String(productId),
            quantity,
            unit_price: unitPrice,
          },
        ],
        delivery_details: {
          shipping_address: data.shippingAddress,
          contact_phone: data.phone,
          contact_email: data.email,
        },
      };

      console.log("Submitting Order Payload:", payload);

      const response = await fetch(`${ORDER_API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Server status: ${response.status}`);
      }

      const responseData = await response.json().catch(() => ({}));
      setSubmittedQuantity(data.quantityMt);
      setIsSuccess(true);
      onOrderCreated?.(responseData);
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = (errors) => {
    const firstErr = Object.values(errors)[0]?.message;
    setErrorMessage(firstErr || "Please fix input errors.");
  };

  const modalContent = (
    <div className="order-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="order-modal-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
        {isSuccess ? (
          <div className="order-modal-success py-6 text-center">
            <div className="order-modal-success-icon mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
            <h3 className="order-modal-success-title mt-4 text-xl font-bold">Request Submitted!</h3>
            <p className="order-modal-success-message mt-2 text-sm text-gray-600">
              Your request for {submittedQuantity} metric tons of {product?.name || product?.title || "this product"} has been submitted.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="order-modal-primary-action mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="order-modal-header flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h3 className="order-modal-title text-lg font-bold">Request Quote / Order</h3>
                <p className="order-modal-product text-xs font-medium text-green-700">{product?.name || product?.title || "Urea 46% Granular"}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close order modal"
                className="order-modal-icon-button rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <form
              id="order-form"
              onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
              className="order-modal-form mt-4 space-y-3 text-left"
            >
          <div>
            <label className="block text-xs font-semibold text-gray-700">Quantity (Metric Tons)</label>
            <input
              {...register("quantityMt")}
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 50"
              className="order-modal-input mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Contact Name</label>
            <input
              {...register("contactName")}
              type="text"
              placeholder="Your name"
              className="order-modal-input mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Email Address</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="order-modal-input mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Phone Number</label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="+234..."
              className="order-modal-input mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Shipping Address</label>
            <textarea
              {...register("shippingAddress")}
              rows={2}
              placeholder="Delivery address"
              className="order-modal-input mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-green-600 focus:outline-none"
            />
          </div>

            </form>

            {errorMessage && (
              <div className="order-modal-error mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="order-modal-actions mt-5 flex items-center justify-end gap-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="order-modal-secondary-action rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                type="submit"
                form="order-form"
                disabled={isSubmitting}
                className="order-modal-submit rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
