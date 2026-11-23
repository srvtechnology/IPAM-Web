"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone,
  CreditCard,
  Phone,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { FlotPaymentInitResult } from "@/hooks/public/useCreatePhysicalCardOrder";

export interface FlotPaymentSectionProps {
  amount: number;
  currency: string;
  memberName: string;
  loading: boolean;
  onInitiatePayment: (type: "in-app" | "momo" | "card", currency?: "SLE" | "USD") => Promise<FlotPaymentInitResult | null>;
  onCompleteOrder: (paymentRef: string) => Promise<void>;
  allowCurrencyChange?: boolean;
}

export default function FlotPaymentSection({
  amount,
  currency: initialCurrency,
  memberName,
  loading,
  onInitiatePayment,
  onCompleteOrder,
  allowCurrencyChange = true,
}: FlotPaymentSectionProps) {
  const [currency, setCurrency] = useState<"SLE" | "USD">((initialCurrency as "SLE" | "USD") || "SLE");
  const [paymentType, setPaymentType] = useState<"in-app" | "momo" | "card">("in-app");
  const [paymentResult, setPaymentResult] = useState<FlotPaymentInitResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialCurrency === "SLE" || initialCurrency === "USD") {
      setCurrency(initialCurrency);
    }
  }, [initialCurrency]);

  const handleFinishPayment = useCallback(
    async (ref: string) => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsVerifying(true);
      try {
        await onCompleteOrder(ref);
      } finally {
        setIsVerifying(false);
      }
    },
    [onCompleteOrder]
  );

  // Poll status endpoint when payment is pending
  useEffect(() => {
    if (paymentResult) {
      setElapsedSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      const checkStatus = async () => {
        try {
          const attemptId = paymentResult.paymentAttemptId || "";
          const res = await fetch(
            `/api/payments/flot/status?orderId=${encodeURIComponent(paymentResult.orderId)}&attemptId=${encodeURIComponent(attemptId)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed" || data.status === "succeeded") {
              await handleFinishPayment(attemptId || paymentResult.orderId);
            }
          }
        } catch {
          // ignore transient polling errors
        }
      };

      pollIntervalRef.current = setInterval(checkStatus, 3000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [paymentResult, handleFinishPayment]);

  async function handleStartPayment() {
    setError(null);
    const result = await onInitiatePayment(paymentType, currency);
    if (result) {
      setPaymentResult(result);
      if (paymentType === "card" && result.paymentLink) {
        window.open(result.paymentLink, "_blank", "noopener,noreferrer");
      }
    }
  }

  function handleCopyCode() {
    if (!paymentResult?.code) return;
    navigator.clipboard.writeText(paymentResult.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  }

  function handleCopyLink() {
    if (!paymentResult?.paymentLink) return;
    navigator.clipboard.writeText(paymentResult.paymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function handleChangeMethod() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPaymentResult(null);
  }

  return (
    <div className="space-y-4">
      {/* 1. SELECTION STEP (Ref: Image 1 & 2) */}
      {!paymentResult && (
        <div className="space-y-4">
          {/* Currency Toggle (Ref: Image 1 & 2) */}
          {allowCurrencyChange && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Currency</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency("SLE")}
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    currency === "SLE"
                      ? "bg-[#0d3b2e] text-white border-[#0d3b2e] shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Leones (SLE)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    currency === "USD"
                      ? "bg-[#0d3b2e] text-white border-[#0d3b2e] shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  US Dollars (USD)
                </button>
              </div>
            </div>
          )}

          {/* Amount Badge */}
          <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-200 p-3">
            <span className="text-xs font-bold text-slate-600">Total Payable Amount</span>
            <span className="font-mono text-sm font-black text-slate-900">
              {currency === "SLE" ? "NLe " : "$ "}
              {amount.toFixed(2)} {currency}
            </span>
          </div>

          {/* Choose How to Pay (Ref: Image 2) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Choose how to pay</label>
            <div className="space-y-2">
              {/* Option 1: Flot App */}
              <button
                type="button"
                onClick={() => setPaymentType("in-app")}
                className={`w-full flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                  paymentType === "in-app"
                    ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                    : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/70"
                }`}
              >
                <div
                  className={`mt-0.5 rounded-xl p-2 ${
                    paymentType === "in-app"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Flot App</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Open the Flot app or scan a QR code.
                  </p>
                </div>
              </button>

              {/* Option 2: Mobile Money */}
              <button
                type="button"
                onClick={() => setPaymentType("momo")}
                className={`w-full flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                  paymentType === "momo"
                    ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                    : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/70"
                }`}
              >
                <div
                  className={`mt-0.5 rounded-xl p-2 ${
                    paymentType === "momo"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Mobile Money</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pay with a Mobile Money code.
                  </p>
                </div>
              </button>

              {/* Option 3: Bank Card */}
              <button
                type="button"
                onClick={() => setPaymentType("card")}
                className={`w-full flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                  paymentType === "card"
                    ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                    : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/70"
                }`}
              >
                <div
                  className={`mt-0.5 rounded-xl p-2 ${
                    paymentType === "card"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Bank Card</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pay on Flot&apos;s secure card page.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartPayment}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d49c24] hover:bg-[#c28c1d] active:scale-98 py-3.5 text-sm font-extrabold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing Flot Gateway…</span>
              </>
            ) : (
              <span>Continue to payment</span>
            )}
          </button>
        </div>
      )}

      {/* 2. PAYMENT IN PROGRESS MODAL VIEW (Ref: Image 3 & 4) */}
      {paymentResult && (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Complete your payment</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {paymentType === "momo" && (
                <>
                  Pay {currency} {amount} through Flot. Dial the code below on your phone and follow
                  the Mobile Money prompts. Keep this window open while we confirm it.
                </>
              )}
              {paymentType === "in-app" && (
                <>
                  Pay {currency} {amount} through Flot. Open the Flot app on this device, or scan the
                  QR code with a device that has the app installed. Keep this window open while we
                  confirm it.
                </>
              )}
              {paymentType === "card" && (
                <>
                  Pay {currency} {amount} through Flot. Complete your card payment on Flot&apos;s
                  secure checkout portal. Keep this window open while we confirm it.
                </>
              )}
            </p>
          </div>

          {/* Mobile Money View (Ref: Image 3) */}
          {paymentType === "momo" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-5 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-600">Mobile Money code</p>
                <p className="font-mono text-2xl font-black tracking-wider text-[#0d3b2e]">
                  {paymentResult.code || "*715*0000000000#"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#d49c24] hover:bg-[#c28c1d] active:scale-98 py-3 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Code Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
                {paymentResult.code && (
                  <a
                    href={`tel:${encodeURIComponent(paymentResult.code)}`}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-emerald-700" />
                    <span>Dial Now</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Flot App QR View (Ref: Image 4) */}
          {paymentType === "in-app" && (
            <div className="space-y-3">
              <div className="flex justify-center rounded-2xl bg-stone-50 border border-stone-200/80 p-5">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
                  <QRCodeSVG
                    value={paymentResult.qrCodeData || paymentResult.paymentLink}
                    size={160}
                    level="M"
                    fgColor="#0d3b2e"
                    includeMargin={false}
                  />
                </div>
              </div>

              <a
                href={paymentResult.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d49c24] hover:bg-[#c28c1d] active:scale-98 py-3.5 text-xs font-extrabold text-white shadow-sm transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Flot App</span>
              </a>

              {/* Deep link copy box */}
              <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs">
                <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]">
                  {paymentResult.paymentLink}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  {copiedLink ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedLink ? "Copied" : "Copy link"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Bank Card View */}
          {paymentType === "card" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-5 text-center space-y-2">
                <CreditCard className="mx-auto h-8 w-8 text-emerald-700" />
                <p className="text-xs font-bold text-slate-800">Secure Flot Card Portal</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  A secure card checkout page has been opened. Complete your card details and return here.
                </p>
              </div>

              <a
                href={paymentResult.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d49c24] hover:bg-[#c28c1d] active:scale-98 py-3.5 text-xs font-extrabold text-white shadow-sm transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Flot Card Page Again</span>
              </a>
            </div>
          )}

          {/* Polling Timer Indicator (Ref: Image 3 & 4) */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 pt-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Waiting for Flot to confirm your payment…</span>
            <span className="font-mono text-slate-500">{elapsedSeconds}s elapsed</span>
          </div>

          {/* Reference info */}
          <div className="border-t border-slate-100 pt-3 text-center">
            <p className="text-xs text-slate-500">
              Your reference: <strong className="font-mono text-slate-900">{paymentResult.orderId}</strong>
            </p>
          </div>

          {/* Fallback actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isVerifying}
              onClick={() => handleFinishPayment(paymentResult.paymentAttemptId || paymentResult.orderId)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 py-1 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying with Flot…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>I have completed payment</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleChangeMethod}
              className="w-full rounded-2xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Change payment method
            </button>
          </div>
        </div>
      )}

      {/* Security assurances */}
      <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>RSA-4096-PSS Signed</span>
        </span>
        <span>•</span>
        <span>Flot Gateway</span>
        <span>•</span>
        <span>Instant Settlement</span>
      </div>
    </div>
  );
}
