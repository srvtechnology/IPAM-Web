"use client";

import { useState } from "react";
import { useIdCardOrders } from "@/hooks/admin/useIdCardOrders";
import type { IdCardOrderRow } from "./IdCardIssuanceDeskView";

const STATUS_FLOW: IdCardOrderRow["status"][] = [
  "IN_PRINT_PRESS",
  "QUALITY_CHECK",
  "READY_COURIER",
  "DISPATCHED",
  "DELIVERED",
];

export default function InspectIdCardModal({
  order,
  canWrite,
  onClose,
}: {
  order: IdCardOrderRow;
  canWrite: boolean;
  onClose: () => void;
}) {
  const { updateOrder, loading, error } = useIdCardOrders();
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;

  async function advance() {
    if (!nextStatus) return;
    const result = await updateOrder(order.id, { status: nextStatus });
    if (result) onClose();
  }

  async function saveTracking() {
    const result = await updateOrder(order.id, { trackingCode });
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">{order.orderNumber}</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <dl className="divide-y divide-outline-variant/10 mb-4">
          {[
            ["Student", order.studentName],
            ["Reg. No.", order.regNo],
            ["Card tier", order.cardTier.replaceAll("_", " ")],
            ["Courier", order.courierType.replaceAll("_", " ")],
            ["Delivery address", order.deliveryAddress],
            ["Current status", order.status.replaceAll("_", " ")],
            ["Submitted", new Date(order.submittedDate).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 gap-4">
              <dt className="font-body-compact text-on-surface-variant flex-shrink-0">{label}</dt>
              <dd className="font-body-medium text-on-surface text-right">{value}</dd>
            </div>
          ))}
        </dl>

        {canWrite && (
          <div className="space-y-3">
            <label className="font-body-compact text-on-surface-variant block">
              Tracking code
              <div className="flex gap-2 mt-1">
                <input
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="flex-1 rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={saveTracking}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-surface-container-high font-body-compact text-on-surface hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </label>

            {nextStatus && (
              <button
                type="button"
                onClick={advance}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                Advance to {nextStatus.replaceAll("_", " ")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
