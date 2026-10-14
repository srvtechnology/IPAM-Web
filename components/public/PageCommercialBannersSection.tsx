"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { type CommercialBanner } from "@/lib/commercial-banners";

interface PageCommercialBannersSectionProps {
  pageLink: string;
  initialBanners: CommercialBanner[];
}

export default function PageCommercialBannersSection({
  pageLink,
  initialBanners = [],
}: PageCommercialBannersSectionProps) {
  // Record impressions on load
  useEffect(() => {
    if (initialBanners.length > 0) {
      const ids = initialBanners.map((b) => b.id);
      fetch("/api/banners/impressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }).catch(() => {});
    }
  }, [initialBanners]);

  const handleBannerClick = (banner: CommercialBanner) => {
    fetch(`/api/banners/${banner.id}/click`, {
      method: "POST",
    }).catch(() => {});
  };

  if (initialBanners.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Commercial & Sponsor Banners"
      className="relative mt-16 border-t border-slate-200/80 bg-gradient-to-b from-slate-50/50 via-slate-100/60 to-slate-50/90 py-12 sm:mt-20 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end md:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Commercial Spotlight &middot; Sponsor Offers</span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Institutional Partners &amp; Commercial Offers
            </h2>
            <p className="mt-1 text-sm text-slate-600 sm:text-base max-w-2xl">
              Specialized services, enterprise financing, and exclusive commercial opportunities curated for the IPAM
              global alumni network.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {initialBanners.length} {initialBanners.length === 1 ? "Partner Offer" : "Partner Offers"}
            </span>
            <Link
              href="/businesses"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:border-emerald-600 hover:text-emerald-700"
            >
              <span>Advertise With IPAM</span>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* BANNERS DISPLAY */}

        {/* CASE 1: Single banner -> Full-width Panoramic Showcase Card */}
        {initialBanners.length === 1 && (
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:border-emerald-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              {/* Media side */}
              <div className="relative h-64 sm:h-80 lg:col-span-6 lg:h-96 overflow-hidden bg-slate-950">
                <img
                  src={initialBanners[0].bannerImageUrl}
                  alt={initialBanners[0].headline}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent lg:hidden" />
                <div className="absolute top-4 left-4 rounded-full bg-slate-900/85 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-400 border border-emerald-500/30">
                  {initialBanners[0].badge}
                </div>
              </div>

              {/* Content side */}
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-6 lg:p-10">
                <div>
                  <div className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 border border-emerald-600/20 mb-3">
                    {initialBanners[0].badge}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sponsored By &middot; {initialBanners[0].name}
                  </div>
                  <h3 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl lg:text-3xl leading-tight">
                    {initialBanners[0].headline}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                    {initialBanners[0].description}
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  <a
                    href={initialBanners[0].targetUrl}
                    target={initialBanners[0].targetUrl.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={() => handleBannerClick(initialBanners[0])}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
                  >
                    <span>{initialBanners[0].ctaText || "Explore Offer"}</span>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>

                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Sponsored Content &middot; Verified Partner
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: Two banners -> Balanced 2-Column Split */}
        {initialBanners.length === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {initialBanners.map((banner) => (
              <div
                key={banner.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:border-emerald-300"
              >
                <div>
                  <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-900">
                    <img
                      src={banner.bannerImageUrl}
                      alt={banner.headline}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 rounded-full bg-slate-900/85 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-400 border border-emerald-500/30">
                      {banner.badge}
                    </div>
                  </div>

                  <div className="p-6 sm:p-7">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Partner &middot; {banner.name}
                    </div>
                    <h3 className="mt-2 text-lg font-black text-slate-900 sm:text-xl line-clamp-2 leading-snug">
                      {banner.headline}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {banner.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 sm:p-7 sm:pt-0">
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={banner.targetUrl}
                      target={banner.targetUrl.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      onClick={() => handleBannerClick(banner)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                    >
                      <span>{banner.ctaText || "Learn More"}</span>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </a>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Sponsored
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CASE 3: Three or more banners -> Responsive Multi-Card Grid */}
        {initialBanners.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialBanners.map((banner) => (
              <div
                key={banner.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:border-emerald-300"
              >
                <div>
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-900">
                    <img
                      src={banner.bannerImageUrl}
                      alt={banner.headline}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 rounded-full bg-slate-900/85 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-400 border border-emerald-500/30">
                      {banner.badge}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {banner.name}
                    </div>
                    <h3 className="mt-1.5 text-base font-black text-slate-900 sm:text-lg line-clamp-2 leading-snug">
                      {banner.headline}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {banner.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 sm:p-6 sm:pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={banner.targetUrl}
                      target={banner.targetUrl.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      onClick={() => handleBannerClick(banner)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                    >
                      <span>{banner.ctaText || "View Details"}</span>
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </a>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ad &middot; Verified
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
