"use client";

import { useState, useRef, type FormEvent } from "react";
import { useBanners } from "@/hooks/admin/useBanners";
import {
  type CommercialBanner,
  COMMERCIAL_PAGE_OPTIONS,
  BANNER_IMAGE_PRESETS,
} from "@/lib/commercial-banners";

interface CreateEditBannerModalProps {
  banner?: CommercialBanner | null;
  onClose: () => void;
  onSaved?: (savedBanner: CommercialBanner) => void;
}

const inputClass =
  "mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary text-sm";

export default function CreateEditBannerModal({
  banner,
  onClose,
  onSaved,
}: CreateEditBannerModalProps) {
  const isEdit = Boolean(banner?.id);
  const { createBanner, updateBanner, loading, error } = useBanners();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial selected pages
  const initialPages = banner?.pages && banner.pages.length > 0
    ? banner.pages
    : (banner?.slot ? banner.slot.split(",").map((s) => s.trim()) : ["/"]);

  const [form, setForm] = useState({
    name: banner?.name || "",
    headline: banner?.headline || "",
    description: banner?.description || "",
    badge: banner?.badge || "Commercial Partner",
    ctaText: banner?.ctaText || "Learn More",
    targetUrl: banner?.targetUrl || "",
    bannerImageUrl: banner?.bannerImageUrl || "/images/sponsor_banking_banner.jpg",
    pages: initialPages,
    order: banner?.order ?? 1,
    active: banner?.active ?? true,
    monthlyFee: banner?.monthlyFee || "150",
    contract: banner?.contract || "IPAM-COMMERCIAL-2026",
    subscriptionCadence: "MONTHLY",
    industry: banner?.industry || "Commercial",
    contactName: banner?.contactName || "",
    contactEmail: banner?.contactEmail || "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function togglePage(pageValue: string) {
    setForm((f) => {
      if (pageValue === "ALL") {
        if (f.pages.includes("ALL")) {
          return { ...f, pages: ["/"] };
        } else {
          return { ...f, pages: ["ALL"] };
        }
      }

      // If user clicks a specific page while "ALL" is selected, uncheck "ALL"
      let newPages = f.pages.filter((p) => p !== "ALL");
      if (newPages.includes(pageValue)) {
        newPages = newPages.filter((p) => p !== pageValue);
        if (newPages.length === 0) newPages = ["/"];
      } else {
        newPages.push(pageValue);
      }
      return { ...f, pages: newPages };
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Image file is too large. Please select an image under 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        set("bannerImageUrl", base64);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      headline: form.headline.trim() || form.name.trim(),
      description: form.description.trim(),
      badge: form.badge.trim() || "Commercial Partner",
      ctaText: form.ctaText.trim() || "Learn More",
      targetUrl: form.targetUrl.trim() || "#",
      bannerImageUrl: form.bannerImageUrl.trim(),
      slot: form.pages.join(","),
      pages: form.pages,
      order: Number(form.order) || 1,
      active: form.active,
      monthlyFee: Number(form.monthlyFee) || 150,
      contract: form.contract || "IPAM-COMMERCIAL-2026",
      subscriptionCadence: form.subscriptionCadence,
      industry: form.industry || form.badge,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
    };

    let result;
    if (isEdit && banner?.id) {
      result = await updateBanner(banner.id, payload);
    } else {
      result = await createBanner(payload);
    }

    if (result) {
      if (onSaved) onSaved(result);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-surface-container border border-outline-variant/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4 bg-surface-container-high/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                {isEdit ? "edit" : "campaign"}
              </span>
            </div>
            <div>
              <h2 className="font-headline-sm text-on-surface">
                {isEdit ? "Edit Commercial Ad Banner" : "New Ads & Commercial Banner"}
              </h2>
              <p className="font-body-compact text-on-surface-variant">
                Configure banner creative, messaging, and select target page placements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-error-container text-on-error-container px-4 py-3 font-body-compact flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION 1: TARGET PAGE PLACEMENT */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">link</span>
                <span className="font-title-small font-bold text-on-surface">
                  Target Page Placements (Where Ads Show)
                </span>
              </div>
              <span className="text-xs font-semibold text-primary">
                {form.pages.includes("ALL") ? "All 6 Pages Selected" : `${form.pages.length} Page(s) Selected`}
              </span>
            </div>
            <p className="font-body-compact text-on-surface-variant">
              Select which public page(s) will render this banner at the bottom.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {COMMERCIAL_PAGE_OPTIONS.map((opt) => {
                const isSelected = form.pages.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePage(opt.value)}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-primary bg-primary-container text-on-primary-container shadow-xs font-bold"
                        : "border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? "border-primary bg-primary text-white" : "border-outline-variant"
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-[12px]">check</span>}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: SPONSOR & MESSAGING */}
          <div className="space-y-4">
            <h3 className="font-title-small font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">branding_watermark</span>
              Sponsor Details &amp; Messaging
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Sponsor / Brand Name <span className="text-error">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. Sierra Leone Commercial Bank"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Category Badge
                </label>
                <input
                  placeholder="e.g. Premier Banking Partner, Official Telecom"
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Ad Headline / Campaign Title <span className="text-error">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. SME Commercial Financing: Fueling Alumni Ventures"
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Description / Offer Copy
                </label>
                <textarea
                  rows={3}
                  placeholder="Highlight key value propositions, special rates, or services for alumni..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CREATIVE IMAGE & PRESETS */}
          <div className="space-y-4">
            <h3 className="font-title-small font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2">
              <span className="material-symbols-outlined text-[18px] text-tertiary">image</span>
              Banner Creative &amp; Presets
            </h3>

            <div>
              <span className="font-body-compact text-on-surface-variant block font-medium mb-2">
                Curated High-Res Presets (Click to Select)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BANNER_IMAGE_PRESETS.map((preset) => {
                  const isSelected = form.bannerImageUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        set("bannerImageUrl", preset.url);
                        if (!form.badge || form.badge === "Commercial Partner") {
                          set("badge", preset.category);
                        }
                      }}
                      className={`relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-surface shadow-md"
                          : "border-outline-variant/30 hover:border-outline hover:opacity-90"
                      }`}
                    >
                      <div className="relative h-20 w-full bg-slate-900">
                        <img src={preset.url} alt={preset.title} className="h-full w-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-surface-container-high/60">
                        <p className="text-[11px] font-bold text-on-surface truncate">{preset.title}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">{preset.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Custom Banner Image URL
                </label>
                <input
                  placeholder="https://... or /images/..."
                  value={form.bannerImageUrl}
                  onChange={(e) => set("bannerImageUrl", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Upload Custom Image
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  <span>Choose Image File (JPG/PNG/WebP)</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: CALL TO ACTION & DESTINATION */}
          <div className="space-y-4">
            <h3 className="font-title-small font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2">
              <span className="material-symbols-outlined text-[18px] text-primary">touch_app</span>
              Call to Action &amp; Destination Link
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  CTA Button Text
                </label>
                <input
                  placeholder="e.g. Explore Commercial Credit, Apply Now"
                  value={form.ctaText}
                  onChange={(e) => set("ctaText", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Destination URL / Target Link <span className="text-error">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. https://www.slcb.com or /businesses"
                  value={form.targetUrl}
                  onChange={(e) => set("targetUrl", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium">
                  Display Order / Priority
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={form.order}
                  onChange={(e) => set("order", parseInt(e.target.value, 10) || 1)}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => set("active", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-outline-variant/50 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-secondary peer-checked:after:translate-x-full" />
                </label>
                <div>
                  <span className="font-body-medium font-bold text-on-surface">Active Banner</span>
                  <p className="text-[11px] text-on-surface-variant">Visible to alumni on selected pages</p>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW WIDGET */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high/30 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Live Responsive Preview
            </span>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center">
                <div className="relative h-36 sm:col-span-5 bg-slate-900 overflow-hidden">
                  <img
                    src={form.bannerImageUrl}
                    alt={form.headline}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 left-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    {form.badge || "Sponsored"}
                  </div>
                </div>
                <div className="p-4 sm:col-span-7 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Partner &middot; {form.name || "Sponsor Name"}
                    </span>
                    <h4 className="mt-1 text-sm font-black text-slate-900 line-clamp-1">
                      {form.headline || "Campaign Headline"}
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {form.description || "Banner description and value proposition will appear here."}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                      <span>{form.ctaText || "Learn More"}</span>
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Placements: {form.pages.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ADVANCED COMMERCIAL BILLING (COLLAPSIBLE) */}
          <div className="border-t border-outline-variant/20 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showAdvanced ? "expand_less" : "expand_more"}
              </span>
              <span>Commercial Billing &amp; Invoice Metadata ({showAdvanced ? "Hide" : "Show"})</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-surface-container-low p-4 border border-outline-variant/20 animate-in fade-in duration-200">
                <div>
                  <label className="font-body-compact text-on-surface-variant block font-medium">
                    Contract Reference
                  </label>
                  <input
                    value={form.contract}
                    onChange={(e) => set("contract", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-body-compact text-on-surface-variant block font-medium">
                    Monthly Fee (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monthlyFee}
                    onChange={(e) => set("monthlyFee", e.target.value)}
                    className={`${inputClass} font-mono font-bold text-secondary`}
                  />
                </div>
                <div>
                  <label className="font-body-compact text-on-surface-variant block font-medium">
                    Contact Person
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-body-compact text-on-surface-variant block font-medium">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 font-bold text-on-secondary shadow-md transition-all hover:bg-secondary-fixed-dim active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {loading ? "progress_activity" : "save"}
              </span>
              <span>{loading ? "Saving..." : isEdit ? "Update Banner" : "Publish Commercial Banner"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
