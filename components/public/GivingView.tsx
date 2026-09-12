"use client";

import { useState, type FormEvent } from "react";
import { HeartHandshake, ShieldCheck, Lock } from "lucide-react";
import { useApp } from "@/lib/public/context";
import { useCreateDonation } from "@/hooks/public/useCreateDonation";

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];
const CURRENCIES = ["USD", "SLE", "GBP", "EUR"];
const FUNDS = [
  { value: "Scholarship Fund", label: "Student Scholarships", blurb: "Need-based grants for tuition & books" },
  { value: "Campus Research Labs", label: "Innovation Labs", blurb: "Tech infrastructure & AI research" },
  { value: "Emergency Student Relief", label: "Emergency Hardship", blurb: "Rapid response relief for crisis" },
];

export default function GivingView() {
  const { session } = useApp();
  const { createDonation, loading, error } = useCreateDonation();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [fund, setFund] = useState(FUNDS[0].value);
  const [donorName, setDonorName] = useState(session?.profile?.name ?? "");
  const [donorEmail, setDonorEmail] = useState(session?.email ?? "");
  const [donorClassYear, setDonorClassYear] = useState(session?.profile?.classYear ? String(session.profile.classYear) : "");
  const [receipt, setReceipt] = useState<{ paymentRef: string; amount: string; fund: string; currency: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(amount) || amount <= 0) return;
    const result = await createDonation({ donorName, donorEmail, amount, fund, currency });
    if (result) setReceipt(result);
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6 lg:px-8">
        <HeartHandshake className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-900">Thank you for your gift!</h1>
        <p className="mt-1 text-sm text-slate-500">A tax-deductible receipt has been generated for your records.</p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-400">Amount</span><span className="font-semibold text-slate-900">{receipt.amount} {receipt.currency}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-400">Fund</span><span className="font-semibold text-slate-900">{receipt.fund}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-400">Reference</span><span className="font-mono text-xs font-semibold text-slate-900">{receipt.paymentRef}</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900">Support the IPAM Alumni Fund</h1>
      <p className="mt-2 text-slate-500">
        Your generous contributions directly support deserving students, fund campus research labs, and sustain our
        global alumni initiatives.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-900">1. Select Designation Fund</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {FUNDS.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setFund(f.value)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  fund === f.value ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{f.label}</p>
                <p className="mt-1 text-[11px] text-slate-500">{f.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900">2. Choose Gift Amount</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                className={`rounded-xl py-3 text-sm font-bold transition-all ${
                  !customAmount && selectedAmount === amt
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Enter other amount…"
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Donor Name</label>
            <input required value={donorName} onChange={(e) => setDonorName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Email</label>
            <input type="email" required value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Class Year (optional)</label>
            <input value={donorClassYear} onChange={(e) => setDonorClassYear(e.target.value)} className="input" />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            {loading ? "Processing Secure Gift…" : `Complete Gift of ${customAmount || selectedAmount} ${currency}`}
          </button>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>256-bit Bank Grade Encryption · Tax Deductible</span>
          </div>
        </div>
      </form>
    </div>
  );
}
