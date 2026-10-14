"use client";

import { useState, useRef, useEffect } from "react";
import type { HeroSlide } from "@/lib/hero-slides";
import { useHeroCarousel } from "@/hooks/admin/useHeroCarousel";

const PRESET_GALLERY = [
  {
    name: "IPAM University Campus",
    url: "/images/ipam_university_campus_1788350001937.jpg",
    caption: "IPAM Tower Hill Campus • Freetown, Sierra Leone",
    title: "Connect. Empower. Excel.",
    subtitle: "The Official Association for IPAM Graduates Worldwide",
  },
  {
    name: "Alumni Gala & Honors",
    url: "/images/alumni_gala_event_1788454750646.jpg",
    caption: "Annual IPAM Global Alumni Gala & Honors Banquet",
    title: "Celebrate Legacy. Inspire Tomorrow.",
    subtitle: "Honoring 35+ Years of Leadership Across Public & Private Sectors",
  },
  {
    name: "Tech Summit & Innovation",
    url: "/images/alumni_tech_summit.jpg",
    caption: "IPAM Innovation & Digital Leadership Summit",
    title: "Driving Africa's Digital Frontier.",
    subtitle: "Alumni Spearheading FinTech, Public Policy & Strategic Governance",
  },
  {
    name: "Executive Networking Mixer",
    url: "/images/alumni_networking_mixer.jpg",
    caption: "Executive Networking & Mentorship Mixer",
    title: "Stronger Together Across 45+ Nations.",
    subtitle: "Connecting Emerging Scholars With Global Corporate Mentors",
  },
];

export default function CreateEditHeroSlideModal({
  isOpen,
  onClose,
  onSaved,
  slide,
  existingCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (slide: HeroSlide) => void;
  slide: HeroSlide | null;
  existingCount: number;
}) {
  const { createSlide, updateSlide, loading, error } = useHeroCarousel();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    imageUrl: "",
    title: "Connect. Empower. Excel.",
    subtitle: "The Official Association for IPAM Graduates Worldwide",
    badge: "University of Sierra Leone • IPAM Global Network",
    caption: "IPAM Tower Hill Campus • Freetown, Sierra Leone",
    order: existingCount + 1,
    active: true,
    ctaText: "Join Alumni Network",
    ctaLink: "/register",
  });

  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (slide) {
      setForm({
        imageUrl: slide.imageUrl || "",
        title: slide.title || "Connect. Empower. Excel.",
        subtitle: slide.subtitle || "",
        badge: slide.badge || "University of Sierra Leone • IPAM Global Network",
        caption: slide.caption || "",
        order: slide.order ?? 1,
        active: slide.active !== false,
        ctaText: slide.ctaText || "Join Alumni Network",
        ctaLink: slide.ctaLink || "/register",
      });
    } else {
      setForm({
        imageUrl: PRESET_GALLERY[0].url,
        title: "Connect. Empower. Excel.",
        subtitle: "The Official Association for IPAM Graduates Worldwide",
        badge: "University of Sierra Leone • IPAM Global Network",
        caption: "IPAM Tower Hill Campus • Freetown, Sierra Leone",
        order: existingCount + 1,
        active: true,
        ctaText: "Join Alumni Network",
        ctaLink: "/register",
      });
    }
    setUploadError(null);
  }, [slide, existingCount, isOpen]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1920;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", 0.85);
          setForm((prev) => ({ ...prev, imageUrl: base64 }));
          setUploadError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleSelectPreset(preset: typeof PRESET_GALLERY[0]) {
    setForm((prev) => ({
      ...prev,
      imageUrl: preset.url,
      caption: preset.caption,
      title: prev.title === "Connect. Empower. Excel." && preset.title ? preset.title : prev.title,
      subtitle: prev.subtitle === "The Official Association for IPAM Graduates Worldwide" && preset.subtitle ? preset.subtitle : prev.subtitle,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) {
      setUploadError("Please provide an image URL or choose a preset.");
      return;
    }

    let res;
    if (slide) {
      res = await updateSlide(slide.id, form);
    } else {
      res = await createSlide(form);
    }

    if (res) {
      if (onSaved) onSaved(res);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-scrim/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-surface-container border border-outline-variant/30 text-on-surface shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/40">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">
              {slide ? "edit" : "add_photo_alternate"}
            </span>
            <h3 className="font-headline-sm text-on-surface">
              {slide ? "Edit Hero Carousel Slide" : "Add New Hero Carousel Slide"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs font-medium">
              {error}
            </div>
          )}
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs font-medium">
              {uploadError}
            </div>
          )}

          {/* Image Selection & Live Preview */}
          <div className="space-y-3">
            <label className="font-table-header uppercase text-on-surface-variant text-[11px] block">
              1. Slide Image &amp; Visual Preview
            </label>

            {/* Live Preview Container */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
              {form.imageUrl ? (
                <>
                  <img
                    src={form.imageUrl}
                    alt={form.title}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Overlay text mock */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                    {form.badge && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 w-max mb-1.5">
                        {form.badge}
                      </span>
                    )}
                    <h4 className="text-lg font-black leading-tight text-white line-clamp-1">{form.title}</h4>
                    {form.subtitle && (
                      <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{form.subtitle}</p>
                    )}
                    {form.caption && (
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-emerald-400">location_on</span>
                        <span>{form.caption}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-on-surface-variant gap-2">
                  <span className="material-symbols-outlined text-[36px]">image</span>
                  <span className="text-xs">No image selected</span>
                </div>
              )}
            </div>

            {/* Presets Gallery */}
            <div>
              <p className="text-[11px] font-medium text-on-surface-variant mb-2">
                Choose from IPAM Institutional Presets:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_GALLERY.map((p) => {
                  const isSelected = form.imageUrl === p.url;
                  return (
                    <button
                      type="button"
                      key={p.url}
                      onClick={() => handleSelectPreset(p)}
                      className={`relative rounded-lg overflow-hidden border p-1 text-left transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 bg-primary-container/20"
                          : "border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-high/40"
                      }`}
                    >
                      <div className="aspect-video w-full rounded overflow-hidden mb-1">
                        <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <p className="text-[11px] font-semibold text-on-surface truncate">{p.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom URL or Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="Or enter custom image URL (https://... or /images/...)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-outline-variant/40 bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          </div>

          {/* Text and Headlines */}
          <div className="space-y-4 pt-2 border-t border-outline-variant/10">
            <label className="font-table-header uppercase text-on-surface-variant text-[11px] block">
              2. Headlines &amp; Messaging
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Headline Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Connect. Empower. Excel."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  required
                />
                <p className="text-[10px] text-on-surface-variant">The main impactful title displayed on the hero.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Network Badge / Tag</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="e.g. University of Sierra Leone • IPAM Global Network"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                />
                <p className="text-[10px] text-on-surface-variant">Top pill badge displayed above the title.</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">Subtitle / Description</label>
              <textarea
                rows={2}
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g. The Official Association for IPAM Graduates Worldwide"
                className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Location / Caption Tag</label>
                <input
                  type="text"
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  placeholder="e.g. IPAM Tower Hill Campus • Freetown, Sierra Leone"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                />
                <p className="text-[10px] text-on-surface-variant">Appears on the floating location badge.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Display Sequence Order</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                />
                <p className="text-[10px] text-on-surface-variant">Order in carousel (1, 2, 3...).</p>
              </div>
            </div>

            {/* Call To Action Buttons (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Primary CTA Button Text</label>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  placeholder="e.g. Join Alumni Network"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Primary CTA Link URL</label>
                <input
                  type="text"
                  value={form.ctaLink}
                  onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                  placeholder="e.g. /register or /directory"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="activeSlideCheckbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-outline-variant/40 bg-surface-container text-primary focus:ring-primary"
              />
              <label htmlFor="activeSlideCheckbox" className="text-xs font-semibold text-on-surface cursor-pointer">
                Slide is Active &amp; Visible in Home Page Carousel
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.imageUrl}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {slide ? "check" : "add"}
              </span>
              <span>{loading ? "Saving..." : slide ? "Save Changes" : "Create Slide"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
