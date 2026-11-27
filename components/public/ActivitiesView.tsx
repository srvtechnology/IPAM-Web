"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Images,
  Calendar,
  MapPin,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Share2,
  Camera,
  History,
  Flame,
  Maximize2,
} from "lucide-react";
import type { AlumniActivityItem } from "@/lib/validation/activities";
import ShareModal from "@/components/public/ShareModal";

export default function ActivitiesView({
  initialActivities,
}: {
  initialActivities: AlumniActivityItem[];
}) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "CURRENT" | "PREVIOUS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<AlumniActivityItem | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [sharingActivity, setSharingActivity] = useState<AlumniActivityItem | null>(null);

  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialActivities.filter((act) => {
      if (filterStatus !== "ALL" && act.status !== filterStatus) return false;
      if (!q) return true;
      return (
        act.title.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        (act.location && act.location.toLowerCase().includes(q)) ||
        (act.category && act.category.toLowerCase().includes(q))
      );
    });
  }, [initialActivities, filterStatus, searchQuery]);

  const currentCount = useMemo(
    () => initialActivities.filter((a) => a.status === "CURRENT").length,
    [initialActivities]
  );
  const previousCount = useMemo(
    () => initialActivities.filter((a) => a.status === "PREVIOUS").length,
    [initialActivities]
  );
  const totalPhotosCount = useMemo(
    () => initialActivities.reduce((sum, a) => sum + a.photos.length, 0),
    [initialActivities]
  );

  function openGallery(activity: AlumniActivityItem, photoIndex = 0) {
    setSelectedActivity(activity);
    setActivePhotoIndex(photoIndex);
  }

  useEffect(() => {
    if (!selectedActivity) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!selectedActivity) return;
      if (e.key === "Escape") {
        setSelectedActivity(null);
      } else if (e.key === "ArrowRight" && selectedActivity.photos.length > 1) {
        setActivePhotoIndex((prev) => (prev + 1) % selectedActivity.photos.length);
      } else if (e.key === "ArrowLeft" && selectedActivity.photos.length > 1) {
        setActivePhotoIndex(
          (prev) => (prev - 1 + selectedActivity.photos.length) % selectedActivity.photos.length
        );
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedActivity]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* Hero Header */}
      <section className="relative flex min-h-[460px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[520px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/alumni_gala_event_1788454750646.jpg"
            alt="IPAM Alumni Activities Gallery"
            className="h-full w-full scale-105 object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/85 to-emerald-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-xs backdrop-blur-md">
            <Images className="h-4 w-4 text-emerald-400" />
            <span>IPAM Visual Chronicles • Current &amp; Previous Alumni Activities</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Alumni Activities &amp; Photo Gallery
            </h1>
            <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
              Explore photographic highlights, milestones, and stories from ongoing campus initiatives,
              regional chapter gatherings, and cherished alumni galas across the years.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-5 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{initialActivities.length}</div>
              <div className="text-xs font-medium text-slate-300">Documented Activities</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{currentCount}</div>
              <div className="text-xs font-medium text-slate-300">Current Events</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{previousCount}</div>
              <div className="text-xs font-medium text-slate-300">Previous Archives</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{totalPhotosCount}+</div>
              <div className="text-xs font-medium text-slate-300">Gallery Photographs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-20 mx-auto -mt-8 max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Search & Filter Card */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "ALL" as const, label: `All Activities (${initialActivities.length})`, icon: Images },
              { key: "CURRENT" as const, label: `Current Events (${currentCount})`, icon: Flame },
              { key: "PREVIOUS" as const, label: `Previous Events (${previousCount})`, icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                    active
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-emerald-100" : "text-emerald-600"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities, locations..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-8 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-xs">
            <Camera className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900">No activities found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || filterStatus !== "ALL"
                ? "Try clearing your filters or searching with different keywords."
                : "New campus and chapter activity galleries will appear here soon."}
            </p>
            {(searchQuery || filterStatus !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((activity) => {
              const coverPhoto = activity.photos[0] || "/images/alumni_gala_event_1788454750646.jpg";
              const extraThumbs = activity.photos.slice(1, 5);

              return (
                <article
                  key={activity.id}
                  onClick={() => openGallery(activity, 0)}
                  className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xl"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                      <img
                        src={coverPhoto}
                        alt={activity.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20" />

                      {/* Status Badge */}
                      <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                            activity.status === "CURRENT"
                              ? "bg-emerald-600/95 text-white"
                              : "bg-slate-900/85 text-slate-100 border border-white/15"
                          }`}
                        >
                          {activity.status === "CURRENT" ? (
                            <>
                              <Flame className="h-3 w-3 text-emerald-200" />
                              <span>Current Event</span>
                            </>
                          ) : (
                            <>
                              <History className="h-3 w-3 text-slate-300" />
                              <span>Previous Event</span>
                            </>
                          )}
                        </span>
                        {activity.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-sm">
                            <Sparkles className="h-3 w-3" /> Highlight
                          </span>
                        )}
                      </div>

                      {/* Photo Count Pill */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/15">
                        <Camera className="h-3.5 w-3.5 text-emerald-400" />
                        <span>
                          {activity.photos.length} {activity.photos.length === 1 ? "Photo" : "Photos"}
                        </span>
                      </div>
                    </div>

                    {/* Multi-photo Thumbnail Strip */}
                    {extraThumbs.length > 0 && (
                      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1.5 border-b border-slate-200/80">
                        {extraThumbs.map((imgUrl, idx) => {
                          const isLastWithMore = idx === 3 && activity.photos.length > 5;
                          return (
                            <div
                              key={`${activity.id}-thumb-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openGallery(activity, idx + 1);
                              }}
                              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-200"
                            >
                              <img
                                src={imgUrl}
                                alt={`${activity.title} photo ${idx + 2}`}
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                              />
                              {isLastWithMore && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-xs font-black text-white">
                                  +{activity.photos.length - 4}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Body */}
                    <div className="space-y-2.5 p-5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                        {activity.category && (
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                            {activity.category}
                          </span>
                        )}
                        {activity.displayDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-emerald-600" />
                            <span>{activity.displayDate}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700">
                        {activity.title}
                      </h3>

                      <p className="line-clamp-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {activity.description}
                      </p>

                      {activity.location && (
                        <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGallery(activity, 0);
                      }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-extrabold text-slate-800 transition-all group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Open Photo Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingActivity(activity);
                      }}
                      title="Share Activity"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Gallery Lightbox & Details Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="relative my-6 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    selectedActivity.status === "CURRENT"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {selectedActivity.status === "CURRENT" ? "Current Event" : "Previous Event"}
                </span>
                <h2 className="truncate text-base font-extrabold text-white sm:text-lg">
                  {selectedActivity.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSharingActivity(selectedActivity)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  aria-label="Close gallery"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left: Photo Carousel Viewer */}
              <div className="bg-slate-950 lg:col-span-7 flex flex-col justify-between">
                <div className="relative flex aspect-[16/11] w-full items-center justify-center overflow-hidden bg-black">
                  <img
                    src={selectedActivity.photos[activePhotoIndex] || selectedActivity.photos[0]}
                    alt={`${selectedActivity.title} photo ${activePhotoIndex + 1}`}
                    className="max-h-[460px] w-full object-contain"
                  />

                  {selectedActivity.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIndex(
                            (prev) =>
                              (prev - 1 + selectedActivity.photos.length) %
                              selectedActivity.photos.length
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/75 text-white border border-white/15 hover:bg-emerald-600 transition-colors"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIndex((prev) => (prev + 1) % selectedActivity.photos.length)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/75 text-white border border-white/15 hover:bg-emerald-600 transition-colors"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-white border border-white/10">
                    {activePhotoIndex + 1} / {selectedActivity.photos.length}
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {selectedActivity.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-slate-800 bg-slate-950 p-3">
                    {selectedActivity.photos.map((photo, idx) => (
                      <button
                        key={`modal-thumb-${idx}`}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                          idx === activePhotoIndex
                            ? "border-emerald-500 ring-2 ring-emerald-500/40"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details & Description */}
              <div className="flex flex-col justify-between space-y-5 p-6 lg:col-span-5 max-h-[540px] overflow-y-auto bg-slate-900">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedActivity.category && (
                      <span className="rounded-lg border border-emerald-500/30 bg-emerald-950/70 px-2.5 py-1 font-bold text-emerald-300">
                        {selectedActivity.category}
                      </span>
                    )}
                    {selectedActivity.displayDate && (
                      <span className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-semibold text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{selectedActivity.displayDate}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black leading-snug text-white">
                    {selectedActivity.title}
                  </h3>

                  {selectedActivity.location && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{selectedActivity.location}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-800 pt-4">
                    <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Activity Highlights &amp; Description
                    </h4>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                      {selectedActivity.description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 text-xs text-slate-400">
                  Use arrow keys (← / →) or click thumbnails to browse all {selectedActivity.photos.length} photos in this gallery.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {sharingActivity && (
        <ShareModal
          isOpen={!!sharingActivity}
          onClose={() => setSharingActivity(null)}
          title={sharingActivity.title}
          subtitle={
            [sharingActivity.displayDate, sharingActivity.location].filter(Boolean).join(" • ") ||
            `${sharingActivity.photos.length} Photos`
          }
          categoryLabel={
            sharingActivity.status === "CURRENT"
              ? "IPAM Current Activity"
              : "IPAM Alumni Archive"
          }
          url="/activities"
          shareText={`Explore "${sharingActivity.title}" in the IPAM Alumni Activities & Photo Gallery!`}
          imageUrl={sharingActivity.photos[0] || null}
        />
      )}
    </div>
  );
}
