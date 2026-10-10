"use client";

import { useState } from "react";
import type { DonationRecordRow } from "./FinanceView";

interface DonationDetailModalProps {
  donation: DonationRecordRow;
  onClose: () => void;
}

export default function DonationDetailModal({ donation, onClose }: DonationDetailModalProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  function copyToClipboard(text: string, type: "ref" | "phone") {
    navigator.clipboard.writeText(text);
    if (type === "ref") {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  }

  function downloadReceipt() {
    const symbol = donation.currency === "SLE" ? "NLe " : donation.currency === "GBP" ? "£" : donation.currency === "EUR" ? "€" : "$";
    const content = [
      "===========================================================",
      "         INSTITUTE OF PUBLIC ADMINISTRATION & MANAGEMENT",
      "              UNIVERSITY OF SIERRA LEONE",
      "                 OFFICIAL CHARITABLE GIFT RECEIPT",
      "===========================================================",
      "",
      `Receipt Reference: ${donation.paymentRef}`,
      `Date Issued:       ${new Date(donation.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      `Donor Name:        ${donation.donorName}`,
      donation.donorEmail ? `Donor Email:       ${donation.donorEmail}` : "",
      donation.donorPhone ? `Donor Phone:       ${donation.donorPhone}` : "",
      donation.donorClass ? `Class / Affiliation: ${donation.donorClass}` : "",
      `Donor Status:      ${donation.isGuest ? "Guest Contributor" : "Registered Alumni"}`,
      `Designation Fund:  ${donation.fund}`,
      `Gift Schedule:     ${donation.frequency === "MONTHLY" ? "Monthly Sustaining Partner" : "One-Time Contribution"}`,
      `Payment Method:    ${donation.paymentMethod}`,
      `Total Amount:      ${symbol}${donation.amount.toLocaleString()} ${donation.currency}`,
      donation.transactionRef ? `Transaction Ref:   ${donation.transactionRef}` : "",
      donation.isDedication && donation.dedicationName ? `Dedication:        In Honor/Memory of ${donation.dedicationName}` : "",
      "",
      "Tax Exemption & University Endorsement:",
      "Contributions to the IPAM Alumni Endowment are recognized under",
      "Sierra Leone National Revenue Authority (NRA) charitable relief",
      "statutes and IRS 501(c)(3) foreign institutional gift guidelines.",
      "No goods or services were provided in exchange for this contribution.",
      "",
      "Office of Alumni Relations & University Endowment Board",
      "Tower Hill, Freetown, Sierra Leone | treasury@ipamalumni.org",
      "===========================================================",
    ].filter(Boolean).join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IPAM_Receipt_${donation.paymentRef}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const symbol = donation.currency === "SLE" ? "NLe " : donation.currency === "GBP" ? "£" : donation.currency === "EUR" ? "€" : "$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <span className="material-symbols-outlined text-[28px]">volunteer_activism</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-on-surface">Donation Gift Record</h3>
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/30">
                  {donation.status}
                </span>
                {donation.isGuest ? (
                  <span className="rounded-full bg-slate-500/10 text-slate-400 px-2 py-0.5 text-[10px] font-bold border border-slate-500/20">
                    Guest Donor
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold border border-primary/20">
                    Registered Alumni
                  </span>
                )}
              </div>
              <p className="font-body-compact text-xs text-on-surface-variant mt-0.5">
                Official institutional charitable record archived for IPAM endowment administration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Amount and Ref banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Contributed Gift</span>
              <div className="font-display-metric text-2xl text-emerald-600">
                {symbol}{donation.amount.toLocaleString()} <span className="text-sm font-bold text-on-surface-variant">{donation.currency}</span>
              </div>
              <span className="text-xs font-medium text-on-surface-variant">
                {donation.frequency === "MONTHLY" ? "Monthly Sustaining Commitment" : "One-Time Contribution"}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Official Reference</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <code className="font-mono text-xs font-bold text-on-surface bg-surface-container-highest px-2 py-1 rounded">
                  {donation.paymentRef}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(donation.paymentRef, "ref")}
                  title="Copy reference"
                  className="rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedRef ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">
                {new Date(donation.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          {/* Donor Information Details */}
          <div className="rounded-xl border border-outline-variant/30 p-4 space-y-3">
            <h4 className="font-headline-sm text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              <span>Donor Contact & Affiliation</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-on-surface-variant font-medium">Donor Name:</span>
                <div className="font-bold text-on-surface flex items-center gap-2">
                  <span>{donation.donorName}</span>
                  {donation.isAnonymous && (
                    <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Publicly Anonymous
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-on-surface-variant font-medium">Email Address:</span>
                <div>
                  <a
                    href={`mailto:${donation.donorEmail}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {donation.donorEmail}
                  </a>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-on-surface-variant font-medium">Phone Number (Mobile / WhatsApp):</span>
                <div className="flex items-center gap-2">
                  {donation.donorPhone ? (
                    <>
                      <a
                        href={`tel:${donation.donorPhone}`}
                        className="font-bold text-on-surface hover:text-primary flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">call</span>
                        <span>{donation.donorPhone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(donation.donorPhone!, "phone")}
                        className="rounded p-1 text-on-surface-variant hover:bg-surface-container"
                        title="Copy phone number"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedPhone ? "check" : "content_copy"}
                        </span>
                      </button>
                    </>
                  ) : (
                    <span className="italic text-on-surface-variant">Not provided</span>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-on-surface-variant font-medium">Class Year / Affiliation:</span>
                <div className="font-semibold text-on-surface">
                  {donation.donorClass || donation.user?.classYear ? (
                    <span>{donation.donorClass || `Class of ${donation.user?.classYear}`}</span>
                  ) : (
                    <span className="text-on-surface-variant italic">Friend / Supporter of IPAM</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Allocation & Financial Details */}
          <div className="rounded-xl border border-outline-variant/30 p-4 space-y-3">
            <h4 className="font-headline-sm text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">account_balance</span>
              <span>Designation & Payment Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-on-surface-variant font-medium">Designation Fund:</span>
                <div className="font-bold text-on-surface">{donation.fund}</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-on-surface-variant font-medium">Payment Channel:</span>
                <div className="font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">credit_card</span>
                  <span>{donation.paymentMethod}</span>
                </div>
              </div>

              {donation.transactionRef && (
                <div className="space-y-0.5">
                  <span className="text-on-surface-variant font-medium">Linked Financial Transaction:</span>
                  <div className="font-mono text-[11px] font-bold text-secondary">
                    {donation.transactionRef}
                  </div>
                </div>
              )}

              <div className="space-y-0.5">
                <span className="text-on-surface-variant font-medium">Tax Relief Exemption:</span>
                <div className="font-semibold text-emerald-600">
                  SL NRA & US 501(c)(3) Deductible
                </div>
              </div>
            </div>

            {donation.isDedication && donation.dedicationName && (
              <div className="mt-3 rounded-lg bg-surface-container p-3 border border-outline-variant/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                  <span className="material-symbols-outlined text-[16px]">favorite</span>
                  <span>Dedication Honor Note</span>
                </div>
                <p className="mt-1 text-xs text-on-surface font-medium italic">
                  &ldquo;In Honor / Memory of {donation.dedicationName}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/30 pt-4">
          <div className="text-[11px] text-on-surface-variant">
            Recorded in IPAM Ledger • Single Source of Truth
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={downloadReceipt}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-3.5 py-2 font-body-compact text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download Tax Receipt (.TXT)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-lg bg-primary px-4 py-2 font-body-compact text-xs font-bold text-on-primary hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
