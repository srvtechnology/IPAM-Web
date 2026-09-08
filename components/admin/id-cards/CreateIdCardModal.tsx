"use client";

import { useState, type FormEvent } from "react";
import { useIdCardOrders } from "@/hooks/admin/useIdCardOrders";

const COURIER_OPTIONS = ["DHL_EXPRESS_RUSH", "INTL_AIR_CARGO", "CAMPUS_DESK", "PROVINCIAL_POST"];
const TIER_OPTIONS = ["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"];

export default function CreateIdCardModal({ onClose }: { onClose: () => void }) {
  const { createOrder, loading, error } = useIdCardOrders();
  const [form, setForm] = useState({
    studentName: "",
    regNo: "",
    deliveryAddress: "",
    courierType: COURIER_OPTIONS[0],
    cardTier: TIER_OPTIONS[0],
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createOrder(form);
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">New ID Card Order</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Student name
            <input
              required
              value={form.studentName}
              onChange={(e) => set("studentName", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Registration No.
            <input
              required
              value={form.regNo}
              onChange={(e) => set("regNo", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Card tier
            <select
              value={form.cardTier}
              onChange={(e) => set("cardTier", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none"
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Delivery address
            <input
              required
              value={form.deliveryAddress}
              onChange={(e) => set("deliveryAddress", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Courier type
            <select
              value={form.courierType}
              onChange={(e) => set("courierType", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none"
            >
              {COURIER_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
