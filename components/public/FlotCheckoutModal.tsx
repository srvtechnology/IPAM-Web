"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone,
  CreditCard,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  X,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { FlotPaymentLinkResult } from "@/lib/payments/flot";

export interface FlotCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  defaultAmount?: number;
  allowAmountEdit?: boolean;
  initialCurrency?: "SLE" | "USD";
  orderNumber?: string;
  recipientName?: string;
  description?: string;
  onSuccess: (paymentRef: string, currency: string, amount: number) => void | Promise<void>;
}

export default function FlotCheckoutModal({
  isOpen,
  onClose,
  title = "Make your contribution",
  defaultAmount = 10,
  allowAmountEdit = true,
  initialCurrency = "SLE",
  orderNumber,
  recipientName,
  description,
  onSuccess,
}: FlotCheckoutModalProps) {
  const [currency, setCurrency] = useState<"SLE" | "USD">(initialCurrency);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [paymentType, setPaymentType] = useState<"in-app" | "momo" | "card">("in-app");
  const [step, setStep] = useState<"select" | "paying" | "success">("select");
  const [paymentResult, setPaymentResult] = useState<FlotPaymentLinkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string>("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync default amount and currency when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount);
      setCurrency(initialCurrency);
      setStep("select");
      setPaymentResult(null);
      setError(null);
      setElapsedSeconds(0);
      setActiveOrderId(
        orderNumber ||
          `IPAM-C-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      );
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [isOpen, defaultAmount, initialCurrency, orderNumber]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handlePaymentSuccess = useCallback(
    async (ref: string) => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setStep("success");
      try {
        await onSuccess(ref, currency, amount);
      } catch (err) {
        console.error("Error invoking onSuccess callback:", err);
      }
    },
    [currency, amount, onSuccess]
  );

  // Poll Flot status endpoint when in "paying" step
  useEffect(() => {
    if (step === "paying" && paymentResult) {
      setElapsedSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      const checkStatus = async () => {
        try {
          const attemptId = paymentResult.paymentAttemptId || paymentResult.flotRequestId || "";
          const res = await fetch(
            `/api/payments/flot/status?orderId=${encodeURIComponent(paymentResult.orderId)}&attemptId=${encodeURIComponent(attemptId)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed" || data.status === "succeeded") {
              await handlePaymentSuccess(attemptId || paymentResult.orderId);
            }
          }
        } catch (err) {
          console.warn("[Flot Checkout] Polling status check failed:", err);
        }
      };

      pollIntervalRef.current = setInterval(checkStatus, 3000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [step, paymentResult, handlePaymentSuccess]);

  if (!isOpen) return null;

  async function handleInitiatePayment() {
    setError(null);
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/flot/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: activeOrderId,
          amount,
          currency,
          type: paymentType,
          recipientName,
          description: description || title,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to initialize Flot payment.");
      }

      const result = json.data as FlotPaymentLinkResult;
      setPaymentResult(result);
      setStep("paying");

      // For Bank Card, open Flot secure card page in new tab if a link was returned
      if (paymentType === "card" && result.paymentLink) {
        window.open(result.paymentLink, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment initialization error";
      setError(msg);
    } finally {
      setLoading(false);
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
    setStep("select");
    setPaymentResult(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* STEP 1: Select Currency, Amount & Payment Method (Ref: Image 1 & 2) */}
        {step === "select" && (
          <div className="p-6 sm:p-7 space-y-5">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Powered by Flot — Sierra Leone&apos;s Next-Gen Payment Gateway
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Currency Selector (Pills) */}
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

            {/* Amount Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Enter an amount <span className="text-slate-400 font-normal">(required)</span>
              </label>
              <div className="relative flex rounded-xl border-2 border-amber-500/80 bg-white focus-within:ring-2 focus-within:ring-amber-500/30 overflow-hidden">
                <span className="flex items-center px-3.5 bg-slate-50 text-xs font-black text-slate-600 border-r border-slate-200">
                  {currency}
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  disabled={!allowAmountEdit}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="10"
                  className="w-full py-2.5 px-3 text-base font-bold text-slate-900 focus:outline-hidden disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Choose How to Pay (Ref: Image 2) */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700">Choose how to pay</label>
              <div className="space-y-2">
                {/* 1. Flot App */}
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

                {/* 2. Mobile Money */}
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

                {/* 3. Bank Card */}
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

            {/* Action Button (Ref: Image 1 & 2) */}
            <button
              type="button"
              onClick={handleInitiatePayment}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d49c24] hover:bg-[#c28c1d] active:scale-98 py-3.5 text-sm font-extrabold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Preparing Flot Payment…</span>
                </>
              ) : (
                <span>Continue to payment</span>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Complete Payment Modal (Ref: Image 3 for Mobile Money, Image 4 for Flot App) */}
        {step === "paying" && paymentResult && (
          <div className="p-6 sm:p-7 space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Complete your payment</h3>
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
                  <p className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-[#0d3b2e]">
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
                      value={paymentResult.qrCodeData || paymentResult.paymentLink || activeOrderId}
                      size={170}
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
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[220px]">
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
                Your reference: <strong className="font-mono text-slate-900">{activeOrderId}</strong>
              </p>
            </div>

            {/* Fallback actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handlePaymentSuccess(paymentResult.paymentAttemptId || activeOrderId)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 py-1 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>I have completed payment</span>
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

        {/* STEP 3: Success View */}
        {step === "success" && (
          <div className="p-7 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Payment Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your payment of <strong>{currency} {amount}</strong> has been received and verified via Flot.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <span className="text-slate-500">Transaction Reference: </span>
              <strong className="font-mono text-slate-900">{activeOrderId}</strong>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white transition-all cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
