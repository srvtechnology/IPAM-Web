"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import type { AdminBusinessRow } from "./AdminBusinessesTable";

interface AdminCreateEditBusinessModalProps {
  onClose: () => void;
  initialData?: AdminBusinessRow | null;
  mode: "create" | "edit";
  onSuccess: (business?: any) => void;
}

const CATEGORY_OPTIONS = [
  "SaaS & Software",
  "Technology & Consulting",
  "Financial Services & FinTech",
  "Healthcare & Pharmaceuticals",
  "Retail & E-Commerce",
  "Agriculture & Agribusiness",
  "Construction & Real Estate",
  "Legal & Professional Services",
  "Education & Training",
  "Hospitality & Tourism",
  "CleanTech & Energy",
  "Manufacturing",
  "Media & Entertainment",
  "Other",
];

export default function AdminCreateEditBusinessModal({
  onClose,
  initialData,
  mode,
  onSuccess,
}: AdminCreateEditBusinessModalProps) {
  const isEdit = mode === "edit" && !!initialData?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    founders: initialData?.founders ?? "",
    classYear: initialData?.classYear ?? "",
    category: initialData?.category ?? "SaaS & Software",
    industry: initialData?.industry ?? "",
    tagline: initialData?.tagline ?? "",
    description: initialData?.description ?? "",
    website: initialData?.website ?? "",
    location: initialData?.location ?? "",
    contactEmail: initialData?.contactEmail ?? "",
    contactPhone: initialData?.contactPhone ?? "",
    featured: initialData?.featured ?? false,
    status: initialData?.status ?? "APPROVED",
    rejectionReason: initialData?.rejectionReason ?? "",
    servicesInput: Array.isArray(initialData?.services)
      ? initialData.services.join(", ")
      : typeof initialData?.services === "string"
      ? initialData.services
      : "",
  });

  const [bannerPreview, setBannerPreview] = useState<string | null>(
    initialData?.bannerImage ?? initialData?.image ?? null
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo ?? null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [directBannerUrl, setDirectBannerUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleBannerFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image file size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo image file size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function applyDirectUrl() {
    if (directBannerUrl.trim()) {
      setBannerPreview(directBannerUrl.trim());
      setDirectBannerUrl("");
      setShowUrlInput(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const services = form.servicesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      founders: form.founders.trim(),
      classYear: form.classYear.trim(),
      category: form.category.trim(),
      industry: form.industry.trim(),
      tagline: form.tagline.trim() || undefined,
      description: form.description.trim(),
      website: form.website.trim(),
      location: form.location.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim() || undefined,
      bannerImage: bannerPreview ?? undefined,
      image: bannerPreview ?? undefined,
      logo: logoPreview ?? undefined,
      services: services.length > 0 ? services : undefined,
      featured: form.featured,
    };

    if (isEdit) {
      payload.status = form.status;
      payload.rejectionReason = form.status === "REJECTED" ? form.rejectionReason.trim() : null;
    }

    try {
      const url = isEdit ? `/api/admin/businesses/${initialData!.id}` : "/api/admin/businesses";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? (isEdit ? "Failed to update business listing" : "Failed to create business"));
        return;
      }

      onSuccess(json.data);
      onClose();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={loading ? undefined : onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative my-6 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant/30 bg-surface-container p-6 text-on-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div>
            <span className="font-table-header uppercase tracking-wider text-primary">
              {isEdit ? "Enterprise Management" : "New Institutional Listing"}
            </span>
            <h2 className="text-xl font-bold font-headline-md text-on-surface">
              {isEdit ? `Edit: ${initialData?.name}` : "Add Alumni Business Listing"}
            </h2>
            <p className="font-body-compact text-on-surface-variant mt-0.5">
              {isEdit
                ? "Update enterprise profile, banner graphics, and directory status."
                : "Admin-created businesses are published immediately without requiring approval."}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-error/30 bg-error/15 p-3 text-xs text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Banner Section */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Banner Image <span className="text-primary font-normal">(Hero Header)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">link</span>
              <span>{showUrlInput ? "Hide URL input" : "Paste image URL"}</span>
            </button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={directBannerUrl}
                onChange={(e) => setDirectBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-1.5 text-xs text-on-surface"
              />
              <button
                type="button"
                onClick={applyDirectUrl}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary hover:opacity-90"
              >
                Apply
              </button>
            </div>
          )}

          {bannerPreview ? (
            <div className="group relative h-40 w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-high">
              <img src={bannerPreview} alt="Banner Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-on-surface shadow-md hover:bg-surface-container-highest flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerPreview(null)}
                  className="rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-on-error shadow-md hover:opacity-90 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/40 bg-surface-container-high/50 p-4 hover:border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[28px] text-primary">image</span>
              <p className="text-xs font-bold text-on-surface mt-1">Upload enterprise banner image</p>
              <p className="text-[11px] text-on-surface-variant">PNG, JPG, WEBP up to 5MB</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleBannerFile}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Logo and Core Details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Logo / Icon
            </label>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface">
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                  <button
                    type="button"
                    onClick={() => setLogoPreview(null)}
                    className="absolute -top-1 -right-1 rounded-full bg-error p-1 text-on-error"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-high hover:border-primary"
                >
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">storefront</span>
                  <span className="text-[9px] font-semibold text-on-surface-variant mt-0.5">Logo</span>
                </div>
              )}
              <div className="text-[11px] text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="font-bold text-primary hover:underline"
                >
                  Upload logo
                </button>
              </div>
            </div>
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoFile}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="sm:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-bold text-on-surface">Business Name *</label>
              <input
                required
                disabled={loading}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Salone Energy Solutions"
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface">Founder(s) *</label>
              <input
                required
                disabled={loading}
                value={form.founders}
                onChange={(e) => update("founders", e.target.value)}
                placeholder="e.g. David Koroma"
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Category, Industry, Year */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-on-surface">Graduation Year *</label>
            <input
              required
              disabled={loading}
              value={form.classYear}
              onChange={(e) => update("classYear", e.target.value)}
              placeholder="e.g. 2018"
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface">Category *</label>
            <select
              value={form.category}
              disabled={loading}
              onChange={(e) => update("category", e.target.value)}
              className="mt-1 w-full cursor-pointer rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface">Industry Sector *</label>
            <input
              required
              disabled={loading}
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="e.g. Clean Energy"
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>
        </div>

        {/* Tagline & Description */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-on-surface">Tagline</label>
            <input
              disabled={loading}
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="Short headline"
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface">Description *</label>
            <textarea
              required
              disabled={loading}
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Company profile and mission..."
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high p-3 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface">
              Services Offered (comma-separated)
            </label>
            <input
              disabled={loading}
              value={form.servicesInput}
              onChange={(e) => update("servicesInput", e.target.value)}
              placeholder="Consulting, Audits, Systems Implementation"
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>
        </div>

        {/* Location & Contact */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-on-surface">Location *</label>
            <input
              required
              disabled={loading}
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Freetown, Sierra Leone"
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface">Website *</label>
            <input
              required
              disabled={loading}
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://example.com"
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface">Contact Email *</label>
            <input
              required
              type="email"
              disabled={loading}
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
              placeholder="contact@example.com"
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface">Contact Phone</label>
            <input
              type="tel"
              disabled={loading}
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              placeholder="+232..."
              className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-primary sm:text-sm"
            />
          </div>
        </div>

        {/* Admin Controls: Status, Rejection Reason, Featured */}
        <div className="mt-5 rounded-xl border border-outline-variant/20 bg-surface-container-high/50 p-4 space-y-3">
          <span className="font-table-header uppercase text-primary tracking-wider block">
            Administrative Governance
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {isEdit && (
              <div>
                <label className="block text-xs font-bold text-on-surface">Directory Status</label>
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-xs text-on-surface"
                >
                  <option value="APPROVED">APPROVED (Live in Directory)</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under Review)</option>
                  <option value="REJECTED">REJECTED (Changes Requested)</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 sm:pt-4">
              <input
                type="checkbox"
                id="featuredCheck"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="featuredCheck" className="text-xs font-bold text-on-surface cursor-pointer">
                Feature on Public Directory Top Showcase
              </label>
            </div>
          </div>

          {isEdit && form.status === "REJECTED" && (
            <div>
              <label className="block text-xs font-bold text-error">Rejection Feedback / Notes</label>
              <input
                value={form.rejectionReason}
                onChange={(e) => update("rejectionReason", e.target.value)}
                placeholder="Specify what details need correction by alumni..."
                className="mt-1 w-full rounded-lg border border-error/40 bg-surface px-3 py-2 text-xs text-on-surface"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-outline-variant/20 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-outline-variant/30 px-4 py-2 font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 font-body-medium text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            <span>{isEdit ? "Save Changes" : "Publish Business"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
