"use client";

import type { BannerRow } from "./CommercialBannersView";

const INVOICE_STYLES: Record<string, string> = {
  PAID: "bg-secondary/15 text-secondary",
  PENDING: "bg-tertiary/15 text-tertiary",
  OVERDUE: "bg-error/15 text-error",
};

// Browser-native print is a reasonable scope for this pass — no PDF generator.
export default function BannerInvoiceModal({ banner, onClose }: { banner: BannerRow; onClose: () => void }) {
  const status = banner.invoiceStatus ?? "PENDING";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:bg-white">
      <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20 print:shadow-none print:border-0 print:bg-white print:text-black">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-tertiary text-[22px]">receipt</span>
            <h2 className="font-headline-md text-on-surface">Invoice — {banner.code}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-1.5 font-body-default text-on-surface-variant print:text-black">
          <p className="font-headline-sm text-on-surface print:text-black">IPAM Alumni Association — Sponsor Invoice</p>
          <p>Sponsor: {banner.name}</p>
          <p>Slot: {banner.slot} &middot; Contract: {banner.contract}</p>
          <p className="font-code-compact font-bold text-secondary print:text-black">
            Amount: ${banner.monthlyFee} / {banner.subscriptionCadence?.toLowerCase().replaceAll("_", "-") ?? "month"}
          </p>
          <p>Invoice #: {banner.invoiceNumber ?? `INV-${banner.code}`}</p>
          <p className="flex items-center gap-2">
            Status:
            <span className={`px-2 py-0.5 rounded-full font-code-compact font-bold print:text-black ${INVOICE_STYLES[status] ?? ""}`}>
              {status}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity print:hidden"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Print Invoice
        </button>
      </div>
    </div>
  );
}
