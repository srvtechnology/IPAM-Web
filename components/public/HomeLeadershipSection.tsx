"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, Sparkles, LayoutGrid, SlidersHorizontal } from "lucide-react";
import LeadershipModal, { type LeadershipModalMember } from "@/components/public/LeadershipModal";

export default function HomeLeadershipSection({ leaders }: { leaders: LeadershipModalMember[] }) {
  const [selected, setSelected] = useState<LeadershipModalMember | null>(null);
  const [isGridView, setIsGridView] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [leaders, isGridView]);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }

  if (leaders.length === 0) return null;

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
      {/* Section Header */}
      <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Executive Council</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Meet Our Global Leadership
          </h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Dedicated alumni executives serving our global community and driving strategic initiatives for future generations.
          </p>
        </div>

        {/* View Controls & Carousel Buttons */}
        <div className="flex items-center gap-2 self-center sm:self-end">
          {leaders.length > 4 && (
            <button
              type="button"
              onClick={() => setIsGridView((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800"
              title={isGridView ? "Switch to Carousel view" : "View all leaders in grid"}
            >
              {isGridView ? (
                <>
                  <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Carousel View</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
                  <span>View All ({leaders.length})</span>
                </>
              )}
            </button>
          )}

          {!isGridView && leaders.length > 4 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition-all hover:border-emerald-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Previous leaders"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition-all hover:border-emerald-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Next leaders"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid View Mode */}
      {isGridView ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
          {leaders.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelected(l)}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
            >
              <div>
                <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-600 bg-slate-100 shadow-xs transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28">
                  {l.image ? (
                    <img src={l.image} alt={l.role} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-emerald-700">
                      {l.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-colors group-hover:bg-slate-900/60">
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                      View Profile
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                  {l.name}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-emerald-700">{l.role}</p>
                <span className="mt-1.5 inline-block rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                  {l.classYear}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1 border-t border-slate-200/80 pt-3 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                <span>Read Bio &amp; Vision</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Scrollable Carousel Mode */
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth pb-4 pt-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {leaders.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelected(l)}
                className="group flex flex-col justify-between w-[250px] sm:w-[280px] shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-600 bg-slate-100 shadow-xs transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28">
                    {l.image ? (
                      <img src={l.image} alt={l.role} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-emerald-700">
                        {l.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-colors group-hover:bg-slate-900/60">
                      <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                        View Profile
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                    {l.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700">{l.role}</p>
                  <span className="mt-1.5 inline-block rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                    {l.classYear}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1 border-t border-slate-200/80 pt-3 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                  <span>Read Bio &amp; Vision</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Bottom view all toggle prompt if more than 4 leaders */}
          {leaders.length > 4 && (
            <div className="mt-4 flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsGridView(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>View all {leaders.length} executive leaders in grid</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leadership Profile Modal */}
      <LeadershipModal leader={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
