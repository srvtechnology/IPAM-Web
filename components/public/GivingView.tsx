"use client";

import { useState, type FormEvent } from "react";
import { HeartHandshake } from "lucide-react";
import { useApp } from "@/lib/public/context";
import { useCreateDonation } from "@/hooks/public/useCreateDonation";

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];
const FUNDS = ["Scholarship Fund", "Campus Research Labs", "Alumni Global Initiatives", "Emergency Student Relief"];

export default function GivingView() {
  const { session } = useApp();
  const { createDonation, loading, error } = useCreateDonation();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [fund, setFund] = useState(FUNDS[0]);
  const [donorName, setDonorName] = useState(session?.profile?.name ?? "");
  const [donorEmail, setDonorEmail] = useState(session?.email ?? "");
  const [receipt, setReceipt] = useState<{ paymentRef: string; amount: string; fund: string; currency: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(amount) || amount <= 0) return;
    const result = await createDonation({ donorName, donorEmail, amount, fund, currency: "USD" });
    if (result) setReceipt(result);
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6 lg:px-8">
        <HeartHandshake className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-900">Thank you for your gift!</h1>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-400">Amount</span><span className="font-semibold text-slate-900">${receipt.amount} {receipt.currency}</span></div>
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

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <label className="block text-sm font-medium text-slate-700">Designation</label>
        <select value={fund} onChange={(e) => setFund(e.target.value)} className="input mt-1">
          {FUNDS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <label className="mt-4 block text-sm font-medium text-slate-700">Amount (USD)</label>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              type="button"
              key={amt}
              onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
              className={`rounded-lg border py-2 text-sm font-semibold ${
                !customAmount && selectedAmount === amt
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Enter other amount..."
          className="input mt-2"
        />

        <label className="mt-4 block text-sm font-medium text-slate-700">Your name</label>
        <input required value={donorName} onChange={(e) => setDonorName(e.target.value)} className="input mt-1" />

        <label className="mt-4 block text-sm font-medium text-slate-700">Email</label>
        <input type="email" required value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} className="input mt-1" />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Processing…" : "Give Now"}
        </button>
      </form>
    </div>
  );
}
