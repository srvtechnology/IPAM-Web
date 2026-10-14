"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Globe,
  ShieldCheck,
  Search,
  GraduationCap,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import { DEFAULT_HERO_SLIDES, type HeroSlide } from "@/lib/hero-slides";

export default function HomeHeroSection({
  slides: initialSlides,
}: {
  slides?: HeroSlide[];
}) {
  const { session } = useApp();
  const router = useRouter();

  const slides = (initialSlides && initialSlides.length > 0
    ? initialSlides.filter((s) => s.active !== false)
    : DEFAULT_HERO_SLIDES.filter((s) => s.active !== false)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  const SLIDE_DURATION = 5500; // 5.5 seconds

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  }, []);

  // Autoplay timer with progress bar
  useEffect(() => {
    if (!isPlaying || isHovered || slides.length <= 1) return;

    const intervalTime = 50; // update progress every 50ms
    const step = (intervalTime / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, slides.length, nextSlide]);

  function handleRegisterClick() {
    router.push(session ? "/directory" : "/register");
  }

  const currentSlide = slides[currentIndex] || slides[0] || DEFAULT_HERO_SLIDES[0];

  // Helper to format headline titles with gradient accents
  function renderTitle(title: string) {
    if (!title) return "Connect. Empower. Excel.";
    if (title.includes("Empower")) {
      return (
        <>
          Connect.{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
            Empower.
          </span>{" "}
          Excel.
        </>
      );
    }
    if (title.includes("Legacy")) {
      return (
        <>
          Celebrate{" "}
          <span className="bg-gradient-to-r from-amber-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Legacy.
          </span>{" "}
          Inspire Tomorrow.
        </>
      );
    }
    if (title.includes("Digital")) {
      return (
        <>
          Driving Africa&apos;s{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            Digital
          </span>{" "}
          Frontier.
        </>
      );
    }
    if (title.includes("Stronger")) {
      return (
        <>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
            Stronger
          </span>{" "}
          Together Across 45+ Nations.
        </>
      );
    }
    return title;
  }

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex min-h-[600px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[660px]"
    >
      {/* Background Images Carousel with smooth crossfade */}
      <div className="absolute inset-0 z-0 select-none">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.altText || slide.title || "IPAM Alumni Hero Image"}
                className={`h-full w-full object-cover object-center transform transition-transform duration-10000 ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              />
              {/* Gradient Scrims for text contrast and premium glass aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/60" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
            </div>
          );
        })}
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
        <div className="max-w-3xl space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-bold tracking-wide text-emerald-300 shadow-sm backdrop-blur-md transition-all">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="uppercase truncate">
              {currentSlide.badge || "University of Sierra Leone • IPAM Global Network"}
            </span>
          </div>

          {/* Dynamic Headlines */}
          <div className="space-y-2">
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl transition-all duration-500">
              {renderTitle(currentSlide.title)}
            </h1>
            <p className="text-xl font-bold tracking-tight text-slate-200 sm:text-2xl transition-all duration-500">
              {currentSlide.subtitle || "The Official Association for IPAM Graduates Worldwide"}
            </p>
          </div>

          <p className="max-w-2xl text-base font-normal leading-relaxed text-slate-300 sm:text-lg">
            Uniting over 15,000 public servants, enterprise executives, chartered accountants, and tech pioneers
            across 45+ countries. Access verified credentials, executive mentoring, and exclusive career
            opportunities.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <button
              onClick={handleRegisterClick}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-600/30 active:scale-95"
            >
              <span>{currentSlide.ctaText || "Join Alumni Network"}</span>
              <ArrowRight className="h-4 w-4 text-slate-950" />
            </button>

            <Link
              href="/jobs"
              className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-5 py-3.5 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-slate-800 active:scale-95 sm:px-6"
            >
              <Briefcase className="h-4 w-4 text-emerald-400" />
              <span>Explore Careers</span>
            </Link>

            <Link
              href="/directory"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white active:scale-95"
            >
              <Search className="h-4 w-4 text-emerald-300" />
              <span>Find Classmates</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">15,000+</p>
                <p className="text-[11px] text-slate-400">Global Alumni</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">45+ Nations</p>
                <p className="text-[11px] text-slate-400">Active Chapters</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <Building2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Est. 1980</p>
                <p className="text-[11px] text-slate-400">Freetown, SL</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Verified</p>
                <p className="text-[11px] text-slate-400">Registrar Records</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Left & Right Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/70 text-white backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-110 hover:border-emerald-500/60 hover:bg-slate-900 hover:text-emerald-300 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/70 text-white backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-110 hover:border-emerald-500/60 hover:bg-slate-900 hover:text-emerald-300 active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Bottom Floating Control Dock */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-950/80 px-4 py-2 shadow-2xl backdrop-blur-md">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying((v) => !v)}
            aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
            className="text-slate-400 hover:text-emerald-300 transition-colors p-0.5"
            title={isPlaying ? "Pause carousel" : "Play carousel"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          <div className="h-3 w-px bg-slate-800" />

          {/* Slide Indicator Dots / Expanding Pills */}
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className="group/btn relative py-1 focus:outline-none"
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-8 bg-emerald-400 shadow-sm shadow-emerald-500/50"
                        : "w-2 bg-slate-600 hover:bg-slate-400"
                    }`}
                  />
                  {/* Miniature progress track on active pill */}
                  {isActive && isPlaying && !isHovered && (
                    <div
                      className="absolute inset-y-1 left-0 rounded-full bg-emerald-200/40"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Slide Counter e.g. "01 / 04" */}
          <span className="font-mono text-[11px] font-bold text-slate-400">
            {String(currentIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Floating Location / Caption Badge (bottom-right on md+) */}
      {currentSlide.caption && (
        <div className="hidden lg:flex absolute bottom-5 right-6 z-30 items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur-md shadow-xl transition-all duration-300">
          <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white/90 truncate max-w-sm">
            {currentSlide.caption}
          </span>
        </div>
      )}

      {/* Interactive Floating Thumbnail Quick-Picker (top-right on xl+) */}
      {slides.length > 1 && (
        <div className="hidden xl:flex absolute top-6 right-6 z-30 items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-1.5 shadow-2xl backdrop-blur-md">
          {slides.map((s, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => goToSlide(idx)}
                title={s.title}
                className={`relative h-10 w-16 overflow-hidden rounded-lg border transition-all duration-200 ${
                  isActive
                    ? "border-emerald-400 ring-2 ring-emerald-500/50 scale-105"
                    : "border-slate-800 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
