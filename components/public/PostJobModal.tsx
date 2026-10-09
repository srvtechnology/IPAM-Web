"use client";

import { useState, type FormEvent } from "react";
import { X, Plus, Building2, MapPin, DollarSign, Calendar, Users, Briefcase, Zap, CheckCircle2 } from "lucide-react";
import { useCreateJob } from "@/hooks/public/useCreateJob";
import { COUNTRIES_DATA, getStatesForCountry, getCitiesForState, formatLocation } from "@/lib/locations-data";

const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "REMOTE", label: "Remote Only" },
];

const CATEGORIES = [
  { value: "ENGINEERING", label: "Engineering" },
  { value: "DATA_AI", label: "Data & AI" },
  { value: "FINANCE_BANKING", label: "Finance & Banking" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "PRODUCT_DESIGN", label: "Product & Design" },
  { value: "LEGAL_PUBLIC_POLICY", label: "Legal & Public Policy" },
];

const WORKPLACE_TYPES = [
  { value: "ON_SITE", label: "On-Site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Fully Remote" },
];

export default function PostJobModal({ onClose }: { onClose: () => void }) {
  const { createJob, loading, error } = useCreateJob();

  // Location Cascading State
  const defaultCountry = "Sierra Leone";
  const defaultStates = getStatesForCountry(defaultCountry);
  const defaultState = defaultStates[0] || "";
  const defaultCities = getCitiesForState(defaultCountry, defaultState);
  const defaultCity = defaultCities[0] || "";

  const [country, setCountry] = useState(defaultCountry);
  const [availableStates, setAvailableStates] = useState<string[]>(defaultStates);
  const [state, setState] = useState(defaultState);
  const [availableCities, setAvailableCities] = useState<string[]>(defaultCities);
  const [city, setCity] = useState(defaultCity);

  const [form, setForm] = useState({
    title: "",
    company: "",
    type: "FULL_TIME",
    workplaceType: "ON_SITE",
    category: "ENGINEERING",
    salary: "",
    positionsOpen: 1,
    experienceRequired: false,
    experienceLevel: "1-3 Years",
    hiringType: "TILL_DATE", // "IMMEDIATE" | "TILL_DATE"
    deadline: "",
    aboutCompany: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
  });

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    const states = getStatesForCountry(newCountry);
    setAvailableStates(states);
    const firstState = states[0] || "";
    setState(firstState);
    const cities = getCitiesForState(newCountry, firstState);
    setAvailableCities(cities);
    setCity(cities[0] || "");
  }

  function handleStateChange(newState: string) {
    setState(newState);
    const cities = getCitiesForState(country, newState);
    setAvailableCities(cities);
    setCity(cities[0] || "");
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const locationFormatted = formatLocation(city, state, country);

    const deadlineValue =
      form.hiringType === "IMMEDIATE"
        ? null
        : form.deadline
        ? new Date(form.deadline).toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString();

    const rawReqs = form.requirements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const ok = await createJob({
      title: form.title.trim(),
      company: form.company.trim(),
      country: country || "Sierra Leone",
      state: state || null,
      city: city || null,
      location: locationFormatted,
      type: form.type,
      workplaceType: form.workplaceType,
      category: form.category,
      salary: form.salary.trim() || "Competitive / Market Standard",
      positionsOpen: Number(form.positionsOpen) || 1,
      experienceRequired: Boolean(form.experienceRequired),
      experienceLevel: form.experienceRequired ? form.experienceLevel || "1-3 Years" : null,
      hiringType: form.hiringType,
      deadline: deadlineValue,
      aboutCompany: form.aboutCompany.trim() || null,
      description:
        form.description.trim() ||
        `Exciting job opportunity at ${form.company} for a qualified ${form.title}. Apply now on the IPAM Careers Network.`,
      requirements:
        rawReqs.length > 0
          ? rawReqs
          : ["Relevant qualifications or equivalent practical experience"],
      responsibilities: form.responsibilities
        ? form.responsibilities
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      benefits: form.benefits
        ? form.benefits
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    });

    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative my-8 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl sm:p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>IPAM Career Network</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-black text-slate-900">Post a Job Opening</h2>
            <p className="text-xs text-slate-500">
              Publish an opportunity with verified role attributes, location dropdowns, and hiring milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Unable to publish job opening:</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-700">
              Job Title *
              <input
                required
                placeholder="e.g. Lead Financial Analyst"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Employer / Hiring Company *
              <input
                required
                placeholder="e.g. Standard Chartered / Ministry of Trade"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>

          {/* Location: Country, State, City Cascading Dropdowns */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location Selection (Cascading Dropdowns)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Country *</label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                >
                  {COUNTRIES_DATA.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">State / Province / Region *</label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                >
                  {availableStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Municipality *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                >
                  {availableCities.map((ci) => (
                    <option key={ci} value={ci}>
                      {ci}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Selected Location: <strong>{formatLocation(city, state, country)}</strong></span>
            </div>
          </div>

          {/* Category, Job Type, Workplace Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-xs font-bold text-slate-700">
              Category
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Employment Type
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Workplace Mode
              <select
                value={form.workplaceType}
                onChange={(e) => update("workplaceType", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
              >
                {WORKPLACE_TYPES.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Salary Range & Number of Positions Open */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-700">
              Salary Range *
              <input
                required
                placeholder="e.g. SLE 20,000 - 30,000 / mo or $65k - $80k"
                value={form.salary}
                onChange={(e) => update("salary", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Number of Positions Open *
              <input
                type="number"
                min={1}
                max={50}
                required
                value={form.positionsOpen}
                onChange={(e) => update("positionsOpen", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>

          {/* Experience Required Toggle & Level */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Experience Required?</div>
                <div className="text-[11px] text-slate-500">Does this role require prior working experience?</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update("experienceRequired", false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !form.experienceRequired
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  No (Freshers)
                </button>
                <button
                  type="button"
                  onClick={() => update("experienceRequired", true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    form.experienceRequired
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Yes (Required)
                </button>
              </div>
            </div>

            {form.experienceRequired && (
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700">
                  Required Experience Level
                  <select
                    value={form.experienceLevel}
                    onChange={(e) => update("experienceLevel", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="Entry-level (0-1 Years)">Entry-level (0-1 Years)</option>
                    <option value="1-3 Years">Junior / Mid (1-3 Years)</option>
                    <option value="3-5 Years">Mid-Senior (3-5 Years)</option>
                    <option value="5-8 Years">Senior Lead (5-8 Years)</option>
                    <option value="8+ Years Executive">Executive / Director (8+ Years)</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* Hiring Timeline: Till Date or Immediate */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="text-xs font-bold text-slate-800">Hiring Urgency &amp; Timeline</div>

            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => update("hiringType", "TILL_DATE")}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.hiringType === "TILL_DATE"
                    ? "border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="hiringType"
                  checked={form.hiringType === "TILL_DATE"}
                  onChange={() => update("hiringType", "TILL_DATE")}
                  className="sr-only"
                />
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Hiring Till Date</span>
              </label>

              <label
                onClick={() => update("hiringType", "IMMEDIATE")}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.hiringType === "IMMEDIATE"
                    ? "border-rose-500 bg-rose-50/60 text-rose-950 font-bold"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="hiringType"
                  checked={form.hiringType === "IMMEDIATE"}
                  onChange={() => update("hiringType", "IMMEDIATE")}
                  className="sr-only"
                />
                <Zap className="w-4 h-4 text-rose-600" />
                <span className="text-xs">Immediate Hiring</span>
              </label>
            </div>

            {form.hiringType === "TILL_DATE" && (
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700">
                  Application Deadline / Hiring Till Date *
                  <input
                    type="date"
                    required={form.hiringType === "TILL_DATE"}
                    value={form.deadline}
                    onChange={(e) => update("deadline", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            )}
          </div>

          {/* About Company */}
          <label className="block text-xs font-bold text-slate-700">
            About the Hiring Company
            <textarea
              rows={2}
              placeholder="Tell applicants about your organization's mission, work environment, and impact…"
              value={form.aboutCompany}
              onChange={(e) => update("aboutCompany", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          {/* Description */}
          <label className="block text-xs font-bold text-slate-700">
            Job Description *
            <textarea
              required
              rows={3}
              placeholder="Outline the core responsibilities, team structure, and day-to-day work…"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          {/* Requirements */}
          <label className="block text-xs font-bold text-slate-700">
            Requirements * (One per line)
            <textarea
              required
              rows={3}
              placeholder="BSc in Accounting or related degree from IPAM&#10;Proficiency in financial modelling&#10;Strong communication skills"
              value={form.requirements}
              onChange={(e) => update("requirements", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          {/* Benefits */}
          <label className="block text-xs font-bold text-slate-700">
            Perks &amp; Benefits (Optional, one per line)
            <textarea
              rows={2}
              placeholder="Health insurance &amp; wellness stipend&#10;Flexible hybrid schedule&#10;Annual professional training fund"
              value={form.benefits}
              onChange={(e) => update("benefits", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
        </div>

        {/* Submit */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{loading ? "Publishing Opening…" : "Publish Job Opening"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
