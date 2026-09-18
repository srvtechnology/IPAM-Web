"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  Calendar,
  Users,
  ShieldCheck,
  ChevronRight,
  Briefcase,
  Star,
  Check,
  Factory,
  Zap,
  Sun,
  Laptop,
} from "lucide-react";

export interface BusinessDetail {
  id: string;
  name: string;
  founders: string;
  classYear: string;
  category: string;
  industry: string;
  tagline: string | null;
  description: string;
  about: string | null;
  image: string | null;
  logo: string | null;
  services: string[] | null;
  keyProducts: { name: string; description: string }[] | null;
  yearFounded: number | null;
  companySize: string | null;
  website: string;
  location: string;
  contactEmail: string;
  contactPhone: string | null;
  certifications: string[] | null;
  featured: boolean;
}

export interface RelatedBusiness {
  id: string;
  name: string;
  image: string | null;
  category: string;
  classYear: string;
  description: string;
  location: string;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "SaaS & Software":
      return <Laptop className="h-4 w-4" />;
    case "Manufacturing":
      return <Factory className="h-4 w-4" />;
    case "Electrical Solutions":
      return <Zap className="h-4 w-4" />;
    case "CleanTech & Energy":
      return <Sun className="h-4 w-4" />;
    case "Consulting & Advisory":
      return <Briefcase className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}

export default function BusinessDetailView({
  business,
  relatedBusinesses,
}: {
  business: BusinessDetail;
  relatedBusinesses: RelatedBusiness[];
}) {
  const [copiedShare, setCopiedShare] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // clipboard unavailable — silently ignore, share button just won't confirm
    }
  }

  return (
    <div className="min-h-screen pb-20 text-slate-800">
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link
            href="/businesses"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 transition-colors hover:text-emerald-700 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            <span>Back to Businesses</span>
          </Link>

          <div className="hidden items-center gap-2 truncate text-xs font-semibold text-slate-500 md:flex">
            <Link href="/" className="transition-colors hover:text-emerald-700">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/businesses" className="transition-colors hover:text-emerald-700">
              Alumni Businesses
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="max-w-xs truncate font-bold text-slate-900">{business.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Share Business Page"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 sm:px-3 sm:py-1.5"
            >
              {copiedShare ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="hidden text-emerald-700 sm:inline">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-slate-500" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <a
              href={business.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-98"
            >
              <span>Visit Website</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="relative h-48 w-full overflow-hidden bg-slate-900 sm:h-64 lg:h-72">
            {business.image && (
              <img src={business.image} alt={business.name} className="h-full w-full object-cover opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

            <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
              <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-md">
                {getCategoryIcon(business.category)}
                <span>{business.category}</span>
              </span>
              {business.featured && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                  <Star className="h-3 w-3 fill-white" /> Featured Alumni Venture
                </span>
              )}
            </div>

            <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white/95 px-3 py-1 text-xs font-bold text-emerald-800 shadow-xs backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Verified Alumni Enterprise</span>
              </span>
            </div>

            {business.logo && (
              <img
                src={business.logo}
                alt={`${business.name} logo`}
                className="absolute bottom-4 right-4 h-14 w-14 rounded-xl border-2 border-white bg-white object-contain shadow-xs sm:bottom-6 sm:right-6"
              />
            )}

            <div className="absolute bottom-4 left-4 right-4 space-y-1.5 text-white sm:bottom-6 sm:left-6">
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400 sm:text-sm">
                {business.industry}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-xs sm:text-3xl lg:text-4xl">
                {business.name}
              </h1>
              {business.tagline && (
                <p className="max-w-2xl text-xs font-medium text-slate-200 drop-shadow-xs sm:text-sm">{business.tagline}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-600 shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Founders</span>
                <span className="block truncate text-xs font-bold text-slate-900 sm:text-sm">{business.founders}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-600 shadow-xs">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Class Year</span>
                <span className="block text-xs font-bold text-slate-900 sm:text-sm">{business.classYear}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-600 shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Headquarters</span>
                <span className="block truncate text-xs font-bold text-slate-900 sm:text-sm">{business.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-600 shadow-xs">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Established</span>
                <span className="block text-xs font-bold text-slate-900 sm:text-sm">
                  {business.yearFounded ? `Est. ${business.yearFounded}` : "Active Enterprise"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">About the Company</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{business.about || business.description}</p>
              {business.about && business.description !== business.about && (
                <p className="border-t border-slate-100 pt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
                  {business.description}
                </p>
              )}
            </div>

            {business.services && business.services.length > 0 && (
              <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Core Services & Capabilities</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{business.services.length} Specialized Offerings</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {business.services.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <span className="text-xs font-bold leading-snug text-slate-800 sm:text-sm">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {business.keyProducts && business.keyProducts.length > 0 && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Flagship Products & Solutions</h2>
                </div>

                <div className="space-y-3">
                  {business.keyProducts.map((prod, idx) => (
                    <div
                      key={idx}
                      className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-emerald-300"
                    >
                      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <span>{prod.name}</span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Proprietary
                        </span>
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{prod.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <Users className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Founders & Alumni Background</h2>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-base font-bold text-white shadow-xs">
                    {business.founders.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{business.founders}</h4>
                    <p className="text-xs font-semibold text-slate-500">
                      IPAM Alumni • <span className="font-bold text-emerald-700">{business.classYear}</span>
                    </p>
                  </div>
                </div>

                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  Alumni Founder in Good Standing
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Connect directly with fellow graduates to discuss business supply contracts, technical consulting, joint
                ventures, or strategic supplier arrangements.
              </p>
            </div>

            {business.certifications && business.certifications.length > 0 && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Industry Standards & Certifications</h2>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {business.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{cert}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">Company Overview</h3>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Sector & Category
                  </span>
                  <span className="font-bold text-slate-900">{business.category}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Specialization
                  </span>
                  <span className="font-bold text-slate-900">{business.industry}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Company Size
                  </span>
                  <span className="font-bold text-slate-900">{business.companySize || "Private Enterprise"}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Headquarters
                  </span>
                  <span className="font-bold text-slate-900">{business.location}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Official Website
                  </span>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 truncate pt-0.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{business.website.replace("https://", "")}</span>
                  </a>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Direct Business Email
                  </span>
                  <a
                    href={`mailto:${business.contactEmail}`}
                    className="flex items-center gap-1 truncate pt-0.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{business.contactEmail}</span>
                  </a>
                </div>

                {business.contactPhone && (
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Telephone / Inquiries
                    </span>
                    <a
                      href={`tel:${business.contactPhone}`}
                      className="flex items-center gap-1 pt-0.5 font-bold text-slate-800 hover:text-emerald-700"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{business.contactPhone}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Get in Touch</h3>
                <p className="text-xs text-slate-500">
                  Reach the team at {business.name} directly for quotations, supplier partnerships, or advisory.
                </p>
              </div>

              <div className="space-y-2.5">
                <a
                  href={`mailto:${business.contactEmail}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-98"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email {business.name}</span>
                </a>
                {business.contactPhone && (
                  <a
                    href={`tel:${business.contactPhone}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call {business.contactPhone}</span>
                  </a>
                )}
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Visit Website</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {relatedBusinesses.length > 0 && (
          <div className="space-y-6 border-t border-slate-200 pt-8">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-emerald-700">Founders Network</span>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Explore More Alumni Enterprises</h2>
              </div>
              <Link
                href="/businesses"
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 sm:text-sm"
              >
                <span>View Full Directory</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedBusinesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/businesses/${biz.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
                >
                  <div>
                    <div className="relative h-40 overflow-hidden bg-slate-100">
                      {biz.image && (
                        <img
                          src={biz.image}
                          alt={biz.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 backdrop-blur-md">
                        {biz.category}
                      </span>
                      <span className="absolute right-3 top-3 rounded-full border border-emerald-200 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {biz.classYear}
                      </span>
                    </div>

                    <div className="space-y-2 p-5">
                      <h4 className="line-clamp-1 text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                        {biz.name}
                      </h4>
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{biz.description}</p>
                      <div className="flex items-center gap-1 pt-2 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        <span className="truncate">{biz.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                      <span>View Company Profile</span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
