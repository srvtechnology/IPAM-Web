"use client";

import { useState, type FormEvent } from "react";
import type { AdminEventItem } from "@/hooks/admin/useAdminEvents";

interface CreateEditEventModalProps {
  event?: AdminEventItem | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<unknown>;
}

export default function CreateEditEventModal({
  event,
  onClose,
  onSave,
}: CreateEditEventModalProps) {
  const isEditing = Boolean(event);

  const [title, setTitle] = useState(event?.title || "");
  const [category, setCategory] = useState<AdminEventItem["category"]>(
    event?.category || "NETWORKING"
  );
  const [date, setDate] = useState(
    event?.date ? new Date(event.date).toISOString().split("T")[0] : ""
  );
  const [time, setTime] = useState(event?.time || "6:00 PM");
  const [displayDate, setDisplayDate] = useState(event?.displayDate || "");
  const [location, setLocation] = useState(event?.location || "");
  const [venueDetails, setVenueDetails] = useState(event?.venueDetails || "");
  const [isVirtual, setIsVirtual] = useState(event?.isVirtual || false);
  const [virtualLink, setVirtualLink] = useState(event?.virtualLink || "");
  const [isPaid, setIsPaid] = useState(event?.isPaid || false);
  const [ticketPrice, setTicketPrice] = useState<number>(event?.ticketPrice || 0);
  const [currency, setCurrency] = useState<"USD" | "SLE">(
    (event?.currency as "USD" | "SLE") || "USD"
  );
  const [capacity, setCapacity] = useState<number>(event?.capacity || 100);
  const [dressCode, setDressCode] = useState(event?.dressCode || "");
  const [description, setDescription] = useState(event?.description || "");
  const [status, setStatus] = useState<AdminEventItem["status"]>(
    event?.status || "PUBLISHED"
  );
  const [featured, setFeatured] = useState(event?.featured || false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Preset Curated Banners
  const BANNER_PRESETS = [
    {
      name: "Annual Gala & Banquet",
      url: "/images/alumni_gala_event_1788454750646.jpg",
      tag: "Formal Gala",
    },
    {
      name: "IPAM University Campus",
      url: "/images/ipam_university_campus_1788350001937.jpg",
      tag: "Campus Grounds",
    },
    {
      name: "Alumni Networking Mixer",
      url: "/images/alumni_networking_mixer.jpg",
      tag: "Networking & Mixer",
    },
    {
      name: "Tech & Innovation Summit",
      url: "/images/alumni_tech_summit.jpg",
      tag: "Webinar & Keynote",
    },
  ];

  // Banner Images state (supports multiple banners + 1 default banner)
  const [bannerImages, setBannerImages] = useState<string[]>(() => {
    if (Array.isArray(event?.bannerImages) && event.bannerImages.length > 0) {
      return (event.bannerImages as string[]).filter(Boolean);
    }
    if (event?.bannerImage) {
      return [event.bannerImage];
    }
    return [];
  });

  const [defaultBannerImage, setDefaultBannerImage] = useState<string>(() => {
    if (event?.bannerImage) return event.bannerImage;
    if (Array.isArray(event?.bannerImages) && event.bannerImages.length > 0) {
      return (event.bannerImages as string[])[0] || "";
    }
    return "";
  });

  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  function addBannerImage(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBannerImages((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      if (!defaultBannerImage) {
        setDefaultBannerImage(trimmed);
      }
      return updated;
    });
    if (!defaultBannerImage) {
      setDefaultBannerImage(trimmed);
    }
    setNewBannerUrl("");
  }

  function handleSetDefaultBanner(url: string) {
    setDefaultBannerImage(url);
    if (!bannerImages.includes(url)) {
      setBannerImages((prev) => [url, ...prev]);
    }
  }

  function handleRemoveBanner(index: number) {
    const target = bannerImages[index];
    const nextList = bannerImages.filter((_, i) => i !== index);
    setBannerImages(nextList);
    if (defaultBannerImage === target) {
      setDefaultBannerImage(nextList[0] || "");
    }
  }

  function handleMoveBanner(index: number, direction: "left" | "right") {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= bannerImages.length) return;
    setBannerImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  }

  function compressImageFile(file: File, maxDim = 1920, quality = 0.85): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve("");
      reader.onload = () => {
        const resultStr = reader.result as string;
        const img = new Image();
        img.onerror = () => resolve(resultStr);
        img.onload = () => {
          try {
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
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(resultStr);
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          } catch {
            resolve(resultStr);
          }
        };
        img.src = resultStr;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleBannerFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingBanner(true);

    try {
      const promises = Array.from(files).map((file) => compressImageFile(file));
      const validUrls = (await Promise.all(promises)).filter(Boolean);

      if (validUrls.length > 0) {
        setBannerImages((prev) => {
          const combined = [...prev, ...validUrls.filter((u) => !prev.includes(u))];
          if (!defaultBannerImage && combined.length > 0) {
            setDefaultBannerImage(combined[0]);
          }
          return combined;
        });
        if (!defaultBannerImage) {
          setDefaultBannerImage(validUrls[0]);
        }
      }
    } catch {
      setFormError("Failed to process uploaded image file");
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  }

  // Official Event Program & Timeline (Agenda)
  interface AgendaItem {
    time: string;
    activity: string;
    speaker?: string;
  }

  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    if (Array.isArray(event?.agenda) && event.agenda.length > 0) {
      return event.agenda.map((item) => ({
        time: item.time || "",
        activity: item.activity || "",
        speaker: item.speaker || "",
      }));
    }
    return [];
  });

  function addAgendaItem(timeVal = "", activityVal = "", speakerVal = "") {
    setAgenda((prev) => [
      ...prev,
      { time: timeVal, activity: activityVal, speaker: speakerVal },
    ]);
  }

  function updateAgendaItem(index: number, field: keyof AgendaItem, value: string) {
    setAgenda((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function removeAgendaItem(index: number) {
    setAgenda((prev) => prev.filter((_, i) => i !== index));
  }

  function moveAgendaItem(index: number, direction: "up" | "down") {
    setAgenda((prev) => {
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  }

  function applyAgendaTemplate(type: string) {
    if (type === "mixer") {
      setAgenda([
        { time: "6:30 PM", activity: "Arrival & Cocktails", speaker: "" },
        { time: "7:00 PM", activity: "Speed Mentorship Circles", speaker: "" },
        { time: "8:00 PM", activity: "Open Socializing & Networking", speaker: "" },
      ]);
    } else if (type === "gala") {
      setAgenda([
        { time: "6:00 PM", activity: "Red Carpet & Welcome Reception", speaker: "" },
        { time: "7:15 PM", activity: "President's Address & Keynote", speaker: "Prof. Aminata Bangura" },
        { time: "8:00 PM", activity: "Distinguished Alumni Awards Ceremony", speaker: "Executive Council" },
        { time: "9:30 PM", activity: "Banquet Dinner & Musical Gala", speaker: "" },
      ]);
    } else if (type === "webinar") {
      setAgenda([
        { time: "10:00 AM", activity: "Welcome & Opening Remarks", speaker: "" },
        { time: "10:20 AM", activity: "Keynote Presentation & Insights", speaker: "Dr. Fatmata Kamara" },
        { time: "11:15 AM", activity: "Interactive Audience Q&A", speaker: "Panelists" },
        { time: "11:50 AM", activity: "Closing Thoughts & Resource Links", speaker: "" },
      ]);
    } else if (type === "clear") {
      setAgenda([]);
    }
  }

  // Auto-format displayDate when date changes if empty
  function handleDateChange(val: string) {
    setDate(val);
    if (val) {
      try {
        const d = new Date(val + "T12:00:00Z");
        const formatted = d.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        setDisplayDate(formatted);
      } catch {
        // keep existing
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) return setFormError("Event title is required");
    if (!date) return setFormError("Event date is required");
    const parsedDate = new Date(date.includes("T") ? date : date + "T12:00:00Z");
    if (isNaN(parsedDate.getTime())) return setFormError("Invalid event date format");
    if (!description.trim()) return setFormError("Event description is required");
    if (!location.trim() && !isVirtual) return setFormError("Physical location is required");
    if (isVirtual && !virtualLink.trim()) return setFormError("Virtual link is required for online events");
    if (capacity <= 0) return setFormError("Capacity must be at least 1");
    if (isPaid && ticketPrice <= 0) return setFormError("Paid events must have a ticket price greater than 0");

    // Clean up agenda blocks
    const cleanedAgenda = agenda
      .map((item) => ({
        time: item.time.trim(),
        activity: item.activity.trim(),
        speaker: item.speaker?.trim() || undefined,
      }))
      .filter((item) => item.time.length > 0 || item.activity.length > 0);

    for (let i = 0; i < cleanedAgenda.length; i++) {
      if (!cleanedAgenda[i].time) {
        return setFormError(`Program block #${i + 1} is missing a Time.`);
      }
      if (!cleanedAgenda[i].activity) {
        return setFormError(`Program block #${i + 1} is missing an Activity title.`);
      }
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        category,
        date: parsedDate.toISOString(),
        displayDate: displayDate.trim() || date,
        time: time.trim(),
        location: isVirtual ? "Online / Virtual" : location.trim(),
        venueDetails: venueDetails.trim() || null,
        isVirtual,
        virtualLink: isVirtual ? virtualLink.trim() : null,
        isPaid,
        ticketPrice: isPaid ? Number(ticketPrice) : 0,
        currency,
        capacity: Number(capacity),
        dressCode: dressCode.trim() || null,
        description: description.trim(),
        status,
        featured,
        agenda: cleanedAgenda.length > 0 ? cleanedAgenda : null,
        bannerImage: defaultBannerImage || (bannerImages.length > 0 ? bannerImages[0] : null),
        bannerImages: bannerImages.length > 0
          ? Array.from(new Set([defaultBannerImage || bannerImages[0], ...bannerImages].filter(Boolean)))
          : null,
      };

      const result = await onSave(payload);
      if (result) {
        onClose();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[24px]">
              {isEditing ? "edit_calendar" : "add_circle"}
            </span>
            <h2 className="font-headline-md text-on-surface">
              {isEditing ? "Edit Alumni Event" : "Create New Alumni Event"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl bg-error-container/40 p-3 text-xs font-medium text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IPAM Annual Homecoming & Gala 2026"
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AdminEventItem["category"])}
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="GALA">Gala & Formal Banquet</option>
                <option value="WEBINAR">Webinar & Online Session</option>
                <option value="NETWORKING">Networking & Mixer</option>
                <option value="CAREER_WORKSHOP">Career Workshop</option>
                <option value="REGIONAL_MEETUP">Regional Chapter Meetup</option>
              </select>
            </div>
          </div>

          {/* Pricing & Paid / Unpaid Configuration Section */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">payments</span>
                  Ticket Pricing & Payment Model
                </span>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Configure whether admission is complimentary (free) or requires a paid booking.
                </p>
              </div>

              {/* Paid vs Free Toggle Buttons */}
              <div className="flex items-center rounded-lg border border-outline-variant/30 bg-surface-container p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaid(false);
                    setTicketPrice(0);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                    !isPaid
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Free / Unpaid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPaid(true);
                    if (ticketPrice === 0) setTicketPrice(25);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                    isPaid
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">credit_card</span>
                  Paid Ticket Event
                </button>
              </div>
            </div>

            {isPaid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-outline-variant/15">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Ticket Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-on-surface-variant">
                      {currency === "SLE" ? "SLE" : "$"}
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(Number(e.target.value))}
                      className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 pl-11 pr-3 py-2 text-sm font-bold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Billing Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as "USD" | "SLE")}
                    className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="SLE">SLE (Le - Sierra Leonean Leone)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>This event is completely Free for all alumni & attendees. No payment gateway or fee required.</span>
              </div>
            )}
          </div>

          {/* Date, Time & Display String */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Time *
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 6:00 PM GMT"
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Display Date Text
              </label>
              <input
                type="text"
                value={displayDate}
                onChange={(e) => setDisplayDate(e.target.value)}
                placeholder="e.g. December 12, 2026"
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Location / Virtual Toggle */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Format & Venue
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-on-surface">
                <input
                  type="checkbox"
                  checked={isVirtual}
                  onChange={(e) => setIsVirtual(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                />
                Virtual / Online Event
              </label>
            </div>

            {isVirtual ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Virtual Meeting Link *</label>
                <input
                  type="url"
                  required={isVirtual}
                  value={virtualLink}
                  onChange={(e) => setVirtualLink(e.target.value)}
                  placeholder="https://meet.google.com/... or Zoom link"
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Location / City *</label>
                  <input
                    type="text"
                    required={!isVirtual}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Freetown Grand Hall"
                    className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Venue Details</label>
                  <input
                    type="text"
                    value={venueDetails}
                    onChange={(e) => setVenueDetails(e.target.value)}
                    placeholder="e.g. Main Ballroom, Floor 2"
                    className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Capacity, Dress Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Max Capacity (Seats) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Dress Code
              </label>
              <input
                type="text"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                placeholder="e.g. Formal Black Tie, Business Casual"
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AdminEventItem["status"])}
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="PUBLISHED">Published (Live to Alumni)</option>
                <option value="DRAFT">Draft (Admin Only)</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Event Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide event details, objectives, key highlights for participants..."
              className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Event Banner Images & Media (Multiple + Default Selection) */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high/40 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[20px]">photo_library</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">Event Banner Images &amp; Media</h3>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary font-mono">
                      {bannerImages.length} {bannerImages.length === 1 ? "Banner" : "Banners"}
                    </span>
                    {defaultBannerImage && (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        Default Set
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Add multiple high-resolution banners. Designate one as the Default Cover Banner displayed across the portal.
                  </p>
                </div>
              </div>

              {/* Upload from Local Device */}
              <label className="flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-3 py-1.5 text-xs font-bold hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>{isUploadingBanner ? "Uploading..." : "Upload from Device"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBannerFileUpload}
                  disabled={isUploadingBanner}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Preset Banners Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  1-Click IPAM Curated Presets:
                </span>
                <span className="text-[10px] text-on-surface-variant/70">Click to add preset banner</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BANNER_PRESETS.map((preset) => {
                  const isAdded = bannerImages.includes(preset.url);
                  const isDefault = defaultBannerImage === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => addBannerImage(preset.url)}
                      className={`group relative overflow-hidden rounded-lg border text-left transition-all p-1.5 flex flex-col gap-1 ${
                        isDefault
                          ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5"
                          : isAdded
                          ? "border-primary/50 bg-primary/5"
                          : "border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container"
                      }`}
                    >
                      <div className="relative h-16 w-full rounded overflow-hidden bg-surface-container-highest">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {isDefault && (
                          <div className="absolute top-1 right-1 rounded-sm bg-emerald-600 px-1 py-0.5 text-[9px] font-black text-white shadow-xs">
                            ★ DEFAULT
                          </div>
                        )}
                        {!isDefault && isAdded && (
                          <div className="absolute top-1 right-1 rounded-sm bg-primary/90 px-1 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            ADDED
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-on-surface line-clamp-1">{preset.name}</span>
                        <span className="text-[10px] text-on-surface-variant">{preset.tag}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom URL Input Bar */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-on-surface-variant">
                  link
                </span>
                <input
                  type="url"
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBannerImage(newBannerUrl);
                    }
                  }}
                  placeholder="Or enter image URL (https://... or /images/...)"
                  className="w-full rounded-lg bg-surface-container border border-outline-variant/30 pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                disabled={!newBannerUrl.trim()}
                onClick={() => addBannerImage(newBannerUrl)}
                className="flex items-center gap-1 rounded-lg bg-surface-container border border-outline-variant/40 px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-highest disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Image</span>
              </button>
            </div>

            {/* Added Banners Gallery & Default Selector */}
            {bannerImages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant/40 p-4 text-center">
                <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40 mb-1">
                  hide_image
                </span>
                <p className="text-xs font-semibold text-on-surface">No custom banner images configured</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Click any of the curated presets above, upload an image from your computer, or paste a URL. If omitted, the standard IPAM Gala banner will be used as default cover.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant">
                  <span>Current Banner Collection ({bannerImages.length})</span>
                  <span>Click &quot;Set as Default&quot; to pick cover image</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bannerImages.map((url, idx) => {
                    const isDefault = (defaultBannerImage === url) || (!defaultBannerImage && idx === 0);
                    return (
                      <div
                        key={idx}
                        className={`group relative overflow-hidden rounded-xl border transition-all ${
                          isDefault
                            ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/30"
                            : "border-outline-variant/30 bg-surface-container hover:border-outline-variant/60"
                        }`}
                      >
                        {/* Banner Image Preview */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black/10">
                          <img
                            src={url}
                            alt={`Banner ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                            onError={(e) => {
                              // fallback on image error
                              (e.target as HTMLImageElement).src = "/images/alumni_gala_event_1788454750646.jpg";
                            }}
                          />
                          {/* Default indicator badge */}
                          {isDefault ? (
                            <div className="absolute top-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">star</span>
                              <span>DEFAULT BANNER</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultBanner(url)}
                              className="absolute top-2 left-2 rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-md hover:bg-emerald-600 transition-colors flex items-center gap-1 opacity-90 group-hover:opacity-100"
                              title="Set as the default event cover banner"
                            >
                              <span className="material-symbols-outlined text-[13px]">star_border</span>
                              <span>Set as Default</span>
                            </button>
                          )}

                          {/* Order Indicator */}
                          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-xs">
                            #{idx + 1}
                          </div>
                        </div>

                        {/* Banner Action Bar */}
                        <div className="flex items-center justify-between p-2 bg-surface-container">
                          <div className="flex items-center gap-1">
                            {isDefault ? (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Primary Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultBanner(url)}
                                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveBanner(idx, "left")}
                              title="Move Banner Left"
                              className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>
                            <button
                              type="button"
                              disabled={idx === bannerImages.length - 1}
                              onClick={() => handleMoveBanner(idx, "right")}
                              title="Move Banner Right"
                              className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveBanner(idx)}
                              title="Remove Banner"
                              className="rounded p-1 text-error hover:bg-error-container/20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Official Event Program & Timeline Builder */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high/40 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">Official Event Program &amp; Timeline</h3>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {agenda.length} Scheduled {agenda.length === 1 ? "Block" : "Blocks"}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Define the official timeline, activities, and speakers displayed publicly on the event page.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Template Quick Loader */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      applyAgendaTemplate(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                  className="rounded-lg bg-surface-container border border-outline-variant/30 px-2.5 py-1.5 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="" disabled>Load Preset Template...</option>
                  <option value="mixer">Networking Mixer (3 Blocks)</option>
                  <option value="gala">Annual Gala (4 Blocks)</option>
                  <option value="webinar">Webinar / Workshop (4 Blocks)</option>
                  {agenda.length > 0 && <option value="clear">Clear All Blocks</option>}
                </select>

                <button
                  type="button"
                  onClick={() => addAgendaItem()}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add Block</span>
                </button>
              </div>
            </div>

            {/* Blocks List */}
            {agenda.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant/40 p-6 text-center">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/50 mb-1">
                  calendar_today
                </span>
                <p className="text-xs font-semibold text-on-surface">No program blocks scheduled yet</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">
                  Add schedule items with specific times and activities, or load a preset template to get started.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => addAgendaItem("6:30 PM", "Arrival & Cocktails")}
                    className="rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    + Add First Block
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAgendaTemplate("mixer")}
                    className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    Load Mixer Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {agenda.map((item, idx) => (
                  <div
                    key={idx}
                    className="group relative flex items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-container p-3 transition-all hover:border-emerald-500/40"
                  >
                    {/* Index bullet with line */}
                    <div className="flex flex-col items-center pt-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-2xs">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Form Fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      {/* Time Field */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                          Time *
                        </label>
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) => updateAgendaItem(idx, "time", e.target.value)}
                          placeholder="e.g. 6:30 PM"
                          className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-2.5 py-1.5 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary font-mono font-semibold"
                        />
                      </div>

                      {/* Activity Title Field */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                          Activity / Session Title *
                        </label>
                        <input
                          type="text"
                          value={item.activity}
                          onChange={(e) => updateAgendaItem(idx, "activity", e.target.value)}
                          placeholder="e.g. Arrival & Cocktails"
                          className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-2.5 py-1.5 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary font-medium"
                        />
                      </div>

                      {/* Speaker Field */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                          Speaker / Host (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.speaker || ""}
                          onChange={(e) => updateAgendaItem(idx, "speaker", e.target.value)}
                          placeholder="e.g. Alex Sesay, UNDP"
                          className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-2.5 py-1.5 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-1 pt-4">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveAgendaItem(idx, "up")}
                        title="Move Up"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === agenda.length - 1}
                        onClick={() => moveAgendaItem(idx, "down")}
                        title="Move Down"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(idx)}
                        title="Remove Block"
                        className="rounded-md p-1 text-error hover:bg-error-container/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Featured checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="event-featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="event-featured" className="text-xs font-semibold text-on-surface cursor-pointer">
              Feature this event prominently on events top banner showcase, portal homepage, and alumni dashboard
            </label>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {saving ? "sync" : "save"}
              </span>
              <span>{saving ? "Saving..." : isEditing ? "Update Event" : "Create Event"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
