"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/lib/hero-slides";
import { useHeroCarousel } from "@/hooks/admin/useHeroCarousel";
import CreateEditHeroSlideModal from "./CreateEditHeroSlideModal";

export default function HeroCarouselManagementView({
  initialSlides,
}: {
  initialSlides: HeroSlide[];
}) {
  const { deleteSlide, toggleSlideActive, reorderSlides, resetToDefaults, loading } = useHeroCarousel();

  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HeroSlide | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Keep local state in sync when initialSlides changes
  useEffect(() => {
    setSlides(initialSlides);
  }, [initialSlides]);

  // Preview Carousel State
  const activeSlides = slides.filter((s) => s.active);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewAutoPlay, setPreviewAutoPlay] = useState(true);

  useEffect(() => {
    if (!previewAutoPlay || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [previewAutoPlay, activeSlides.length]);

  const currentPreviewSlide = activeSlides[previewIndex] || slides[0] || null;

  const filteredSlides = slides.filter((slide) => {
    if (filterActive === "ACTIVE" && !slide.active) return false;
    if (filterActive === "INACTIVE" && slide.active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = slide.title.toLowerCase().includes(q);
      const matchSub = slide.subtitle?.toLowerCase().includes(q);
      const matchCap = slide.caption?.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchCap) return false;
    }
    return true;
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  }

  async function handleToggleSlide(slide: HeroSlide) {
    const originalActive = slide.active;
    // Optimistic toggle
    setSlides((prev) =>
      prev.map((s) => (s.id === slide.id ? { ...s, active: !originalActive } : s))
    );
    showToast(`Slide "${slide.title.slice(0, 25)}..." ${!originalActive ? "activated" : "deactivated"}.`);

    const res = await toggleSlideActive(slide.id, originalActive);
    if (!res) {
      // Rollback
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, active: originalActive } : s))
      );
      showToast("Failed to update slide status. Reverted.", "error");
    }
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return;
    const originalSlides = [...slides];
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index - 1];
    newSlides[index - 1] = temp;

    // Recalculate orders
    const updated = newSlides.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSlides(updated);

    const res = await reorderSlides(updated.map((s) => s.id));
    if (!res) {
      setSlides(originalSlides);
      showToast("Failed to save slide order. Reverted.", "error");
    } else {
      showToast("Slide order updated successfully.");
    }
  }

  async function handleMoveDown(index: number) {
    if (index >= slides.length - 1) return;
    const originalSlides = [...slides];
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index + 1];
    newSlides[index + 1] = temp;

    // Recalculate orders
    const updated = newSlides.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSlides(updated);

    const res = await reorderSlides(updated.map((s) => s.id));
    if (!res) {
      setSlides(originalSlides);
      showToast("Failed to save slide order. Reverted.", "error");
    } else {
      showToast("Slide order updated successfully.");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm) return;
    const target = deleteConfirm;
    setDeleteConfirm(null);
    setSlides((prev) => prev.filter((s) => s.id !== target.id));
    showToast(`Slide "${target.title.slice(0, 25)}..." deleted.`);

    const res = await deleteSlide(target.id);
    if (!res) {
      setSlides((prev) => [...prev, target]);
      showToast("Failed to delete slide. Reverted.", "error");
    }
  }

  async function handleConfirmReset() {
    const res = await resetToDefaults();
    if (res) {
      setSlides(res);
      setResetConfirmOpen(false);
      showToast("Reset to 4 default institutional slides.");
    } else {
      showToast("Failed to reset slides.", "error");
    }
  }

  function handleSlideSaved(savedSlide: HeroSlide) {
    setSlides((prev) => {
      const exists = prev.some((s) => s.id === savedSlide.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSlide.id ? savedSlide : s));
      } else {
        return [...prev, savedSlide];
      }
    });
    showToast(`Slide "${savedSlide.title.slice(0, 25)}..." saved.`);
  }

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[24px]">view_carousel</span>
            <h1 className="font-headline-lg text-on-surface">Home Hero Banner Carousel</h1>
          </div>
          <p className="font-body-compact text-on-surface-variant mt-1 text-xs">
            Manage multi-image carousel slides, captions, headlines, and ordering displayed on the public home page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors"
            title="Reset to default institutional presets"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingSlide(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 shadow-sm transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            <span>+ Add Hero Slide</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Preview Box */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/30">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-headline-sm text-on-surface text-xs uppercase tracking-wider">
              Live Home Page Hero Preview ({activeSlides.length} Active Slides)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewAutoPlay((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant hover:text-on-surface"
              title="Toggle Auto-Play"
            >
              <span className="material-symbols-outlined text-[16px]">
                {previewAutoPlay ? "pause_circle" : "play_circle"}
              </span>
              <span>{previewAutoPlay ? "Auto-playing" : "Paused"}</span>
            </button>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline ml-2"
            >
              <span>View Live Home</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </Link>
          </div>
        </div>

        {/* Live Mock Frame */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] min-h-[220px] w-full overflow-hidden bg-slate-950 text-white">
          {currentPreviewSlide ? (
            <>
              <img
                src={currentPreviewSlide.imageUrl}
                alt={currentPreviewSlide.title}
                className="h-full w-full object-cover object-center transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />

              {/* Text content inside live preview */}
              <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center max-w-2xl">
                {currentPreviewSlide.badge && (
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 w-max mb-2">
                    {currentPreviewSlide.badge}
                  </span>
                )}
                <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  {currentPreviewSlide.title}
                </h3>
                {currentPreviewSlide.subtitle && (
                  <p className="mt-1 text-xs sm:text-sm font-medium text-slate-300 line-clamp-2">
                    {currentPreviewSlide.subtitle}
                  </p>
                )}

                {currentPreviewSlide.caption && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 w-max">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{currentPreviewSlide.caption}</span>
                  </div>
                )}
              </div>

              {/* Carousel Controls in Preview */}
              {activeSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/20 text-white backdrop-blur-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((prev) => (prev + 1) % activeSlides.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/20 text-white backdrop-blur-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    {activeSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          previewIndex === i ? "w-6 bg-emerald-400" : "w-1.5 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-500">
              No active slides available. Add a slide or reset to defaults.
            </div>
          )}
        </div>
      </div>

      {/* Filter and Management Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterActive("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterActive === "ALL"
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            All Slides ({slides.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive("ACTIVE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterActive === "ACTIVE"
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            Active ({activeSlides.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive("INACTIVE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterActive === "INACTIVE"
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            Inactive ({slides.length - activeSlides.length})
          </button>
        </div>

        <div className="relative sm:w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search slides..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Slides Cards List */}
      <div className="space-y-3">
        {filteredSlides.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-2">
              image_not_supported
            </span>
            <h4 className="font-headline-sm text-on-surface">No slides found</h4>
            <p className="font-body-compact text-on-surface-variant text-xs mt-1">
              Try adjusting your filter or search, or click &quot;+ Add Hero Slide&quot; to add one.
            </p>
          </div>
        ) : (
          filteredSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                slide.active
                  ? "bg-surface-container border-outline-variant/20 hover:border-outline-variant/50"
                  : "bg-surface-container-low/60 border-outline-variant/10 opacity-75"
              }`}
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                {/* Sequence Order & Move Controls */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-20"
                    title="Move slide up"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_drop_up</span>
                  </button>
                  <span className="font-code-compact text-xs font-bold px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface">
                    #{slide.order}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === slides.length - 1}
                    className="p-1 rounded text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-20"
                    title="Move slide down"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                  </button>
                </div>

                {/* Thumbnail Preview */}
                <div className="relative aspect-video w-32 sm:w-44 shrink-0 rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
                  <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" />
                  {!slide.active && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                      INACTIVE
                    </div>
                  )}
                </div>

                {/* Info Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        slide.active
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      {slide.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                    {slide.badge && (
                      <span className="text-[10px] font-semibold text-secondary truncate max-w-xs">
                        {slide.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-headline-sm text-on-surface text-sm sm:text-base mt-1 truncate">
                    {slide.title}
                  </h3>
                  {slide.subtitle && (
                    <p className="font-body-compact text-on-surface-variant text-xs truncate mt-0.5">
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.caption && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-tertiary">
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      <span className="truncate">{slide.caption}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-outline-variant/10 pt-3 md:pt-0 justify-end">
                {/* Active Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleSlide(slide)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    slide.active
                      ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40"
                      : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                  title={slide.active ? "Click to deactivate" : "Click to activate"}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {slide.active ? "visibility" : "visibility_off"}
                  </span>
                  <span>{slide.active ? "Active" : "Disabled"}</span>
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingSlide(slide);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>Edit</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(slide)}
                  className="p-1.5 rounded-lg text-error hover:bg-error-container/20 transition-colors"
                  title="Delete slide"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      <CreateEditHeroSlideModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSlideSaved}
        slide={editingSlide}
        existingCount={slides.length}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant/30 p-6 text-on-surface shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="font-headline-sm text-on-surface">Delete Hero Slide?</h3>
            </div>
            <p className="font-body-compact text-on-surface-variant text-xs">
              Are you sure you want to permanently delete the slide &quot;
              <strong className="text-on-surface">{deleteConfirm.title}</strong>&quot;? This action will be logged in the audit trail.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-error text-on-error hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Slide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant/30 p-6 text-on-surface shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-tertiary">
              <span className="material-symbols-outlined text-[28px]">restart_alt</span>
              <h3 className="font-headline-sm text-on-surface">Reset to Defaults?</h3>
            </div>
            <p className="font-body-compact text-on-surface-variant text-xs">
              This will reset the home hero carousel to the 4 default institutional slides (IPAM Campus, Alumni Gala, Tech Summit, and Networking Mixer).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-highest px-4 py-3 text-xs font-bold text-on-surface shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <span
            className={`material-symbols-outlined text-[18px] ${
              toast.type === "error" ? "text-error" : "text-secondary"
            }`}
          >
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
