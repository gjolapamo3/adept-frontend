import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://adept-backend-fojr.onrender.com";

export const orderRequestFormSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantityMt: z.coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .positive("Quantity must be greater than 0"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number is required"),
  shippingAddress: z.string().min(5, "Shipping address is required"),
  deliveryNotes: z.string().optional(),
});

export default function OrderModal({ isOpen, onClose, product }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState,
  } = useForm({
    resolver: zodResolver(orderRequestFormSchema),
    defaultValues: {
      productId: product?.id || product?.slug || "urea-46",
      quantityMt: "",
      contactName: "",
      email: "",
      phone: "",
      shippingAddress: "",
      deliveryNotes: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      setErrorMessage(null);
      const productId = product?.id || product?.slug || data.productId || "urea-46";
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const buyerId =
        storedUser?.user_id ||
        storedUser?.buyer_id ||
        storedUser?.id ||
        localStorage.getItem("user_id") ||
        localStorage.getItem("buyer_id") ||
        "";
      const token =
        localStorage.getItem("adept_auth_token") || localStorage.getItem("token");
      const payload = {
        buyer_id: buyerId,
        items: [
          {
            product_id: productId,
            quantity: data.quantityMt,
          },
        ],
        delivery_details: {
          shipping_address: data.shippingAddress,
          contact_phone: data.phone,
        },
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      setSuccessMessage("Request submitted successfully!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit request.");
    }
  };

  const handleInvalidSubmit = (errors) => {
    const firstErr = Object.values(errors)[0]?.message;
    setErrorMessage(firstErr || "Please fix input errors.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Request Quote / Order</h3>
            <p className="text-xs font-medium text-emerald-400">{product?.name || product?.title || "Urea 46% Granular"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form
          id="order-form"
          onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
          className="mt-4 space-y-3 text-left"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300">Quantity (MT)</label>
            <input
              {...register("quantityMt")}
              type="number"
              placeholder="e.g. 50"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Contact Name</label>
            <input
              {...register("contactName")}
              type="text"
              placeholder="Your name"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@company.com"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Phone</label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="+234..."
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Shipping Address</label>
            <textarea
              {...register("shippingAddress")}
              rows={2}
              placeholder="Delivery address"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Delivery Notes</label>
            <textarea
              {...register("deliveryNotes")}
              rows={2}
              placeholder="Preferred location, timeline..."
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </form>

        {errorMessage && (
          <div className="mt-3 rounded-lg bg-red-950/80 p-3 text-xs font-medium text-red-300 border border-red-800">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-3 rounded-lg bg-emerald-950/80 p-3 text-xs font-medium text-emerald-300 border border-emerald-800">
            {successMessage}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-x-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Close
          </button>
          <button
            type="submit"
            form="order-form"
            disabled={formState.isSubmitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50"
          >
            {formState.isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
