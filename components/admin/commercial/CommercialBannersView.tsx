"use client";

import { useState } from "react";
import { useBanners } from "@/hooks/admin/useBanners";
import { useAdminSession } from "@/lib/admin/context";
import AddBannerModal from "./AddBannerModal";
import BannerInvoiceModal from "./BannerInvoiceModal";

export interface BannerRow {
  id: string;
  code: string;
  name: string;
  slot: string;
  contract: string;
  monthlyFee: string;
  subscriptionCadence: string | null;
  active: boolean;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
}

const INVOICE_STYLES: Record<string, string> = {
  PAID: "bg-secondary/15 text-secondary",
  PENDING: "bg-tertiary/15 text-tertiary",
  OVERDUE: "bg-error/15 text-error",
};

export default function CommercialBannersView({ banners }: { banners: BannerRow[] }) {
  const { can } = useAdminSession();
  const { toggleBanner, loading } = useBanners();
  const [addOpen, setAddOpen] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<BannerRow | null>(null);
  const canWrite = can("COMMERCIAL", "canWrite");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-on-surface">Ads &amp; Commercial Banners</h1>
          <p className="font-body-default text-on-surface-variant mt-1">
            {banners.length} sponsor banners &middot; {banners.filter((b) => b.active).length} active
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">ad_units</span>
            New Banner
          </button>
        )}
      </div>

      <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20">
              <th className="px-4 py-3">Sponsor</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-tertiary/15 border border-tertiary/30 flex items-center justify-center text-tertiary font-bold text-[12px] shrink-0">
                      {b.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <div className="font-body-medium text-on-surface">{b.name}</div>
                      <div className="font-body-compact text-on-surface-variant">{b.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">{b.slot}</td>
                <td className="px-4 py-3 font-body-default text-secondary font-code-compact font-bold">
                  ${b.monthlyFee}/{b.subscriptionCadence?.toLowerCase() ?? "mo"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full font-body-compact ${
                      b.active ? "bg-secondary/15 text-secondary border border-secondary/30" : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {b.active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full font-body-compact font-bold ${INVOICE_STYLES[b.invoiceStatus ?? ""] ?? "text-on-surface-variant"}`}>
                    {b.invoiceStatus ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setInvoiceFor(b)}
                    className="font-body-compact text-primary hover:underline"
                  >
                    Invoice
                  </button>
                  {canWrite && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => toggleBanner(b.id)}
                      className="font-body-compact text-primary hover:underline disabled:opacity-50"
                    >
                      {b.active ? "Pause" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body-default text-on-surface-variant">
                  No sponsor banners yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && <AddBannerModal onClose={() => setAddOpen(false)} />}
      {invoiceFor && <BannerInvoiceModal banner={invoiceFor} onClose={() => setInvoiceFor(null)} />}
    </div>
  );
}
