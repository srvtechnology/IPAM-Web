"use client";

import { useMemo, useState } from "react";
import { useAdminSession } from "@/lib/admin/context";
import CreateIdCardModal from "./CreateIdCardModal";
import InspectIdCardModal from "./InspectIdCardModal";

export interface IdCardOrderRow {
  id: string;
  orderNumber: string;
  studentName: string;
  regNo: string;
  deliveryAddress: string;
  courierType: string;
  status:
    | "IN_PRINT_PRESS"
    | "QUALITY_CHECK"
    | "READY_COURIER"
    | "DISPATCHED"
    | "DELIVERED"
    | "COLLECTED";
  cardTier: string;
  trackingCode: string | null;
  submittedDate: string;
}

const COLUMNS: { key: string; label: string; icon: string; accent: string; statuses: IdCardOrderRow["status"][] }[] = [
  { key: "print", label: "In Press & Quality Check", icon: "print", accent: "text-tertiary", statuses: ["IN_PRINT_PRESS", "QUALITY_CHECK"] },
  { key: "ready", label: "Ready for Pickup / Courier", icon: "local_shipping", accent: "text-secondary", statuses: ["READY_COURIER"] },
  {
    key: "dispatched",
    label: "Dispatched, Delivered & Collected",
    icon: "task_alt",
    accent: "text-primary",
    statuses: ["DISPATCHED", "DELIVERED", "COLLECTED"],
  },
];

const STATUS_BADGE: Record<IdCardOrderRow["status"], string> = {
  IN_PRINT_PRESS: "bg-surface-container-highest text-on-surface-variant",
  QUALITY_CHECK: "bg-tertiary/15 text-tertiary",
  READY_COURIER: "bg-secondary/15 text-secondary",
  DISPATCHED: "bg-primary/15 text-primary",
  DELIVERED: "bg-primary/15 text-primary",
  COLLECTED: "bg-primary/15 text-primary",
};

export default function IdCardIssuanceDeskView({ orders }: { orders: IdCardOrderRow[] }) {
  const { can } = useAdminSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [inspecting, setInspecting] = useState<IdCardOrderRow | null>(null);
  const canWrite = can("ID_CARDS", "canWrite");

  const grouped = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        orders: orders.filter((o) => col.statuses.includes(o.status)),
      })),
    [orders]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">badge</span>
            <h1 className="font-headline-lg text-on-surface">ID Card Issuance Desk</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1">
            {orders.length} orders across the print, courier and delivery pipeline
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-secondary text-on-secondary px-4 py-2 font-body-medium font-semibold shadow-xs hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add_card</span>
            New Order
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {grouped.map((col) => (
          <div key={col.key} className="rounded-xl bg-surface-container border border-outline-variant/20">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${col.accent}`}>{col.icon}</span>
              <h2 className="font-headline-sm text-on-surface flex-1">{col.label}</h2>
              <span className={`font-code-compact font-semibold ${col.accent}`}>{col.orders.length}</span>
            </div>
            <div className="divide-y divide-outline-variant/10 max-h-[520px] overflow-y-auto">
              {col.orders.length === 0 && (
                <p className="px-4 py-6 font-body-compact text-on-surface-variant">No orders here.</p>
              )}
              {col.orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setInspecting(o)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-high/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-body-medium text-on-surface truncate">{o.studentName}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-code-compact font-semibold flex-shrink-0 ${STATUS_BADGE[o.status]}`}>
                      {o.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="font-body-compact text-on-surface-variant truncate">
                    <span className="text-tertiary font-code-compact">{o.orderNumber}</span> &middot; {o.cardTier.replaceAll("_", " ")}
                  </p>
                  <p className="font-code-compact text-secondary mt-1">
                    {o.courierType.replaceAll("_", " ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {createOpen && <CreateIdCardModal onClose={() => setCreateOpen(false)} />}
      {inspecting && (
        <InspectIdCardModal order={inspecting} canWrite={canWrite} onClose={() => setInspecting(null)} />
      )}
    </div>
  );
}
