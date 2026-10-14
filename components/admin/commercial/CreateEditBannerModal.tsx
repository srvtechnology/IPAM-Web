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
  const initialPages =
    banner?.pages && banner.pages.length > 0
      ? banner.pages
      : banner?.slot
      ? banner.slot.split(",").map((s) => s.trim())
      : ["/"];

  const [form, setForm] = useState({
    name: banner?.name || "",
    headline: banner?.headline || banner?.name || "",
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

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file is too large. Please select an image under 5MB.");
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

    const sponsorName = form.name.trim();
    const payload = {
      name: sponsorName,
      headline: sponsorName,
      description: form.description.trim(),
      badge: "Commercial Partner",
      ctaText: "Explore",
      targetUrl: form.targetUrl.trim() || "#",
      bannerImageUrl: form.bannerImageUrl.trim(),
      slot: form.pages.join(","),
      pages: form.pages,
      order: Number(form.order) || 1,
      active: form.active,
      monthlyFee: Number(form.monthlyFee) || 150,
      contract: form.contract || "IPAM-COMMERCIAL-2026",
      subscriptionCadence: form.subscriptionCadence,
      industry: form.industry || "Commercial",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-surface-container border border-outline-variant/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4 bg-surface-container-high/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                {isEdit ? "edit" : "view_carousel"}
              </span>
            </div>
            <div>
              <h2 className="font-headline-sm text-on-surface">
                {isEdit ? "Edit Commercial Carousel Banner" : "New Commercial Carousel Banner"}
              </h2>
              <p className="font-body-compact text-on-surface-variant text-xs">
                Upload or select panoramic banner creative, configure destination URL, and assign target page carousel placements.
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
          <div className="mx-6 mt-4 rounded-lg bg-error-container text-on-error-container px-4 py-3 font-body-compact flex items-center gap-2 text-xs">
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
                <span className="font-title-small font-bold text-on-surface text-sm">
                  Target Page Placements (Where Carousel Shows)
                </span>
              </div>
              <span className="text-xs font-semibold text-primary">
                {form.pages.includes("ALL") ? "All 6 Pages Selected" : `${form.pages.length} Page(s) Selected`}
              </span>
            </div>
            <p className="font-body-compact text-on-surface-variant text-xs">
              Select which public page(s) will feature this commercial banner in their bottom image carousel.
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

          {/* SECTION 2: BANNER CREATIVE IMAGE & PRESETS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <h3 className="font-title-small font-bold text-on-surface flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px] text-tertiary">image</span>
                Banner Creative Image
              </h3>
              <span className="text-[11px] text-on-surface-variant">Recommended: 21:9 to 32:9 wide panoramic image</span>
            </div>

            <div>
              <span className="font-body-compact text-on-surface-variant block font-medium mb-2 text-xs">
                Select from Curated High-Resolution Presets:
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
                        if (!form.name) {
                          set("name", preset.title);
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
                  Banner Image URL
                </label>
                <input
                  placeholder="https://... or /images/..."
                  value={form.bannerImageUrl}
                  onChange={(e) => set("bannerImageUrl", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
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

          {/* SECTION 3: DESTINATION LINK & DETAILS */}
          <div className="space-y-4">
            <h3 className="font-title-small font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2 text-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">touch_app</span>
              Destination Link &amp; Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
                  Sponsor / Campaign Name <span className="text-error">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. Sierra Leone Commercial Bank"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                />
                <span className="text-[10px] text-on-surface-variant/70 mt-0.5 block">
                  Used for internal campaign tracking and reporting in admin table.
                </span>
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
                  Destination URL / Target Link <span className="text-error">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. https://www.slcb.com or /businesses"
                  value={form.targetUrl}
                  onChange={(e) => set("targetUrl", e.target.value)}
                  className={inputClass}
                />
                <span className="text-[10px] text-on-surface-variant/70 mt-0.5 block">
                  Where users are redirected when clicking the banner image.
                </span>
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
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
                  <span className="font-body-medium font-bold text-on-surface text-xs">Active in Carousel</span>
                  <p className="text-[11px] text-on-surface-variant">Visible to alumni on selected pages</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: LIVE RESPONSIVE CAROUSEL BANNER PREVIEW (NO BLOG CARD!) */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Live Carousel Banner Preview
              </span>
              <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/20">
                Pure Image Carousel (Zero Text Overlays)
              </span>
            </div>

            {/* Realistic Panoramic Carousel Banner Container */}
            <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 aspect-[21/9] sm:aspect-[28/9] shadow-lg group">
              <img
                src={form.bannerImageUrl}
                alt={form.name || "Commercial Banner Preview"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Destination URL tag on hover */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-mono text-white/90 backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-[12px] text-emerald-400">link</span>
                <span className="truncate max-w-[200px]">{form.targetUrl || "No target URL"}</span>
              </div>

              {/* Carousel Next / Prev Indicators */}
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-xs border border-white/10">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </div>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-xs border border-white/10">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </div>

              {/* Carousel Indicator Dots */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-xs border border-white/10">
                <div className="h-1.5 w-5 rounded-full bg-emerald-400" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
              </div>
            </div>

            <p className="text-[11px] text-on-surface-variant text-center">
              This preview matches exactly how your graphic banner appears in the bottom carousel across selected public pages.
            </p>
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
              <span>Commercial Billing &amp; Internal Notes ({showAdvanced ? "Hide" : "Show"})</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-surface-container-low p-4 border border-outline-variant/20 animate-in fade-in duration-200">
                <div>
                  <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
                    Contract Reference
                  </label>
                  <input
                    value={form.contract}
                    onChange={(e) => set("contract", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
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
                  <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
                    Contact Person
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body-compact text-on-surface-variant block font-medium text-xs">
                    Internal Notes / Campaign Log
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal reference notes regarding this commercial contract..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
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
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 font-bold text-xs text-on-secondary shadow-md transition-all hover:bg-secondary-fixed-dim active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {loading ? "progress_activity" : "save"}
              </span>
              <span>{loading ? "Saving..." : isEdit ? "Update Carousel Banner" : "Publish Commercial Banner"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
