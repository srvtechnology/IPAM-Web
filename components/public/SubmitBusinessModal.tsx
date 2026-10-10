"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  Image as ImageIcon,
  Building2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  FileCheck,
} from "lucide-react";

export interface BusinessFormData {
  id?: string;
  name?: string;
  founders?: string;
  classYear?: string;
  category?: string;
  industry?: string;
  tagline?: string | null;
  description?: string;
  website?: string | null;
  location?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  bannerImage?: string | null;
  image?: string | null;
  logo?: string | null;
  services?: string[] | string | null;
  status?: string;
  rejectionReason?: string | null;
}

interface SubmitBusinessModalProps {
  onClose: () => void;
  initialData?: BusinessFormData | null;
  mode?: "create" | "edit";
  onSuccess?: (business: any) => void;
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

export default function SubmitBusinessModal({
  onClose,
  initialData,
  mode = "create",
  onSuccess,
}: SubmitBusinessModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isEdit = mode === "edit" && !!initialData?.id;

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
    servicesInput: Array.isArray(initialData?.services)
      ? initialData.services.join(", ")
      : typeof initialData?.services === "string"
      ? initialData.services
      : "",
  });

  const [bannerPreview, setBannerPreview] = useState<string | null>(
    initialData?.bannerImage ?? initialData?.image ?? null
  );
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);
  const [bannerFileSize, setBannerFileSize] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo ?? null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [directBannerUrl, setDirectBannerUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleBannerFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WEBP, or SVG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(`Banner image file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB limit.`);
      return;
    }

    setBannerUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreview(reader.result as string);
      setBannerFileName(file.name);
      setBannerFileSize((file.size / 1024).toFixed(0) + " KB");
      setBannerUploading(false);
    };
    reader.onerror = () => {
      setError("Failed to process banner image file. Please try another image.");
      setBannerUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file for the logo.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo image file size must be less than 2MB.");
      return;
    }

    setLogoUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      setLogoUploading(false);
    };
    reader.onerror = () => {
      setError("Failed to process logo file.");
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function applyDirectUrl() {
    if (directBannerUrl.trim()) {
      setBannerPreview(directBannerUrl.trim());
      setBannerFileName("Remote URL Image");
      setBannerFileSize(null);
      setDirectBannerUrl("");
      setShowUrlInput(false);
      setError(null);
    }
  }

  function removeBanner() {
    setBannerPreview(null);
    setBannerFileName(null);
    setBannerFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const services = form.servicesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
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
    };

    try {
      const url = isEdit ? `/api/businesses/${initialData!.id}` : "/api/businesses";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? (isEdit ? "Failed to update business" : "Failed to submit business listing"));
        return;
      }

      setSuccessMsg(
        isEdit
          ? "Business listing updated successfully!"
          : "Business submitted successfully! It is now pending administrative review."
      );

      // Invoke onSuccess immediately to update parent state in real time!
      if (onSuccess) {
        onSuccess(json.data);
      }

      setTimeout(() => {
        router.refresh();
        onClose();
      }, 700);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={loading ? undefined : onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative my-6 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl sm:p-7 md:p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>{isEdit ? "Edit Enterprise" : "Alumni Directory Listing"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? `Edit: ${initialData?.name}` : "List Your Alumni Business"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isEdit
                ? "Update your venture profile, banner photo, and commercial details."
                : "Showcase your venture to the global IPAM alumni network."}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notices */}
        {!isEdit && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Administrative Approval Process:</span> All alumni-submitted listings
              are reviewed by the IPAM Administration before being published to the live public directory.
            </div>
          </div>
        )}

        {isEdit && initialData?.status === "REJECTED" && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Previous Review Note:</span> Saving new changes will automatically
              resubmit your business listing for admin review.
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Banner Image Section with Uploading States */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Business Banner Image <span className="text-emerald-600 font-normal">(Hero Header)</span>
            </label>
            <button
              type="button"
              disabled={loading || bannerUploading}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              <span>{showUrlInput ? "Hide URL input" : "Paste image URL"}</span>
            </button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                disabled={loading}
                value={directBannerUrl}
                onChange={(e) => setDirectBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600"
              />
              <button
                type="button"
                disabled={loading}
                onClick={applyDirectUrl}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          )}

          {bannerUploading ? (
            <div className="flex h-40 sm:h-48 w-full flex-col items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-emerald-900">Processing &amp; Optimizing Banner Image...</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Generating high-definition directory preview</p>
            </div>
          ) : bannerPreview ? (
            <div className="space-y-1.5">
              <div className="group relative h-40 sm:h-48 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
                <img src={bannerPreview} alt="Business banner preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-white shadow-md flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Replace Banner</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={removeBanner}
                    className="rounded-xl bg-rose-600/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-md flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
              {bannerFileName && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
                  <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-700 truncate max-w-xs">{bannerFileName}</span>
                  {bannerFileSize && <span>({bannerFileSize})</span>}
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => (!loading ? fileInputRef.current?.click() : undefined)}
              className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 transition-colors hover:border-emerald-500 hover:bg-emerald-50/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">Click to upload business banner image</p>
              <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WEBP up to 5MB (16:9 ratio recommended)</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            disabled={loading || bannerUploading}
            onChange={handleBannerFile}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />
        </div>

        {/* Logo and Main Details */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {/* Logo Upload */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Logo / Icon
            </label>
            <div className="flex items-center gap-3">
              {logoUploading ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                </div>
              ) : logoPreview ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1" />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setLogoPreview(null)}
                    className="absolute -top-1 -right-1 rounded-full bg-rose-600 p-1 text-white shadow-xs hover:bg-rose-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => (!loading ? logoInputRef.current?.click() : undefined)}
                  className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/30"
                >
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <span className="text-[9px] font-semibold text-slate-500 mt-0.5">Add Logo</span>
                </div>
              )}
              <div className="text-[11px] text-slate-500">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => logoInputRef.current?.click()}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Upload logo
                </button>
                <div>Square format (PNG/JPG)</div>
              </div>
            </div>
            <input
              type="file"
              ref={logoInputRef}
              disabled={loading || logoUploading}
              onChange={handleLogoFile}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
          </div>

          <div className="sm:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Business Name *</label>
              <input
                required
                disabled={loading}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. SaloneTech Solutions Ltd."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Founder(s) *</label>
              <input
                required
                disabled={loading}
                value={form.founders}
                onChange={(e) => update("founders", e.target.value)}
                placeholder="e.g. David Koroma, Aminata Sesay"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Category, Industry, Class Year */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">Graduation Year *</label>
            <input
              required
              disabled={loading}
              value={form.classYear}
              onChange={(e) => update("classYear", e.target.value)}
              placeholder="e.g. 2018"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Category *</label>
            <select
              value={form.category}
              disabled={loading}
              onChange={(e) => update("category", e.target.value)}
              className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Industry Sector *</label>
            <input
              required
              disabled={loading}
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="e.g. Information Technology"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>
        </div>

        {/* Tagline & Description */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">Tagline / Catchphrase</label>
            <input
              disabled={loading}
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="e.g. Driving digital transformation across West Africa."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Detailed Description *</label>
            <textarea
              required
              disabled={loading}
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe your company, core mission, products, and what makes your business unique..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Services / Offerings <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              disabled={loading}
              value={form.servicesInput}
              onChange={(e) => update("servicesInput", e.target.value)}
              placeholder="e.g. Custom Web Development, Cloud Architecture, IT Consulting"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>
        </div>

        {/* Location & Contact Info */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">Location / City *</label>
            <input
              required
              disabled={loading}
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Freetown, Sierra Leone"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Website or Social URL *</label>
            <input
              required
              type="text"
              disabled={loading}
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://salonetech.com"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Contact Email *</label>
            <input
              required
              type="email"
              disabled={loading}
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
              placeholder="contact@salonetech.com"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Contact Phone</label>
            <input
              type="tel"
              disabled={loading}
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              placeholder="+232 76 000 000"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 sm:text-sm"
            />
          </div>
        </div>

        {/* Submit Actions with Robust State Management */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={loading || bannerUploading}
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || bannerUploading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 disabled:opacity-60 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEdit ? "Saving Changes..." : "Uploading Banner & Submitting..."}</span>
              </>
            ) : bannerUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Banner...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>{isEdit ? "Save Changes" : "Submit Listing"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
