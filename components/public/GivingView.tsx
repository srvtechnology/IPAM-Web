"use client";

import { useState, type ElementType, type FormEvent } from "react";
import {
  HeartHandshake,
  ShieldCheck,
  Award,
  CheckCircle2,
  Sparkles,
  Download,
  Lock,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Laptop,
  Heart,
  ArrowRight,
  Check,
  Share2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Smartphone,
  Landmark,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import { useCreateDonation } from "@/hooks/public/useCreateDonation";
import type { FundId, FundMeta } from "@/lib/public/giving-funds";

const FUND_ICONS: Record<FundId, ElementType> = {
  scholarship: GraduationCap,
  innovation: Laptop,
  emergency: Heart,
  faculty: BookOpen,
};

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];
const CURRENCIES = [
  { value: "USD", label: "USD ($) - US Dollar" },
  { value: "SLE", label: "SLE (NLe) - Sierra Leone Leone" },
  { value: "GBP", label: "GBP (£) - British Pound" },
  { value: "EUR", label: "EUR (€) - Euro" },
];

const FAQS = [
  {
    question: "Is my gift tax-deductible?",
    answer:
      "Yes. Gifts made to the IPAM Alumni Association are tax-exempt under 501(c)(3) guidelines for US contributors and recognized under Sierra Leone National Revenue Authority (NRA) charitable contribution relief statutes. An official tax receipt with a verified reference number is generated instantly.",
  },
  {
    question: "Can I donate using Sierra Leonean Mobile Money (Orange Money or AfriMoney)?",
    answer:
      "Yes! We proudly accept Orange Money and AfriMoney for alumni residing in or visiting Sierra Leone and West Africa, alongside international debit/credit cards (Visa, MasterCard, Amex) and direct bank wire transfers.",
  },
  {
    question: "How are the funds governed and audited?",
    answer:
      "100% of designated contributions go directly to the chosen program. The fund is governed by the IPAM Alumni Board of Trustees and university financial officers. Annual independent audits are performed by an internationally accredited accounting firm, with full reports published openly.",
  },
  {
    question: "Can I establish an endowed scholarship in honor of someone?",
    answer:
      "Yes. You can dedicate gifts of any size during checkout. If you or your class cohort wish to endow a named permanent scholarship ($5,000+), our Office of Alumni Relations will work directly with you to outline candidate criteria and annual ceremony recognition.",
  },
  {
    question: "Does IPAM accept employer matching gifts?",
    answer:
      "Many global employers match charitable gifts made by their employees dollar-for-dollar. Check with your company's HR or CSR department, or contact our team at treasury@ipamalumni.org for our formal EIN and registration certificates.",
  },
];

function getCurrencySymbol(curr: string) {
  switch (curr) {
    case "GBP":
      return "£";
    case "EUR":
      return "€";
    case "SLE":
      return "NLe ";
    default:
      return "$";
  }
}

function getImpactDescription(amt: number) {
  if (amt <= 25) return "Provides 1 complete core textbook set & essential examination stationery.";
  if (amt <= 50) return "Covers 1 month of high-speed campus internet access & digital research library access.";
  if (amt <= 100) return "Covers student semester union dues, lab fees, and academic tutoring support.";
  if (amt <= 250) return "Sponsors 1 full semester tuition grant for an underprivileged undergraduate scholar.";
  if (amt <= 500) return "Covers a comprehensive full-year academic tuition scholarship for a deserving student.";
  return "Endows a named leadership scholarship and funds a campus computer workstation subsidy.";
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface FundWithStats extends FundMeta {
  raised: number;
  donorsCount: number;
}

interface RecentDonation {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  fund: string;
  createdAt: string;
}

interface GivingViewProps {
  funds: FundWithStats[];
  recentDonations: RecentDonation[];
}

interface ReceiptData {
  amount: number;
  currency: string;
  fund: string;
  frequency: string;
  ref: string;
  date: string;
  donorName: string;
  isAnonymous: boolean;
  dedication?: string;
}

export default function GivingView({ funds, recentDonations }: GivingViewProps) {
  const { session } = useApp();
  const { createDonation, loading, error } = useCreateDonation();

  const [selectedFund, setSelectedFund] = useState<FundId>(funds[0]?.id ?? "scholarship");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "momo" | "bank" | "paypal">("card");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDedication, setIsDedication] = useState(false);
  const [dedicationName, setDedicationName] = useState("");
  const [donorName, setDonorName] = useState(session?.profile?.name ?? "");
  const [donorEmail, setDonorEmail] = useState(session?.email ?? "");
  const [donorClass, setDonorClass] = useState(session?.profile?.classYear ? String(session.profile.classYear) : "");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const currentFund = funds.find((f) => f.id === selectedFund) ?? funds[0];
  const activeAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  async function handleDonate(e: FormEvent) {
    e.preventDefault();
    if (!currentFund || isNaN(activeAmount) || activeAmount <= 0) return;

    const result = await createDonation({
      donorName,
      donorEmail,
      amount: activeAmount,
      currency,
      fund: currentFund.title,
      frequency: frequency === "monthly" ? "MONTHLY" : "ONE_TIME",
      paymentMethod: paymentMethod.toUpperCase(),
      isDedication,
      dedicationName: isDedication && dedicationName ? dedicationName : undefined,
      isAnonymous,
    });

    if (result) {
      setReceiptData({
        amount: activeAmount,
        currency,
        fund: currentFund.title,
        frequency: frequency === "monthly" ? "Monthly Sustaining" : "One-Time Contribution",
        ref: result.paymentRef,
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        donorName: isAnonymous ? "Anonymous Donor" : donorName,
        isAnonymous,
        dedication: isDedication && dedicationName ? dedicationName : undefined,
      });
    }
  }

  function handleDownloadReceipt() {
    if (!receiptData) return;
    const content = [
      "===========================================================",
      "         INSTITUTE OF PUBLIC ADMINISTRATION & MANAGEMENT",
      "              UNIVERSITY OF SIERRA LEONE",
      "                 OFFICIAL CHARITABLE GIFT RECEIPT",
      "===========================================================",
      "",
      `Receipt Reference: ${receiptData.ref}`,
      `Date Issued:       ${receiptData.date}`,
      `Donor Name:        ${receiptData.donorName}`,
      `Designation Fund:  ${receiptData.fund}`,
      `Gift Schedule:     ${receiptData.frequency}`,
      `Total Amount:      ${getCurrencySymbol(receiptData.currency)}${receiptData.amount.toLocaleString()} ${receiptData.currency}`,
      receiptData.dedication ? `Dedication:        In Honor/Memory of ${receiptData.dedication}` : "",
      "",
      "Tax Status:",
      "Contributions are tax-deductible under 501(c)(3) regulations and",
      "Sierra Leone National Revenue Authority (NRA) charitable statutes.",
      "No goods or services were provided in exchange for this contribution.",
      "",
      "Thank you for investing in the future of IPAM leaders!",
      "Office of Alumni Relations & University Endowment Board",
      "Tower Hill, Freetown, Sierra Leone | treasury@ipamalumni.org",
      "===========================================================",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${receiptData.ref}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async function handleCopyShare() {
    const text =
      "I just supported the IPAM Alumni Endowment Fund to empower deserving scholars in Sierra Leone! Join me in giving back.";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API unavailable — still surface the confirmation
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* Hero banner */}
      <section className="relative flex min-h-[580px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[640px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/ipam_university_campus_1788350001937.jpg"
            alt="Institute of Public Administration and Management campus"
            className="h-full w-full scale-105 transform object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-emerald-950/80" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-xs backdrop-blur-md">
            <HeartHandshake className="h-4 w-4 text-emerald-400" />
            <span>IPAM Alumni Philanthropy & Student Endowment Fund • University of Sierra Leone</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Empowering the Next Generation of African Leaders & Innovators
            </h1>
            <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
              For over four decades, IPAM has trained visionary public servants, chartered accountants, and
              technology pioneers. Your gift fuels need-based scholarships, builds state-of-the-art AI computer
              laboratories, and provides emergency relief so no deserving student is left behind.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#giving-form"
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-black text-slate-950 shadow-md transition-all hover:bg-emerald-400 active:scale-98 sm:text-sm"
            >
              <span>Make a Contribution Today</span>
              <ArrowRight className="h-4 w-4 text-slate-950" />
            </a>
            <a
              href="#impact-pillars"
              className="rounded-xl border border-slate-700/80 bg-slate-900/80 px-5 py-3 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-800 sm:text-sm"
            >
              Explore Funds & Impact
            </a>
            <a
              href="#donor-honor-roll"
              className="rounded-xl border border-slate-700/80 bg-slate-900/80 px-5 py-3 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-800 sm:text-sm"
            >
              Community Honor Roll
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6 sm:grid-cols-4">
            {[
              { value: `$${funds.reduce((sum, f) => sum + f.raised, 0).toLocaleString()}+`, label: "Total Contributed" },
              { value: `${funds.reduce((sum, f) => sum + f.donorsCount, 0)}+`, label: "Gifts Recorded" },
              { value: "100%", label: "Direct to Student Programs" },
              { value: "501(c)(3) & NRA", label: "Tax-Exempt Relief" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
                <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{stat.value}</div>
                <div className="mt-0.5 text-xs font-medium text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        {/* A. Giving console */}
        <section id="giving-form" className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="border-b border-slate-100 pb-5">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Support the Endowment</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Make Your Gift to IPAM</h2>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Select your preferred designation fund, currency, and contribution schedule. Every gift receives an
              immediate, verified tax receipt.
            </p>
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {receiptData ? (
            <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-100 text-emerald-700 shadow-2xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Contribution Successfully Recorded
                </span>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Thank You for Your Generosity!
                </h3>
                <p className="mx-auto max-w-md text-xs text-slate-600 sm:text-sm">
                  Your contribution directly empowers students at IPAM. An official tax receipt has been generated
                  and filed with the university endowment records.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-left text-xs shadow-xs sm:text-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-500">Official Reference:</span>
                  <code className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-sm font-bold text-emerald-700">
                    {receiptData.ref}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Contributed Amount:</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {getCurrencySymbol(receiptData.currency)}
                    {receiptData.amount.toLocaleString()} {receiptData.currency}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 font-medium text-slate-500">Designated Fund:</span>
                  <span className="text-right font-semibold text-slate-900">{receiptData.fund}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Contribution Schedule:</span>
                  <span className="font-medium text-slate-800">{receiptData.frequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Donor Recognition:</span>
                  <span className="font-bold text-slate-900">{receiptData.donorName}</span>
                </div>
                {receiptData.dedication && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Dedication:</span>
                    <span className="font-medium text-slate-800">In Honor/Memory of {receiptData.dedication}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span>Tax Status: 501(c)(3) & NRA Exempt</span>
                  <span>Date: {receiptData.date}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-98 sm:text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Official Receipt (.TXT)</span>
                </button>
                <button
                  onClick={handleCopyShare}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 sm:text-sm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 text-slate-400" />
                      <span>Share Giving News</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setReceiptData(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 sm:text-sm"
                >
                  Make Another Gift
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleDonate} className="space-y-8">
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 sm:text-sm">
                      Contribution Frequency
                    </label>
                    <p className="text-xs text-slate-500">
                      Sustaining monthly gifts provide reliable semester-long support for ongoing scholarships
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFrequency("one-time")}
                      className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                        frequency === "one-time" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      One-Time Gift
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency("monthly")}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                        frequency === "monthly" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>Monthly Partner</span>
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Enduring
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 sm:text-sm">
                    Step 1: Select Your Designation Fund
                  </label>
                  <span className="text-xs font-semibold text-slate-500">100% directly allocated</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {funds.map((fund) => {
                    const Icon = FUND_ICONS[fund.id];
                    const isSelected = selectedFund === fund.id;
                    const percent = Math.min(100, Math.round((fund.raised / fund.goal) * 100));
                    return (
                      <div
                        key={fund.id}
                        onClick={() => setSelectedFund(fund.id)}
                        className={`flex cursor-pointer flex-col justify-between space-y-4 rounded-2xl border p-5 text-left transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20"
                            : "border-slate-200/90 bg-slate-50 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`rounded-xl border p-2.5 ${
                                  isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-700"
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="rounded border border-emerald-200 bg-emerald-100/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                  {fund.badge}
                                </span>
                                <h4 className="mt-1 text-sm font-bold leading-snug text-slate-900 sm:text-base">{fund.title}</h4>
                              </div>
                            </div>
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600">{fund.description}</p>
                        </div>

                        <div className="space-y-1.5 border-t border-slate-200/60 pt-2">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Raised: ${fund.raised.toLocaleString()}</span>
                            <span className="font-bold text-emerald-700">{percent}% of Goal</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div className="h-1.5 rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-500">
                            <span>Goal: ${fund.goal.toLocaleString()}</span>
                            <span>{fund.donorsCount} Alumni Donors</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <label className="text-xs font-extrabold text-slate-900 sm:text-sm">Step 2: Choose Gift Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Currency:</span>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-emerald-500"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount("");
                        }}
                        className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-3 text-sm font-extrabold transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100/80"
                        }`}
                      >
                        <span>
                          {getCurrencySymbol(currency)}
                          {amt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">
                    Or Custom Amount ({getCurrencySymbol(currency)}):
                  </span>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    placeholder="Enter specific amount…"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-44 pr-4 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <span className="font-extrabold text-emerald-900">Immediate Impact: </span>
                    <span className="font-medium text-emerald-800">{getImpactDescription(activeAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-2">
                <label className="block text-xs font-extrabold text-slate-900 sm:text-sm">
                  Step 3: Donor Details & Recognition
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Full Name / Organization</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g., Alex Sesay"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Email Address (for Tax Receipt)</label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="e.g., alex@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Class Year / Affiliation</label>
                    <input
                      type="text"
                      value={donorClass}
                      onChange={(e) => setDonorClass(e.target.value)}
                      placeholder="e.g., 2021 or Friend of IPAM"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={isDedication}
                      onChange={(e) => setIsDedication(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Dedicate this gift in honor or memory of a loved one, professor, or mentor</span>
                  </label>
                  {isDedication && (
                    <div className="pl-6 pt-1">
                      <input
                        type="text"
                        value={dedicationName}
                        onChange={(e) => setDedicationName(e.target.value)}
                        placeholder="e.g., In memory of Late Professor J.K. Sesay"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-emerald-500 sm:max-w-md"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Keep my name anonymous on public alumni donor honor rolls</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-2">
                <label className="block text-xs font-extrabold text-slate-900 sm:text-sm">Step 4: Secure Payment Channel</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { id: "card" as const, label: "Credit / Debit Card", icon: CreditCard },
                    { id: "momo" as const, label: "Orange / AfriMoney", icon: Smartphone },
                    { id: "bank" as const, label: "Bank Wire (SWIFT)", icon: Landmark },
                    { id: "paypal" as const, label: "PayPal / Digital", icon: Lock },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                        paymentMethod === method.id
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <method.icon className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-md transition-all hover:bg-emerald-700 active:scale-98 disabled:opacity-60 sm:text-base"
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {loading
                      ? "Processing Secure Contribution…"
                      : `Confirm Gift of ${getCurrencySymbol(currency)}${activeAmount.toLocaleString()} ${currency} (${
                          frequency === "monthly" ? "Monthly" : "One-Time"
                        })`}
                  </span>
                </button>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>256-Bit Bank Grade SSL Encryption</span>
                  </span>
                  <span>•</span>
                  <span>Instant 501(c)(3) & NRA Tax Receipt</span>
                  <span>•</span>
                  <span>No Overhead Fees Deducted</span>
                </div>
              </div>
            </form>
          )}
        </section>

        {/* B. Impact pillars */}
        <section id="impact-pillars" className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <span>Accountability & Transparency</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Where Your Contribution Goes
              </h3>
            </div>
            <span className="max-w-xs text-xs font-medium text-slate-500">
              Every dollar is stewarded with clean audit standards and university oversight
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                iconClass: "border-emerald-200 bg-emerald-100 text-emerald-700",
                outcomeClass: "text-emerald-800",
                title: "Tuition Relief & Student Retention",
                body: "Financial hardship should never terminate a promising academic career. Your donations fund full and partial tuition waivers, examination clearance fees, and core literature stipends.",
                outcome: "Outcome: 480+ graduates enabled who now lead corporate and public sectors.",
              },
              {
                icon: Laptop,
                iconClass: "border-teal-200 bg-teal-100 text-teal-700",
                outcomeClass: "text-teal-800",
                title: "Campus AI & Computer Laboratories",
                body: "Equipping the IPAM Main Tower Campus with commercial high-speed internet, workstation towers, cloud computing credits, and uninterrupted solar inverter backup power.",
                outcome: "Outcome: 3 state-of-the-art labs active daily for 2,400+ tech & business students.",
              },
              {
                icon: Heart,
                iconClass: "border-amber-200 bg-amber-100 text-amber-700",
                outcomeClass: "text-amber-800",
                title: "24-Hour Crisis Hardship Safety Net",
                body: "When sudden tragedies occur — loss of a family breadwinner, urgent medical procedures, or housing emergencies — our rapid hardship panel disburses immediate relief grants within 48 hours.",
                outcome: "Outcome: 85+ urgent emergency interventions with 100% student graduation rate.",
              },
            ].map((pillar) => (
              <div key={pillar.title} className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
                <div className="space-y-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${pillar.iconClass}`}>
                    <pillar.icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{pillar.title}</h4>
                  <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{pillar.body}</p>
                </div>
                <div className="border-t border-slate-200/60 pt-4">
                  <span className={`block text-xs font-bold ${pillar.outcomeClass}`}>{pillar.outcome}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* C. Testimonials */}
        <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="border-b border-slate-100 pb-5">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>Voices of Gratitude</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Stories of Transformed Lives</h3>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Read how your generosity creates measurable impact for young scholars and faculty members
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "When my father fell ill during my second year, I was prepared to withdraw. The IPAM Alumni Scholarship covered my tuition and books through graduation. Today, I am proud to work as a Senior Financial Analyst at KPMG Sierra Leone.",
                name: "Aminata Kamara",
                role: "B.Sc. Applied Accounting, '23",
                position: "Senior Financial Analyst, KPMG",
              },
              {
                quote:
                  "Access to the modernized AI and Computing Lab gave me hands-on experience with modern servers, cloud architecture, and data engineering. Our student team went on to win the West Africa FinTech Hackathon!",
                name: "Mohamed Bangura",
                role: "B.Sc. Information Systems, '22",
                position: "Founder, PayLink Sierra Leone",
              },
              {
                quote:
                  "Alumni gifts provide the critical margin between an adequate education and world-class academic excellence. The endowment has attracted visiting professors from Oxford and supported our international research accreditations.",
                name: "Dr. Fatmata Mansaray",
                role: "Dean, Faculty of Management",
                position: "IPAM, University of Sierra Leone",
              },
            ].map((story) => (
              <div key={story.name} className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
                <p className="text-xs italic leading-relaxed text-slate-700 sm:text-sm">&ldquo;{story.quote}&rdquo;</p>
                <div className="flex items-center gap-3 border-t border-slate-200/60 pt-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-100 text-sm font-bold text-emerald-700">
                    {story.name.charAt(0)}
                  </span>
                  <div className="text-xs">
                    <h5 className="font-bold text-slate-900">{story.name}</h5>
                    <p className="font-medium text-emerald-700">{story.role}</p>
                    <p className="text-[11px] text-slate-500">{story.position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* D. Giving societies */}
        <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="border-b border-slate-100 pb-5">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Award className="h-3.5 w-3.5 text-emerald-600" />
              <span>Giving Circles & Honors</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Alumni Recognition Societies</h3>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              All donors are recognized on our annual donor rolls with special commemorative honors for major patrons
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                tier: "Tier I",
                tierColor: "text-slate-500",
                range: "$25 – $99",
                rangeClass: "bg-white text-slate-700 border-slate-200",
                name: "Friends of IPAM",
                perks: ["Listing on online annual donor wall", "Digital donor recognition badge", "Quarterly Alumni Impact Newsletter"],
              },
              {
                tier: "Tier II",
                tierColor: "text-emerald-700",
                range: "$100 – $499",
                rangeClass: "bg-emerald-100/60 text-emerald-800 border-emerald-200",
                name: "Bronze Patron",
                perks: ["Special badge on Digital Alumni Pass", "Annual Printed Report recognition", "Priority registration for Alumni Summits"],
              },
              {
                tier: "Tier III",
                tierColor: "text-teal-700",
                range: "$500 – $1,999",
                rangeClass: "bg-teal-100/60 text-teal-800 border-teal-200",
                name: "Silver Benefactor",
                perks: ["VIP seating at Global Homecoming Gala", "Invitation to Annual Chancellor Dinner", "Named Mentorship Fellowship status"],
              },
              {
                tier: "Leadership",
                tierColor: "text-amber-700",
                range: "$2,000+",
                rangeClass: "bg-amber-100/60 text-amber-800 border-amber-200",
                name: "Chancellor's Circle",
                perks: [
                  "Named Perpetual Scholarship Endowment",
                  "Engraved recognition plaque on Main Campus",
                  "Private annual briefing with University Leadership",
                ],
              },
            ].map((tier) => (
              <div key={tier.name} className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                <div className="flex items-start justify-between">
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${tier.tierColor}`}>{tier.tier}</span>
                  <span className={`rounded border px-2 py-0.5 text-xs font-bold ${tier.rangeClass}`}>{tier.range}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{tier.name}</h4>
                <ul className="list-disc space-y-1.5 pl-4 text-xs text-slate-600">
                  {tier.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* E. Community honor roll (real data) */}
        <section id="donor-honor-roll" className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                <span>Community Solidarity</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Recent Alumni Benefactors</h3>
            </div>
            <a href="#giving-form" className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">
              <span>Add Your Name to the Honor Roll</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {recentDonations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Be the first alumnus or alumna to appear on the honor roll — your gift will be recorded here in real time.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-100 text-sm font-bold text-emerald-700">
                      {donation.donorName.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <h5 className="truncate text-xs font-bold text-slate-900">{donation.donorName}</h5>
                      <p className="truncate text-[11px] text-slate-500">{donation.fund}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-xs font-extrabold text-emerald-700">
                      {getCurrencySymbol(donation.currency)}
                      {donation.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatRelativeTime(donation.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* F. FAQ */}
        <section className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="border-b border-slate-100 pb-4">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Questions & Governance</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Giving FAQs & Fiscal Integrity</h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={faq.question} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left text-xs font-bold text-slate-900 hover:text-emerald-700 sm:p-5 sm:text-sm"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-200/60 px-4 pb-5 pt-3 text-xs leading-relaxed text-slate-600 sm:px-5 sm:text-sm">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* G. Other ways to partner */}
        <section className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="border-b border-slate-100 pb-4">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Landmark className="h-3.5 w-3.5 text-emerald-600" />
              <span>Alternative Giving Channels</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Other Ways to Partner With Us</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Landmark className="h-4 w-4 text-emerald-600" />
                Bank Wire / SWIFT Transfer
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">
                Direct transfers to our Sierra Leone Commercial Bank (SLCB) or London correspondent accounts.
              </p>
              <div className="pt-2">
                <span className="block truncate rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-bold text-slate-700">
                  SWIFT: SLCBSLFRXXX • A/C: 0030010928
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Corporate Matching & Grants
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">
                Double your impact through corporate CSR matching schemes. We provide all formal charity verification
                forms.
              </p>
              <a href="mailto:treasury@ipamalumni.org" className="inline-block pt-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">
                treasury@ipamalumni.org &rarr;
              </a>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Award className="h-4 w-4 text-emerald-600" />
                Legacy & Bequest Endowments
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">
                Include IPAM in your estate planning or establish a multi-year cohort scholarship in honor of your
                graduation class.
              </p>
              <a href="mailto:outreach@ipamalumni.org" className="inline-block pt-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">
                outreach@ipamalumni.org &rarr;
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
