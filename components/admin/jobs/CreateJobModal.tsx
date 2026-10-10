"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAdminJobs } from "@/hooks/admin/useAdminJobs";
import { COUNTRIES_DATA, getStatesForCountry, getCitiesForState, formatLocation } from "@/lib/locations-data";

interface EmployerOption {
  id: string;
  name: string;
}

const inputClass =
  "mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary";

export default function CreateJobModal({
  employers,
  onClose,
}: {
  employers: EmployerOption[];
  onClose: () => void;
}) {
  const { createJob, loading, error } = useAdminJobs();
  const [createdJob, setCreatedJob] = useState<{
    id: string;
    title: string;
    company: string;
    location?: string;
    positionsOpen?: number;
  } | null>(null);

  // Location cascading state
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
    employerId: "",
    category: "ENGINEERING",
    workMode: "ON_SITE",
    type: "FULL_TIME",
    salary: "",
    positionsOpen: 1,
    experienceRequired: false,
    experienceLevel: "1-3 Years",
    hiringType: "TILL_DATE",
    closingDate: "",
    aboutCompany: "",
    description: "",
    requirements: "",
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

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const locationFormatted = formatLocation(city, state, country);

    const result = await createJob({
      title: form.title,
      company: form.company,
      employerId: form.employerId || undefined,
      country,
      state,
      city,
      location: locationFormatted,
      workMode: form.workMode,
      workplaceType: form.workMode,
      type: form.type,
      category: form.category,
      salary: form.salary,
      salaryRange: form.salary,
      positionsOpen: Number(form.positionsOpen) || 1,
      experienceRequired: form.experienceRequired,
      experienceLevel: form.experienceRequired ? form.experienceLevel : undefined,
      hiringType: form.hiringType,
      closingDate: form.hiringType === "IMMEDIATE" ? null : form.closingDate || null,
      aboutCompany: form.aboutCompany || undefined,
      description: form.description,
      requirements: form.requirements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });

    if (result && result.id) {
      setCreatedJob({
        id: result.id,
        title: result.title || form.title,
        company: result.company || form.company,
        location: result.location || locationFormatted,
        positionsOpen: result.positionsOpen || Number(form.positionsOpen) || 1,
      });
    }
  }

  if (createdJob) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
        <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 sm:p-8 shadow-2xl border border-outline-variant/30 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-container text-on-primary-container mb-2">
            <span className="material-symbols-outlined text-[14px]">work</span>
            <span>Job Listing Published</span>
          </div>

          <h2 className="font-headline-md text-on-surface text-xl sm:text-2xl font-bold">
            Job Created Successfully!
          </h2>
          <p className="font-body-default text-on-surface-variant text-xs sm:text-sm mt-1 mb-5">
            The institutional vacancy is now live and accepting alumni applications.
          </p>

          {/* Job summary card */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-left mb-6 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-headline-sm text-on-surface font-bold text-base">{createdJob.title}</h3>
                <p className="font-body-default text-primary font-semibold text-xs mt-0.5">{createdJob.company}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                ACTIVE
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-on-surface-variant font-medium border-t border-outline-variant/15">
              {createdJob.location && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span>{createdJob.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">groups</span>
                <span>
                  {createdJob.positionsOpen} {createdJob.positionsOpen === 1 ? "opening" : "openings"}
                </span>
              </span>
            </div>
          </div>

          {/* Action options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/admin/jobs/${createdJob.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-on-primary font-bold shadow-md transition-all text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span>See Job Details</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-colors text-xs sm:text-sm border border-outline-variant/20"
            >
              <span>Done &amp; Return to List</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl my-8 max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/15 pb-3">
          <div>
            <h2 className="font-headline-md text-on-surface">New Institutional Job Listing</h2>
            <p className="font-body-compact text-on-surface-variant text-xs">
              Create an administrative vacancy with location dropdowns and recruiting milestones.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          {/* Title & Employer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="font-body-compact text-on-surface-variant text-xs">
              Job Title *
              <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
            </label>
            <label className="font-body-compact text-on-surface-variant text-xs">
              Hiring Company / Organization *
              <input required value={form.company} onChange={(e) => set("company", e.target.value)} className={inputClass} />
            </label>
          </div>

          <label className="font-body-compact text-on-surface-variant text-xs block">
            Employer Partner (Optional corporate linkage)
            <select value={form.employerId} onChange={(e) => set("employerId", e.target.value)} className={inputClass}>
              <option value="">— none —</option>
              {employers.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </label>

          {/* Location Cascading Dropdowns */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/25 space-y-2.5">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              <span>Location Selection (Country, State &amp; City Dropdowns)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Country *</label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full rounded-lg bg-surface-container border border-outline-variant/30 px-2.5 py-1.5 font-body-default text-xs text-on-surface outline-none focus:border-primary"
                >
                  {COUNTRIES_DATA.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant block mb-1">State / Province *</label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full rounded-lg bg-surface-container border border-outline-variant/30 px-2.5 py-1.5 font-body-default text-xs text-on-surface outline-none focus:border-primary"
                >
                  {availableStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant block mb-1">City / Town *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg bg-surface-container border border-outline-variant/30 px-2.5 py-1.5 font-body-default text-xs text-on-surface outline-none focus:border-primary"
                >
                  {availableCities.map((ci) => (
                    <option key={ci} value={ci}>
                      {ci}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-on-surface-variant font-medium">
              Location Summary: <strong>{formatLocation(city, state, country)}</strong>
            </div>
          </div>

          {/* Category, Type, Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="font-body-compact text-on-surface-variant text-xs">
              Category
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                <option value="ENGINEERING">Engineering</option>
                <option value="DATA_AI">Data &amp; AI</option>
                <option value="FINANCE_BANKING">Finance &amp; Banking</option>
                <option value="OPERATIONS">Operations</option>
                <option value="PRODUCT_DESIGN">Product &amp; Design</option>
                <option value="LEGAL_PUBLIC_POLICY">Legal &amp; Policy</option>
              </select>
            </label>

            <label className="font-body-compact text-on-surface-variant text-xs">
              Work Mode
              <select value={form.workMode} onChange={(e) => set("workMode", e.target.value)} className={inputClass}>
                <option value="ON_SITE">On-site</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </select>
            </label>

            <label className="font-body-compact text-on-surface-variant text-xs">
              Type
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
                <option value="FULL_TIME">Full-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="EXECUTIVE">Executive</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </label>
          </div>

          {/* Salary & Positions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="font-body-compact text-on-surface-variant text-xs">
              Salary Range *
              <input
                required
                placeholder="e.g. SLE 25,000 - 35,000 / mo"
                value={form.salary}
                onChange={(e) => set("salary", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="font-body-compact text-on-surface-variant text-xs">
              Number of Positions Open *
              <input
                type="number"
                min={1}
                required
                value={form.positionsOpen}
                onChange={(e) => set("positionsOpen", Number(e.target.value))}
                className={inputClass}
              />
            </label>
          </div>

          {/* Experience Required Toggle */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">Experience Required?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => set("experienceRequired", false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    !form.experienceRequired
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant border border-outline-variant/30"
                  }`}
                >
                  No (Freshers)
                </button>
                <button
                  type="button"
                  onClick={() => set("experienceRequired", true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    form.experienceRequired
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant border border-outline-variant/30"
                  }`}
                >
                  Yes (Required)
                </button>
              </div>
            </div>

            {form.experienceRequired && (
              <label className="block text-xs font-body-compact text-on-surface-variant pt-1.5">
                Required Experience Level
                <select
                  value={form.experienceLevel}
                  onChange={(e) => set("experienceLevel", e.target.value)}
                  className={inputClass}
                >
                  <option value="Entry-level (0-1 Years)">Entry-level (0-1 Years)</option>
                  <option value="1-3 Years">Junior / Mid (1-3 Years)</option>
                  <option value="3-5 Years">Mid-Senior (3-5 Years)</option>
                  <option value="5-8 Years">Senior Lead (5-8 Years)</option>
                  <option value="8+ Years Executive">Executive (8+ Years)</option>
                </select>
              </label>
            )}
          </div>

          {/* Hiring Urgency / Timeline */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <span className="text-xs font-bold text-on-surface block">Hiring Timeline</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set("hiringType", "TILL_DATE")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  form.hiringType === "TILL_DATE"
                    ? "bg-secondary/15 border-secondary text-secondary"
                    : "bg-surface-container border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                Hiring Till Date
              </button>
              <button
                type="button"
                onClick={() => set("hiringType", "IMMEDIATE")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  form.hiringType === "IMMEDIATE"
                    ? "bg-error-container text-on-error-container border-error"
                    : "bg-surface-container border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                ⚡ Immediate Hiring
              </button>
            </div>

            {form.hiringType === "TILL_DATE" && (
              <label className="block text-xs font-body-compact text-on-surface-variant pt-1.5">
                Closing Date / Deadline
                <input
                  type="date"
                  value={form.closingDate}
                  onChange={(e) => set("closingDate", e.target.value)}
                  className={inputClass}
                />
              </label>
            )}
          </div>

          {/* About Company */}
          <label className="font-body-compact text-on-surface-variant text-xs block">
            About the Hiring Company
            <textarea
              rows={2}
              value={form.aboutCompany}
              onChange={(e) => set("aboutCompany", e.target.value)}
              className={inputClass}
              placeholder="Overview of the company, mission, and department…"
            />
          </label>

          {/* Description */}
          <label className="font-body-compact text-on-surface-variant text-xs block">
            Job Description *
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
              placeholder="Core duties, deliverables, and role scope…"
            />
          </label>

          {/* Requirements */}
          <label className="font-body-compact text-on-surface-variant text-xs block">
            Requirements (One per line)
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              className={inputClass}
              placeholder="IPAM degree in relevant field&#10;Analytical proficiency&#10;Integrity and professionalism"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-outline-variant/15 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-primary hover:opacity-90 text-on-primary font-bold shadow-md transition-all text-xs disabled:opacity-50"
          >
            {loading ? "Creating Listing…" : "Publish Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
