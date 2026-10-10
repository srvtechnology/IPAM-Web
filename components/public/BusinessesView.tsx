"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Plus,
  Building2,
  Search,
  Star,
  MapPin,
  Users,
  X,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import SubmitBusinessModal from "@/components/public/SubmitBusinessModal";

export interface BusinessListItem {
  id: string;
  name: string;
  founders: string;
  classYear: string;
  category: string;
  industry: string;
  tagline: string | null;
  description: string;
  location: string;
  featured: boolean;
  image: string | null;
  bannerImage?: string | null;
  logo?: string | null;
  website?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  status?: string;
  submittedByType?: string;
  userId?: string | null;
  rejectionReason?: string | null;
  services: string[];
}

export default function BusinessesView({
  businesses,
  myBusinesses = [],
  currentUserId,
}: {
  businesses: BusinessListItem[];
  myBusinesses?: BusinessListItem[];
  currentUserId?: string | null;
}) {
  const router = useRouter();
  const { session, isSubmitBusinessOpen, setIsSubmitBusinessOpen } = useApp();

  // Internal reactive state for immediate UI feedback after create / edit
  const [businessesList, setBusinessesList] = useState<BusinessListItem[]>(businesses);
  const [myBusinessesList, setMyBusinessesList] = useState<BusinessListItem[]>(myBusinesses);
  const [activeTab, setActiveTab] = useState<"directory" | "mine">("directory");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editingBusiness, setEditingBusiness] = useState<BusinessListItem | null>(null);

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Categories computed dynamically from current businessesList
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(businessesList.map((b) => b.category || "Other")))],
    [businessesList]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: businessesList.length };
    businessesList.forEach((b) => {
      const cat = b.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [businessesList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businessesList.filter((b) => {
      if (category !== "All" && (b.category || "Other") !== category) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.founders.toLowerCase().includes(q) ||
        b.industry.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q)
      );
    });
  }, [businessesList, query, category]);

  const hasActiveFilters = category !== "All" || !!query;
  function resetFilters() {
    setQuery("");
    setCategory("All");
  }

  const industryCount = Math.max(categories.length - 1, 0);

  // State management callback when a business is submitted
  function handleBusinessCreated(created: any) {
    const newListing: BusinessListItem = {
      id: created.id,
      name: created.name,
      founders: created.founders,
      classYear: created.classYear,
      category: created.category,
      industry: created.industry,
      tagline: created.tagline ?? null,
      description: created.description,
      location: created.location,
      featured: created.featured ?? false,
      image: created.image ?? null,
      bannerImage: created.bannerImage ?? null,
      logo: created.logo ?? null,
      website: created.website,
      contactEmail: created.contactEmail,
      contactPhone: created.contactPhone ?? null,
      status: created.status ?? "PENDING_APPROVAL",
      submittedByType: created.submittedByType ?? "ALUMNI",
      userId: created.userId ?? currentUserId,
      rejectionReason: created.rejectionReason ?? null,
      services: Array.isArray(created.services) ? created.services : [],
    };

    // 1. Immediately prepend to user's submissions
    setMyBusinessesList((prev) => [newListing, ...prev.filter((b) => b.id !== newListing.id)]);

    // 2. If approved (e.g. admin created), also add to public directory list
    if (newListing.status === "APPROVED") {
      setBusinessesList((prev) => [newListing, ...prev.filter((b) => b.id !== newListing.id)]);
    }

    // 3. Immediately switch active tab to "mine" so user directly sees their new listing!
    setActiveTab("mine");

    // 4. Show success banner
    setFeedbackBanner({
      type: "success",
      title: "Enterprise Listing Submitted",
      message: `"${newListing.name}" has been submitted and queued for administrative review. You can manage or edit it anytime from your submissions dashboard below.`,
    });
  }

  // State management callback when a business is edited
  function handleBusinessUpdated(updated: any) {
    setMyBusinessesList((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );
    setBusinessesList((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );
    setEditingBusiness(null);

    setFeedbackBanner({
      type: "success",
      title: "Listing Updated",
      message: `"${updated.name}" details and banner image were updated successfully.`,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* Top institutional banner */}
      <section className="relative flex min-h-[520px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[580px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/ipam_university_campus_1788350001937.jpg"
            alt="Institute of Public Administration and Management Campus"
            className="h-full w-full scale-105 transform object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-emerald-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-xs backdrop-blur-md">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>Alumni Commerce &amp; Founders Network • IPAM Enterprises</span>
          </div>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                Support Alumni-Led Enterprises
              </h1>
              <p className="text-base font-normal leading-relaxed text-slate-300 sm:text-lg">
                Discover, patronize, and partner with innovative commercial ventures and startups founded by IPAM
                alumni. Connect directly with founders across every industry represented in the directory.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => (session ? setIsSubmitBusinessOpen(true) : router.push("/login?redirect=/businesses"))}
                className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-900/40 active:scale-98"
              >
                <Plus className="h-5 w-5" />
                <span>Submit Your Business</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{businessesList.length}+</div>
              <div className="text-xs font-medium text-slate-300">Registered Enterprises</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{industryCount || 12}+</div>
              <div className="text-xs font-medium text-slate-300">Industry Sectors</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">$45M+</div>
              <div className="text-xs font-medium text-slate-300">Combined Economic Impact</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">100%</div>
              <div className="text-xs font-medium text-slate-300">Alumni Founded &amp; Owned</div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-8 max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Feedback Alert Banner */}
        {feedbackBanner && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-md animate-fadeIn">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-emerald-900">{feedbackBanner.title}</div>
                <div className="text-xs text-emerald-800 mt-0.5">{feedbackBanner.message}</div>
              </div>
            </div>
            <button
              onClick={() => setFeedbackBanner(null)}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs (Directory vs My Enterprises) */}
        {session && myBusinessesList.length > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs w-fit">
            <button
              onClick={() => setActiveTab("directory")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "directory"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Public Directory ({businessesList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("mine")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "mine"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>My Enterprises ({myBusinessesList.length})</span>
              {myBusinessesList.some((b) => b.status === "PENDING_APPROVAL") && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* TAB 1: MY ENTERPRISES (State Management Active) */}
        {activeTab === "mine" && session && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">Your Submitted Enterprises</h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Manage your commercial listings, edit banner photos, and monitor administrative review status.
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmitBusinessOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 w-fit"
                >
                  <Plus className="h-4 w-4" />
                  <span>List Another Business</span>
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBusinessesList.map((b) => {
                  const banner = b.bannerImage || b.image;
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md"
                    >
                      <div>
                        {/* Banner preview */}
                        <div className="relative h-44 overflow-hidden bg-slate-900">
                          {banner ? (
                            <img src={banner} alt={b.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400">
                              <Building2 className="h-8 w-8 text-slate-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                          {/* Status Badge */}
                          <div className="absolute left-3 top-3">
                            {b.status === "PENDING_APPROVAL" && (
                              <span className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-500/90 px-3 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                                <Clock className="h-3 w-3" /> Under Review
                              </span>
                            )}
                            {b.status === "APPROVED" && (
                              <span className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-600/95 px-3 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                                <CheckCircle2 className="h-3 w-3" /> Live &amp; Approved
                              </span>
                            )}
                            {b.status === "REJECTED" && (
                              <span className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-600/95 px-3 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                                <AlertCircle className="h-3 w-3" /> Changes Requested
                              </span>
                            )}
                          </div>

                          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 backdrop-blur-md">
                            Class {b.classYear}
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                              {b.industry}
                            </span>
                            <h3 className="truncate text-base font-bold text-white drop-shadow-xs">{b.name}</h3>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-3">
                          <p className="line-clamp-2 text-xs text-slate-600">{b.description}</p>

                          {b.rejectionReason && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                              <span className="font-bold">Admin feedback:</span> {b.rejectionReason}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{b.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-5 pt-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBusiness(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50/50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit Business &amp; Banner</span>
                        </button>
                        <Link
                          href={`/businesses/${b.id}`}
                          className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700 hover:bg-slate-100"
                          title="View Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PUBLIC DIRECTORY */}
        {activeTab === "directory" && (
          <>
            {/* Filter Bar */}
            <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="shrink-0 cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-emerald-600 sm:w-72 sm:text-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-white text-slate-900">
                      {c === "All" ? `All Categories (${categoryCounts.All || 0})` : `${c} (${categoryCounts[c] || 0})`}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by business name, founder, service, keyword, or city…"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-emerald-600 md:text-base"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-1 pt-2 text-xs text-slate-500">
                <span>
                  Showing <strong className="text-slate-900">{filtered.length}</strong> of{" "}
                  <strong className="text-slate-900">{businessesList.length}</strong> alumni enterprises
                  {category !== "All" && (
                    <>
                      {" "}
                      in{" "}
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                        {category}
                      </span>
                    </>
                  )}
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Approved Businesses */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((b) => {
                  const banner = b.bannerImage || b.image;
                  const isOwner = currentUserId && b.userId === currentUserId;

                  return (
                    <div
                      key={b.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
                    >
                      <div>
                        <div className="relative h-52 overflow-hidden bg-slate-100">
                          {banner ? (
                            <img
                              src={banner}
                              alt={b.name}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                              <Building2 className="h-8 w-8 text-emerald-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                            {b.featured && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                                <Star className="h-3 w-3 fill-white" /> Featured
                              </span>
                            )}
                            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur-md">
                              {b.category || "Venture"}
                            </span>
                          </div>

                          <span className="absolute right-3 top-3 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-xs backdrop-blur-md">
                            {b.classYear}
                          </span>

                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-white drop-shadow-xs">
                              {b.industry}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 p-6">
                          <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700">
                            {b.name}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-500">Founders:</span>
                            <span className="font-bold text-slate-800">{b.founders}</span>
                          </div>

                          <p className="line-clamp-3 text-xs leading-[1.6] text-slate-600 sm:text-sm">
                            {b.description}
                          </p>

                          {b.services.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {b.services.slice(0, 2).map((s) => (
                                <span
                                  key={s}
                                  className="max-w-full truncate rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                                >
                                  {s}
                                </span>
                              ))}
                              {b.services.length > 2 && (
                                <span className="py-0.5 text-[11px] font-semibold text-slate-500">
                                  +{b.services.length - 2} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="truncate">{b.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 pt-0 flex items-center gap-2">
                        <Link
                          href={`/businesses/${b.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-center text-xs font-bold text-slate-800 transition-all group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                        >
                          <span>View Profile</span>
                        </Link>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => setEditingBusiness(b)}
                            className="rounded-2xl border border-emerald-600 bg-emerald-50 px-3.5 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                            title="Edit your business listing"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <Building2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  No Businesses Found in {category === "All" ? "Directory" : `"${category}"`}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {query
                    ? `No alumni enterprises matched your search query "${query}". Try resetting filters or search by founder name.`
                    : "We haven't listed any businesses in this category yet. Be the first to register your enterprise!"}
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={resetFilters}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={() => (session ? setIsSubmitBusinessOpen(true) : router.push("/login?redirect=/businesses"))}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Submit Business</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal with State Management callback */}
      {isSubmitBusinessOpen && (
        <SubmitBusinessModal
          mode="create"
          onClose={() => setIsSubmitBusinessOpen(false)}
          onSuccess={handleBusinessCreated}
        />
      )}

      {/* Edit Modal with State Management callback */}
      {editingBusiness && (
        <SubmitBusinessModal
          mode="edit"
          initialData={editingBusiness}
          onClose={() => setEditingBusiness(null)}
          onSuccess={handleBusinessUpdated}
        />
      )}
    </div>
  );
}
