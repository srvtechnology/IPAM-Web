"use client";

import { useState } from "react";
import { CreditCard, Lock, ShieldCheck, Sparkles } from "lucide-react";

export interface CardPaymentDetails {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvc: string;
}

export default function StripeCardPaymentSection({
  amount,
  currency,
  memberName,
  loading,
  onPay,
}: {
  amount: number;
  currency: string;
  memberName: string;
  loading: boolean;
  onPay: () => Promise<void>;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(memberName || "");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);

  // Format Card Number (space every 4 digits)
  function handleCardNumberChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  }

  // Format Expiry MM/YY
  function handleExpiryChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  }

  // Quick autofill test card
  function handleFillTestCard() {
    setCardNumber("4242 4242 4242 4242");
    setCardName(memberName || "Jane Alumna");
    setExpiry("12/28");
    setCvc("924");
    setCardError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCardError(null);

    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 15) {
      setCardError("Please enter a valid 16-digit credit or debit card number.");
      return;
    }
    if (expiry.length < 5) {
      setCardError("Please enter a valid expiration date (MM/YY).");
      return;
    }
    if (cvc.length < 3) {
      setCardError("Please enter a valid 3 or 4 digit security code (CVC).");
      return;
    }

    await onPay();
  }

  const currencySymbol = currency === "SLE" ? "SLE" : "$";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Visual Interactive Digital Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 p-5 text-white shadow-lg border border-emerald-500/30">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-9 rounded-sm bg-amber-400/80 inline-block shadow-inner" />
            <span className="text-[11px] font-mono tracking-widest text-emerald-300">SECURE CHIP</span>
          </div>
          <span className="text-xs font-black tracking-wider text-white/90">STRIPE PAY</span>
        </div>

        <p className="font-mono text-base tracking-widest text-white/90 mb-4 sm:text-lg">
          {cardNumber || "•••• •••• •••• ••••"}
        </p>

        <div className="flex items-end justify-between text-xs">
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-slate-400 font-medium">Cardholder</p>
            <p className="font-bold tracking-wide truncate max-w-[170px] uppercase">
              {cardName || memberName || "ALUMNI MEMBER"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9.5px] uppercase tracking-wider text-slate-400 font-medium">Expires</p>
            <p className="font-mono font-bold">{expiry || "MM/YY"}</p>
          </div>
        </div>
      </div>

      {/* Test Card Quick Fill Banner */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-emerald-900 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Demo / Sandbox mode active</span>
        </span>
        <button
          type="button"
          onClick={handleFillTestCard}
          className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer text-[11px]"
        >
          Autofill Test Card
        </button>
      </div>

      {cardError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
          {cardError}
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Card Number
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Name on Card
          </label>
          <input
            type="text"
            required
            placeholder="Jane Doe"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expiration (MM/YY)
            </label>
            <input
              type="text"
              required
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => handleExpiryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Security CVC
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="password"
                required
                maxLength={4}
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2.5 text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
      >
        <Lock className="h-4 w-4" />
        <span>
          {loading
            ? "Processing Secure Stripe Payment…"
            : `Pay ${currencySymbol}${amount.toFixed(2)} & Order Card`}
        </span>
      </button>

      {/* Security assurances */}
      <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted</span>
        </span>
        <span>•</span>
        <span>PCI-DSS Level 1 Compliant</span>
        <span>•</span>
        <span>Stripe Gateway</span>
      </div>
    </form>
  );
}
