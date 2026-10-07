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
  onUpdated,
}: {
  order: IdCardOrderRow;
  canWrite: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const { updateOrder, updatePhysicalCardOrder, loading, error } = useIdCardOrders();
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");
  const [collectingCod, setCollectingCod] = useState(false);

  const isAlumniSelfService = order.sourceType === "ALUMNI_PORTAL";
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;

  async function advance() {
    if (!nextStatus) return;
    const result = isAlumniSelfService
      ? await updatePhysicalCardOrder(order.id, { status: nextStatus })
      : await updateOrder(order.id, { status: nextStatus });
    if (result) {
      onUpdated?.();
      onClose();
    }
  }

  async function saveTracking() {
    const result = isAlumniSelfService
      ? await updatePhysicalCardOrder(order.id, { trackingCode })
      : await updateOrder(order.id, { trackingCode });
    if (result) {
      onUpdated?.();
      onClose();
    }
  }

  async function handleMarkCodPaid() {
    if (!confirm(`Confirm collection of ${order.currency ?? "USD"} ${order.amount} for COD order ${order.orderNumber}?`)) {
      return;
    }
    setCollectingCod(true);
    try {
      const result = await updatePhysicalCardOrder(order.id, { paymentStatus: "PAID" });
      if (result) {
        onUpdated?.();
        onClose();
      }
    } finally {
      setCollectingCod(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-on-surface">{order.orderNumber}</h2>
              {isAlumniSelfService ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                  Alumni Portal Order
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-highest text-on-surface-variant">
                  Registrar Walk-in
                </span>
              )}
            </div>
            <p className="font-body-compact text-xs text-on-surface-variant mt-0.5">
              Submitted on {new Date(order.submittedDate).toLocaleString()}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        {/* Payment Summary Box for Alumni Self-Service Orders */}
        {isAlumniSelfService && (
          <div className="mb-4 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Payment Channel & Status
              </span>
              {order.paymentStatus === "PAID" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Paid Full
                </span>
              ) : order.paymentStatus === "PENDING_COD" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600">
                  <span className="material-symbols-outlined text-[14px]">pending</span>
                  Cash on Delivery (Pending)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-container-highest text-on-surface-variant">
                  {order.paymentStatus || "Pending"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-outline-variant/10">
              <div>
                <p className="text-on-surface-variant text-[11px]">Payment Method</p>
                <p className="font-bold text-on-surface">
                  {order.paymentMethod === "STRIPE" ? "Stripe Online Payment" : "Cash on Delivery (COD)"}
                </p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[11px]">Total Order Price</p>
                <p className="font-bold text-primary text-sm">
                  {order.currency ?? "USD"} {parseFloat(order.amount ?? "0").toFixed(2)}
                </p>
              </div>
            </div>

            {/* If COD and not yet paid: action to mark as collected */}
            {canWrite && order.paymentStatus === "PENDING_COD" && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={loading || collectingCod}
                  onClick={handleMarkCodPaid}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  <span>Mark COD Payment Collected & Settle ({order.currency ?? "USD"} {parseFloat(order.amount ?? "0").toFixed(2)})</span>
                </button>
              </div>
            )}
          </div>
        )}

        <dl className="divide-y divide-outline-variant/10 mb-4">
          {[
            ["Member / Student", order.studentName],
            ["Reg No. / ID", order.regNo],
            ...(order.recipientPhone ? [["Contact Phone", order.recipientPhone]] : []),
            ["Card Tier", order.cardTier.replaceAll("_", " ")],
            ["Courier Delivery Channel", order.courierType.replaceAll("_", " ")],
            ["Delivery Address", order.deliveryAddress],
            ["Production Status", order.status.replaceAll("_", " ")],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 gap-4">
              <dt className="font-body-compact text-on-surface-variant flex-shrink-0 text-xs">{label}</dt>
              <dd className="font-body-medium text-on-surface text-right text-xs font-medium truncate max-w-[280px]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {canWrite && (
          <div className="space-y-3 pt-2 border-t border-outline-variant/15">
            <label className="font-body-compact text-on-surface-variant block text-xs">
              Courier Tracking Code
              <div className="flex gap-2 mt-1">
                <input
                  placeholder="e.g. DHL-84920412"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="flex-1 rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface text-xs outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={saveTracking}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-surface-container-high font-body-compact text-on-surface text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Save Code
                </button>
              </div>
            </label>

            {nextStatus && (
              <button
                type="button"
                onClick={advance}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary text-on-primary px-4 py-2.5 font-body-medium font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                Advance to {nextStatus.replaceAll("_", " ")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
