"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Truck } from "lucide-react";
import { useCreatePhysicalCardOrder } from "@/hooks/public/useCreatePhysicalCardOrder";

const CARD_TIERS: { value: string; label: string; blurb: string }[] = [
  { value: "STANDARD_PVC", label: "Standard PVC", blurb: "Durable printed card" },
  { value: "GOLD_RFID_SMART", label: "Gold RFID Smart", blurb: "Tap access + RFID chip" },
  { value: "EXECUTIVE_TITANIUM", label: "Executive Titanium", blurb: "Metal finish, laser-engraved" },
];

export default function PhysicalCardOrderForm({ memberName, onOrdered }: { memberName: string; onOrdered?: () => void }) {
  const { createOrder, loading, error } = useCreatePhysicalCardOrder();
  const [cardTier, setCardTier] = useState("STANDARD_PVC");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [order, setOrder] = useState<{ orderNumber: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createOrder({ cardTier, deliveryAddress });
    if (result) {
      setOrder(result);
      onOrdered?.();
    }
  }

  if (order) {
    return (
      <div className="space-y-3 py-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-slate-900">Order received!</p>
        <p className="text-xs text-slate-500">Your card will ship via tracked courier within 3–5 business days.</p>
        <p className="font-mono text-xs font-bold text-emerald-700">Order #{order.orderNumber}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500">High-durability PVC card with embedded QR for {memberName}.</p>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-700">Card Tier</label>
        <div className="grid grid-cols-1 gap-2">
          {CARD_TIERS.map((tier) => (
            <button
              type="button"
              key={tier.value}
              onClick={() => setCardTier(tier.value)}
              className={`rounded-xl border p-3 text-left transition-all ${
                cardTier === tier.value
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <p className="text-sm font-bold text-slate-900">{tier.label}</p>
              <p className="text-[11px] text-slate-500">{tier.blurb}</p>
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Courier delivery address
        <textarea
          required
          rows={3}
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          placeholder="Street address, city, country, postal code"
          className="input mt-1"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <Truck className="h-4 w-4" />
        {loading ? "Placing order…" : "Confirm Order"}
      </button>
    </form>
  );
}
