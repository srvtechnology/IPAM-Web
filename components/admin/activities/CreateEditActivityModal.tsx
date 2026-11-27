"use client";

import { useState, type FormEvent } from "react";
import type { AlumniActivityItem } from "@/lib/validation/activities";

const PRESET_GALLERY_IMAGES = [
  { label: "Campus Grounds", url: "/images/ipam_university_campus_1788350001937.jpg" },
  { label: "Alumni Gala", url: "/images/alumni_gala_event_1788454750646.jpg" },
  { label: "Tech Summit", url: "/images/alumni_tech_summit.jpg" },
  { label: "Networking Mixer", url: "/images/alumni_networking_mixer.jpg" },
];

export default function CreateEditActivityModal({
  activity,
  onClose,
  onSaved,
}: {
  activity?: AlumniActivityItem | null;
  onClose: () => void;
  onSaved: (item: AlumniActivityItem) => void;
}) {
  const isEditing = Boolean(activity);

  const [title, setTitle] = useState(activity?.title ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [status, setStatus] = useState<"CURRENT" | "PREVIOUS">(activity?.status ?? "CURRENT");
  const [displayDate, setDisplayDate] = useState(activity?.displayDate ?? "");
  const [location, setLocation] = useState(activity?.location ?? "");
  const [category, setCategory] = useState(activity?.category ?? "Campus Initiative");
  const [featured, setFeatured] = useState(Boolean(activity?.featured));
  const [sortOrder, setSortOrder] = useState<number>(activity?.sortOrder ?? 0);
  const [photos, setPhotos] = useState<string[]>(activity?.photos ?? []);

  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `Failed to upload ${file.name}`);
        }
        const url = json.data?.url || json.url;
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedUrls.filter((u) => !prev.includes(u))]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload selected image(s)");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleAddPhotoUrl() {
    const cleaned = photoUrlInput.trim();
    if (!cleaned) return;
    if (!photos.includes(cleaned)) {
      setPhotos((prev) => [...prev, cleaned]);
    }
    setPhotoUrlInput("");
  }

  function handleAddPreset(url: string) {
    if (!photos.includes(url)) {
      setPhotos((prev) => [...prev, url]);
    }
  }

  function handleMakeCover(idx: number) {
    if (idx <= 0 || idx >= photos.length) return;
    const copy = [...photos];
    const [picked] = copy.splice(idx, 1);
    setPhotos([picked, ...copy]);
  }

  function handleRemovePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Activity title is required.");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError("Please provide a detailed description (at least 5 characters).");
      return;
    }
    if (photos.length === 0) {
      setError("Please upload or add at least 1 photo for this activity.");
      return;
    }

    setSaving(true);
    try {
      const endpoint = isEditing ? `/api/admin/activities/${activity!.id}` : "/api/admin/activities";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          displayDate: displayDate.trim() || null,
          location: location.trim() || null,
          category: category.trim() || null,
          photos,
          featured,
          sortOrder: Number(sortOrder) || 0,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.data) {
        let msg = json?.error || `Failed to save activity (HTTP ${res.status})`;
        if (json?.issues?.fieldErrors) {
          const fieldMsgs = Object.entries(json.issues.fieldErrors)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
            .join("; ");
          if (fieldMsgs) msg = `${msg} (${fieldMsgs})`;
        }
        throw new Error(msg);
      }

      onSaved(json.data as AlumniActivityItem);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving activity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">photo_library</span>
            <div>
              <h2 className="font-headline-sm text-on-surface">
                {isEditing ? "Edit Activity Gallery" : "Add New Activity Gallery"}
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Add title, description, event timeline status, and multiple gallery photos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto space-y-5 p-6">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Title & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-on-surface">
                Activity Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IPAM Founders Day & Alumni Awards Night 2026"
                className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface">Timeline Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "CURRENT" | "PREVIOUS")}
                className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="CURRENT">Current Event / Ongoing</option>
                <option value="PREVIOUS">Previous Event / Archive</option>
              </select>
            </div>
          </div>

          {/* Date, Location, Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface">Date / Period</label>
              <input
                type="text"
                value={displayDate}
                onChange={(e) => setDisplayDate(e.target.value)}
                placeholder="e.g. November 2026"
                className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tower Hill Campus, Freetown"
                className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Gala, Mentorship, Outreach"
                className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write the full story, key highlights, outcomes, and participants of this activity..."
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {/* Multi-Photo Uploader */}
          <div className="space-y-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  Activity Photos ({photos.length} Added) <span className="text-rose-500">*</span>
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Upload multiple photos at once, add image URLs, or pick from presets. First photo is used as cover.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-on-primary shadow-xs hover:opacity-90">
                <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                <span>{uploading ? "Uploading..." : "Upload Photos"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* URL Input + Quick Presets */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPhotoUrl();
                  }
                }}
                placeholder="Paste image URL (https://... or /images/...) and press Add"
                className="flex-1 rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high"
              >
                Add URL
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-on-surface-variant">Quick presets:</span>
              {PRESET_GALLERY_IMAGES.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => handleAddPreset(preset.url)}
                  className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2.5 py-1 font-semibold text-on-surface hover:border-primary"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {/* Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                {photos.map((photo, idx) => (
                  <div
                    key={`${photo}-${idx}`}
                    className="group relative overflow-hidden rounded-xl border border-outline-variant/40 bg-slate-900 aspect-[4/3]"
                  >
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/75 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {idx > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleMakeCover(idx)}
                          className="text-[10px] font-bold text-emerald-300 hover:underline"
                        >
                          Set Cover
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Primary</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="rounded bg-rose-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-on-surface">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span>Highlight / Pin as Featured Activity</span>
            </label>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-on-surface-variant">Sort Order:</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="w-20 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs font-bold text-on-surface"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-outline-variant/30 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant/50 px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{saving ? "Saving..." : isEditing ? "Save Changes" : "Publish Activity"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
