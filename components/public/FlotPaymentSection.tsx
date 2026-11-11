"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, CreditCard, ShieldCheck, ExternalLink, CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import type { FlotPaymentInitResult } from "@/hooks/public/useCreatePhysicalCardOrder";

export interface FlotPaymentSectionProps {
  amount: number;
  currency: string;
  memberName: string;
  loading: boolean;
  onInitiatePayment: (type: "in-app" | "credit-card") => Promise<FlotPaymentInitResult | null>;
  onCompleteOrder: (paymentRef: string) => Promise<void>;
}

export default function FlotPaymentSection({
  amount,
  currency,
  memberName,
  loading,
  onInitiatePayment,
  onCompleteOrder,
}: FlotPaymentSectionProps) {
  const [paymentType, setPaymentType] = useState<"in-app" | "credit-card">("in-app");
  const [paymentResult, setPaymentResult] = useState<FlotPaymentInitResult | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Credit card form state (for card type)
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(memberName || "");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const currencySymbol = currency === "SLE" ? "SLE " : "$";

  // Initiate Flot payment link
  async function handleStartPayment() {
    setCardError(null);
    const result = await onInitiatePayment(paymentType);
    if (result) {
      setPaymentResult(result);
    }
  }

  // Handle immediate payment finalization (e.g., after user scans or pays)
  async function handleConfirmPaid() {
    if (!paymentResult) return;
    setIsRedirecting(true);
    await onCompleteOrder(paymentResult.paymentAttemptId || paymentResult.orderId);
    setIsRedirecting(false);
  }

  // Format Card Number
  function handleCardNumberChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  }

  // Format Expiry
  function handleExpiryChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  }

  function handleFillTestCard() {
    setCardNumber("4242 4242 4242 4242");
    setCardName(memberName || "Jane Alumna");
    setExpiry("12/28");
    setCvc("924");
    setCardError(null);
  }

  async function handleCardPaySubmit(e: React.FormEvent) {
    e.preventDefault();
    setCardError(null);
    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 15) {
      setCardError("Please enter a valid card number.");
      return;
    }
    if (expiry.length < 5) {
      setCardError("Please enter a valid expiration date (MM/YY).");
      return;
    }
    if (cvc.length < 3) {
      setCardError("Please enter a valid 3-digit CVC code.");
      return;
    }

    const result = await onInitiatePayment("credit-card");
    if (result) {
      setIsRedirecting(true);
      await onCompleteOrder(result.paymentAttemptId || result.orderId);
      setIsRedirecting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Flot Payment Method Toggle */}
      {!paymentResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentType("in-app")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                paymentType === "in-app"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Smartphone className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Flot Mobile App</p>
                <p className="text-[10px] text-slate-500">Scan QR / App Pay</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("credit-card")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                paymentType === "credit-card"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Flot Card Gateway</p>
                <p className="text-[10px] text-slate-500">Debit or Credit Card</p>
              </div>
            </button>
          </div>

          {/* Credit Card Inline Form */}
          {paymentType === "credit-card" ? (
            <form onSubmit={handleCardPaySubmit} className="space-y-3 pt-1">
              {/* Digital Card Preview */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 p-4 text-white shadow-md border border-emerald-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-8 rounded-xs bg-amber-400/80 inline-block shadow-inner" />
                    <span className="text-[10px] font-mono tracking-widest text-emerald-300">FLOT CHIP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wider text-emerald-200">FLOT PAY</span>
                  </div>
                </div>

                <p className="font-mono text-sm tracking-widest text-white/90 mb-3">
                  {cardNumber || "•••• •••• •••• ••••"}
                </p>

                <div className="flex items-end justify-between text-[11px]">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Cardholder</p>
                    <p className="font-bold tracking-wide truncate max-w-[150px] uppercase">
                      {cardName || memberName || "ALUMNI MEMBER"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Expires</p>
                    <p className="font-mono font-bold">{expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>

              {/* Sandbox quick fill */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-900 font-medium text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Flot Test Sandbox active</span>
                </span>
                <button
                  type="button"
                  onClick={handleFillTestCard}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer text-[11px]"
                >
                  Autofill Card
                </button>
              </div>

              {cardError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                  {cardError}
                </div>
              )}

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Expiration (MM/YY)</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-900 text-center focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Security Code (CVC)</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-900 text-center focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isRedirecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading || isRedirecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing with Flot Gateway…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Pay {currencySymbol}{amount.toFixed(2)} via Flot</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Flot Mobile App Payment Launcher */
            <div className="space-y-3 pt-2 text-center">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <Smartphone className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Pay via Flot Mobile App</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Generate an instant Flot payment link or QR code to pay directly from your Flot mobile wallet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartPayment}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Flot Payment Link…</span>
                  </>
                ) : (
                  <>
                    <span>Generate Flot Payment QR</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Flot Payment Link & QR View (After Link Generation) */}
      {paymentResult && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Flot Payment Link Generated</span>
          </div>

          <div className="mx-auto w-fit rounded-xl border border-slate-200 bg-white p-3 shadow-inner">
            <QRCodeSVG
              value={paymentResult.qrCodeData || paymentResult.paymentLink}
              size={168}
              level="M"
              includeMargin
            />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              Amount Due: {currencySymbol}{amount.toFixed(2)} {currency}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan with the Flot App or click the link below to pay.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={paymentResult.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-600 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in Flot App</span>
            </a>

            <button
              type="button"
              onClick={handleConfirmPaid}
              disabled={isRedirecting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 transition-all cursor-pointer"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>I Have Completed Payment</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPaymentResult(null)}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline"
          >
            Choose a different payment method
          </button>
        </div>
      )}

      {/* Security assurances */}
      <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>RSA-4096-PSS Signed</span>
        </span>
        <span>•</span>
        <span>Flot Network Gateway</span>
        <span>•</span>
        <span>Instant Settlement</span>
      </div>
    </div>
  );
}

