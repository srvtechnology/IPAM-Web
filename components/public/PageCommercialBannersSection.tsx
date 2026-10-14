"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CommercialBanner } from "@/lib/commercial-banners";

interface PageCommercialBannersSectionProps {
  pageLink: string;
  initialBanners: CommercialBanner[];
}

export default function PageCommercialBannersSection({
  pageLink,
  initialBanners = [],
}: PageCommercialBannersSectionProps) {
  const activeBanners = initialBanners.filter((b) => b.active !== false);

  // Impressions tracking on load
  useEffect(() => {
    if (activeBanners.length > 0) {
      const ids = activeBanners.map((b) => b.id);
      fetch("/api/banners/impressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }).catch(() => {});
    }
  }, [activeBanners]);

  const handleBannerClick = (banner: CommercialBanner) => {
    fetch(`/api/banners/${banner.id}/click`, {
      method: "POST",
    }).catch(() => {});
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Swipe gesture support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prevSlide = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  // Autoplay every 5 seconds, pauses when hovered
  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isHovered]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Commercial & Sponsor Banners"
      className="w-full py-6 sm:py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-md transition-shadow hover:shadow-xl border border-slate-200/80 bg-slate-950 aspect-[21/9] sm:aspect-[24/7] lg:aspect-[32/9] min-h-[140px] sm:min-h-[190px] md:min-h-[230px] lg:min-h-[260px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Banner Slides */}
          {activeBanners.map((banner, index) => {
            const isActive = index === currentIndex;
            const targetUrl = banner.targetUrl || "#";
            const isExternal = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");

            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                }`}
                aria-hidden={!isActive}
              >
                <a
                  href={targetUrl}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={() => handleBannerClick(banner)}
                  className="block h-full w-full cursor-pointer overflow-hidden"
                  tabIndex={isActive ? 0 : -1}
                >
                  <img
                    src={banner.bannerImageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.015]"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </a>
              </div>
            );
          })}

          {/* Navigation Controls (when multiple banners exist) */}
          {activeBanners.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-950/85 hover:scale-110 shadow-lg active:scale-95"
                aria-label="Previous banner"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  nextSlide();
                }}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-950/85 hover:scale-110 shadow-lg active:scale-95"
                aria-label="Next banner"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Indicator Pills */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-slate-950/50 backdrop-blur-md px-3 py-1.5 border border-white/10 shadow-md">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? "w-6 bg-emerald-400"
                        : "w-2 bg-white/50 hover:bg-white"
                    }`}
                    aria-label={`Jump to banner ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
