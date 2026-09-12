import Link from "next/link";
import { Star, ChevronRight, ArrowUpRight } from "lucide-react";

export interface HomeBusinessItem {
  id: string;
  name: string;
  founders: string;
  classYear: string;
  category: string;
  industry: string;
  description: string;
  location: string;
  image: string | null;
  featured: boolean;
}

export default function HomeBusinessesSection({ businesses }: { businesses: HomeBusinessItem[] }) {
  const featured = businesses.find((b) => b.featured) ?? businesses[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
            Alumni Commerce
          </div>
          <h2 className="mb-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-[34px]">
            Support Alumni-Owned Businesses
          </h2>
          <p className="text-sm text-slate-600 md:text-base">
            Discover and collaborate with ventures founded by your fellow graduates.
          </p>
        </div>
        <Link
          href="/businesses"
          className="group flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-bold text-emerald-700 hover:text-emerald-900 md:text-base"
        >
          <span>View Full Directory</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {featured && (
        <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-xl md:flex-row">
          <div className="relative h-64 min-h-[300px] overflow-hidden md:h-auto md:w-1/2">
            {featured.image ? (
              <img
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={`${featured.name} office`}
                src={featured.image}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-50" />
            )}
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {featured.category && (
                <span className="rounded-full border border-white/20 bg-slate-900/80 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                  {featured.category}
                </span>
              )}
              <span className="rounded-full border border-white/60 bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur-md">
                {featured.industry}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-4 bg-white p-6 md:w-1/2 md:p-10">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
              <span>Featured Alumni Venture</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-emerald-800 sm:text-2xl">
              {featured.name}
            </h3>

            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{featured.description}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-semibold text-slate-500">
              <span>Founded by: <strong className="text-slate-800">{featured.founders}</strong> ({featured.classYear})</span>
              <span>•</span>
              <span>HQ: <strong className="text-slate-800">{featured.location}</strong></span>
            </div>

            <div className="pt-2">
              <Link
                href={`/businesses/${featured.id}`}
                className="flex w-fit items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-800"
              >
                <span>View Company Profile</span>
                <ArrowUpRight className="h-4 w-4 text-white" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
