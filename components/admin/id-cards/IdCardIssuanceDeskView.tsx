"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminSession } from "@/lib/admin/context";
import CreateIdCardModal from "./CreateIdCardModal";
import InspectIdCardModal from "./InspectIdCardModal";
import CardPricingManager from "../settings/CardPricingManager";

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
  sourceType?: "REGISTRAR" | "ALUMNI_PORTAL";
  amount?: string;
  currency?: string;
  paymentMethod?: string | null;
  paymentStatus?: "PAID" | "PENDING_COD" | "PENDING" | "FAILED" | null;
  recipientPhone?: string | null;
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
  const [ordersList, setOrdersList] = useState<IdCardOrderRow[]>(orders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [inspecting, setInspecting] = useState<IdCardOrderRow | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "ALUMNI_PORTAL" | "REGISTRAR">("ALL");

  const canWrite = can("ID_CARDS", "canWrite");

  // Sync prop changes
  useEffect(() => {
    setOrdersList(orders);
  }, [orders]);

  // Live dynamic fetcher
  const refreshOrders = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/id-cards", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setOrdersList(json.data);
      }
    } catch (err) {
      console.error("Failed to auto-refresh ID card orders:", err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Poll for incoming physical card requests every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      refreshOrders(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshOrders]);

  const filteredOrders = useMemo(() => {
    if (sourceFilter === "ALL") return ordersList;
    return ordersList.filter((o) => (o.sourceType ?? "REGISTRAR") === sourceFilter);
  }, [ordersList, sourceFilter]);

  const grouped = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        orders: filteredOrders.filter((o) => col.statuses.includes(o.status)),
      })),
    [filteredOrders]
  );

  const alumniOrdersCount = ordersList.filter((o) => o.sourceType === "ALUMNI_PORTAL").length;
  const registrarOrdersCount = ordersList.filter((o) => o.sourceType !== "ALUMNI_PORTAL").length;

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">badge</span>
            <h1 className="font-headline-lg text-on-surface">ID Card Issuance Desk</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1 text-xs">
            {ordersList.length} total orders ({alumniOrdersCount} alumni self-service, {registrarOrdersCount} registrar desk)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Dynamic Sync Status Badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Live Requests</span>
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => refreshOrders(false)}
            disabled={isRefreshing}
            title="Refresh requests immediately"
            className="flex items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-2.5 py-2 font-body-medium text-xs font-bold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? "animate-spin text-primary" : "text-on-surface-variant"}`}>
              sync
            </span>
            <span>{isRefreshing ? "Syncing…" : "Refresh"}</span>
          </button>

          {/* Card Pricing Config Trigger */}
          <button
            type="button"
            onClick={() => setPricingOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 font-body-medium text-xs font-bold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer shadow-2xs"
          >
            <span className="material-symbols-outlined text-[17px] text-primary">price_change</span>
            <span>Card Pricing & Fees</span>
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-secondary text-on-secondary px-3.5 py-2 font-body-medium text-xs font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              <span>New Walk-in Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
        <button
          type="button"
          onClick={() => setSourceFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            sourceFilter === "ALL"
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          All Orders ({ordersList.length})
        </button>
        <button
          type="button"
          onClick={() => setSourceFilter("ALUMNI_PORTAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            sourceFilter === "ALUMNI_PORTAL"
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span>Alumni Self-Service</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary">
            {alumniOrdersCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSourceFilter("REGISTRAR")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            sourceFilter === "REGISTRAR"
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          Registrar Desk ({registrarOrdersCount})
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {grouped.map((col) => (
          <div key={col.key} className="rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${col.accent}`}>{col.icon}</span>
              <h2 className="font-headline-sm text-on-surface flex-1 text-sm font-bold">{col.label}</h2>
              <span className={`font-code-compact font-semibold text-xs ${col.accent}`}>{col.orders.length}</span>
            </div>
            <div className="divide-y divide-outline-variant/10 max-h-[580px] overflow-y-auto flex-1">
              {col.orders.length === 0 && (
                <p className="px-4 py-8 font-body-compact text-on-surface-variant text-center text-xs">
                  No orders in this stage.
                </p>
              )}
              {col.orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setInspecting(o)}
                  className="w-full text-left p-3.5 hover:bg-surface-container-high/50 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-body-medium text-on-surface font-bold text-xs truncate">{o.studentName}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-code-compact font-semibold flex-shrink-0 ${STATUS_BADGE[o.status]}`}>
                      {o.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="text-tertiary font-code-compact font-semibold">{o.orderNumber}</span>
                    <span>{o.cardTier.replaceAll("_", " ")}</span>
                  </div>

                  {/* Payment & Source Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {o.sourceType === "ALUMNI_PORTAL" ? (
                      <>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                          Alumni Portal
                        </span>
                        {o.paymentStatus === "PAID" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600">
                            Paid {o.currency} {parseFloat(o.amount ?? "0").toFixed(0)} ({o.paymentMethod === "STRIPE" ? "Stripe" : "Online"})
                          </span>
                        )}
                        {o.paymentStatus === "PENDING_COD" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700">
                            COD Pending: {o.currency} {parseFloat(o.amount ?? "0").toFixed(0)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-surface-container-highest text-on-surface-variant">
                        Registrar
                      </span>
                    )}

                    {o.trackingCode && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-container-highest text-secondary">
                        {o.trackingCode}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {createOpen && (
        <CreateIdCardModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => refreshOrders(false)}
        />
      )}
      {inspecting && (
        <InspectIdCardModal
          order={inspecting}
          canWrite={canWrite}
          onClose={() => setInspecting(null)}
          onUpdated={() => refreshOrders(false)}
        />
      )}

      {/* Card Pricing Configuration Modal */}
      {pricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto">
            <CardPricingManager
              canWrite={canWrite}
              onClose={() => setPricingOpen(false)}
              onSaved={() => refreshOrders(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
