"use client";

import { useState, useEffect, type FormEvent } from "react";
import { CheckCircle2, Truck, CreditCard, Banknote, ShieldCheck, MapPin, User, Phone } from "lucide-react";
import { useCreatePhysicalCardOrder } from "@/hooks/public/useCreatePhysicalCardOrder";
import StripeCardPaymentSection from "./StripeCardPaymentSection";

export default function PhysicalCardOrderForm({
  memberName,
  onOrdered,
}: {
  memberName: string;
  onOrdered?: () => void;
}) {
  const {
    pricing,
    pricingLoading,
    createOrder,
    createPaymentIntent,
    loading,
    error,
    setError,
  } = useCreatePhysicalCardOrder();

  const [cardTier, setCardTier] = useState<"STANDARD_PVC" | "GOLD_RFID_SMART" | "EXECUTIVE_TITANIUM">("STANDARD_PVC");
  const [recipientName, setRecipientName] = useState(memberName || "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "COD">("STRIPE");
  const [order, setOrder] = useState<{
    orderNumber: string;
    cardTier: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    deliveryAddress: string;
  } | null>(null);

  // Compute total based on active tier and admin pricing
  const currentTierConfig = pricing.tiers[cardTier] ?? pricing.tiers.STANDARD_PVC;
  const subtotal = currentTierConfig.price;
  const shippingFee = pricing.shippingFee;
  const totalAmount = subtotal + shippingFee;
  const currencySymbol = pricing.currency === "SLE" ? "SLE " : "$";

  // Dynamically adjust active tier and payment method when admin modifies pricing or enabled gateways
  useEffect(() => {
    if (pricing && pricing.tiers) {
      if (!pricing.tiers[cardTier]?.enabled) {
        const firstEnabled = (["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"] as const).find(
          (t) => pricing.tiers[t]?.enabled
        );
        if (firstEnabled) setCardTier(firstEnabled);
      }
      if (paymentMethod === "STRIPE" && !pricing.stripeEnabled && pricing.codEnabled) {
        setPaymentMethod("COD");
      } else if (paymentMethod === "COD" && !pricing.codEnabled && pricing.stripeEnabled) {
        setPaymentMethod("STRIPE");
      }
    }
  }, [pricing, cardTier, paymentMethod]);

  // Handle Cash on Delivery submission
  async function handleCodSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!deliveryAddress.trim()) {
      setError("Please provide a complete courier delivery address.");
      return;
    }
    if (!recipientPhone.trim()) {
      setError("Please provide a recipient contact phone number for the courier.");
      return;
    }

    const result = await createOrder({
      cardTier,
      deliveryAddress,
      recipientName: recipientName.trim() || memberName,
      recipientPhone: recipientPhone.trim(),
      paymentMethod: "COD",
    });

    if (result) {
      setOrder(result);
      onOrdered?.();
    }
  }

  // Handle Stripe Payment Gateway submission
  async function handleStripePay() {
    setError(null);

    if (!deliveryAddress.trim()) {
      setError("Please provide a complete courier delivery address before paying.");
      return;
    }
    if (!recipientPhone.trim()) {
      setError("Please provide a recipient contact phone number for the courier.");
      return;
    }

    // Initialize Payment Intent with verified admin pricing on backend
    const intent = await createPaymentIntent(cardTier, recipientName || memberName);
    if (!intent) return;

    // Finalize order with verified payment reference
    const result = await createOrder({
      cardTier,
      deliveryAddress,
      recipientName: recipientName.trim() || memberName,
      recipientPhone: recipientPhone.trim(),
      paymentMethod: "STRIPE",
      paymentRef: intent.id,
    });

    if (result) {
      setOrder(result);
      onOrdered?.();
    }
  }

  // Success view
  if (order) {
    const isCod = order.paymentMethod === "COD";
    return (
      <div className="space-y-4 py-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">Order Placed Successfully!</h3>
          <p className="font-mono text-sm font-bold text-emerald-700 mt-0.5">
            Order #{order.orderNumber}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Card Tier</span>
            <span className="font-bold text-slate-800">{order.cardTier.replaceAll("_", " ")}</span>
          </div>

          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Payment Channel</span>
            <span className="font-bold text-slate-800">
              {isCod ? "Cash on Delivery (COD)" : "Stripe Online Payment"}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Billing Status</span>
            <span className={`font-bold ${isCod ? "text-amber-600" : "text-emerald-600"}`}>
              {isCod
                ? `Due upon delivery: ${currencySymbol}${Number(order.amount).toFixed(2)}`
                : `Paid Full: ${currencySymbol}${Number(order.amount).toFixed(2)}`}
            </span>
          </div>

          <div className="flex justify-between pt-1">
            <span className="text-slate-500 font-medium">Courier Destination</span>
            <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">
              {order.deliveryAddress}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Your card has been queued at the official IPAM Bureau Print Press. You will receive SMS & email updates as your courier tracking code is generated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-slate-500">
          Official University of Sierra Leone Alumni Credentials with laser security finish.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Select Card Tier with Admin Pricing */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
          Step 1: Choose Card Tier
        </label>

        {pricingLoading ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading card tiers…</div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {(["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"] as const).map((tierKey) => {
              const tier = pricing.tiers[tierKey];
              if (!tier.enabled) return null;
              const isSelected = cardTier === tierKey;

              return (
                <button
                  type="button"
                  key={tierKey}
                  onClick={() => setCardTier(tierKey)}
                  className={`relative rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30 shadow-xs"
                      : "border-slate-200 bg-slate-50/70 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">{tier.name}</p>
                        {tierKey === "GOLD_RFID_SMART" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[9.5px] font-bold text-amber-800">
                            POPULAR
                          </span>
                        )}
                        {tierKey === "EXECUTIVE_TITANIUM" && (
                          <span className="rounded-full bg-slate-900 px-2 py-0.2 text-[9.5px] font-bold text-white">
                            PREMIUM METAL
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{tier.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-emerald-700">
                        {currencySymbol}{tier.price.toFixed(2)}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        {pricing.currency}
                      </p>
                    </div>
                  </div>

                  {/* Feature highlights */}
                  <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 border-t border-slate-200/50 pt-2">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Recipient & Delivery Information */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Step 2: Delivery & Contact Details
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Recipient Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Full name as printed"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contact Phone (Courier calls upon arrival)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="+232 76 123456 or local mobile"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Complete Delivery Street Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <textarea
              required
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Street name, House/Flat No, City, Country, Postal Code"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Step 3: Order Summary */}
      <div className="rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
          <span>Card Tier ({currentTierConfig.name})</span>
          <span className="font-mono">{currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
          <span>Tracked Courier Shipping</span>
          <span className="font-mono">
            {shippingFee === 0 ? "FREE" : `${currencySymbol}${shippingFee.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
          <span>Total Order Due</span>
          <span className="font-mono text-base font-black text-emerald-400">
            {currencySymbol}{totalAmount.toFixed(2)} {pricing.currency}
          </span>
        </div>
      </div>

      {/* Step 4: Payment Method Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Step 4: Select Payment Method
        </label>

        <div className="grid grid-cols-2 gap-3">
          {pricing.stripeEnabled && (
            <button
              type="button"
              onClick={() => setPaymentMethod("STRIPE")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                paymentMethod === "STRIPE"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Stripe Card</p>
                <p className="text-[10px] text-slate-500">Pay Online Instantly</p>
              </div>
            </button>
          )}

          {pricing.codEnabled && (
            <button
              type="button"
              onClick={() => setPaymentMethod("COD")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                paymentMethod === "COD"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Banknote className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Cash on Delivery</p>
                <p className="text-[10px] text-slate-500">Pay Courier on Arrival</p>
              </div>
            </button>
          )}
        </div>

        {/* Payment Channel Body */}
        {paymentMethod === "STRIPE" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <StripeCardPaymentSection
              amount={totalAmount}
              currency={pricing.currency}
              memberName={recipientName || memberName}
              loading={loading}
              onPay={handleStripePay}
            />
          </div>
        ) : (
          <form onSubmit={handleCodSubmit} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-start gap-2.5">
              <Banknote className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Cash on Delivery (COD) Terms</p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  You will pay <strong>{currencySymbol}{totalAmount.toFixed(2)} {pricing.currency}</strong> directly to the courier agent upon receiving your card parcel.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
            >
              <Truck className="h-4 w-4" />
              <span>
                {loading
                  ? "Placing COD Order…"
                  : `Confirm Order (${currencySymbol}${totalAmount.toFixed(2)} Due on Delivery)`}
              </span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Identity verification required upon courier collection</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
