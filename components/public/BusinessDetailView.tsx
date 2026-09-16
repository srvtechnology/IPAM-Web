import Link from "next/link";
import { ArrowLeft, Globe, Mail, Phone, MapPin } from "lucide-react";

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
  yearFounded: number | null;
  companySize: string | null;
  website: string;
  location: string;
  contactEmail: string;
  contactPhone: string | null;
  linkedin: string | null;
  certifications: string[] | null;
}

export default function BusinessDetailView({ business }: { business: BusinessDetail }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-slate-800">
      <Link href="/businesses" className="flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-emerald-700">
        <ArrowLeft className="h-4 w-4 text-slate-500" /> Back to Businesses
      </Link>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="relative h-56 w-full overflow-hidden bg-slate-900 sm:h-64">
          {business.image ? (
            <img src={business.image} alt={business.name} className="h-full w-full object-cover opacity-80" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          {business.logo && (
            <img
              src={business.logo}
              alt={`${business.name} logo`}
              className="absolute bottom-4 left-4 h-14 w-14 rounded-xl border-2 border-white bg-white object-contain shadow-xs sm:bottom-6 sm:left-6"
            />
          )}
        </div>
        <div className="p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{business.industry}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{business.name}</h1>
        {business.tagline && <p className="mt-1 text-slate-500">{business.tagline}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-emerald-600" />{business.location}</span>
          {business.yearFounded && <span>Founded {business.yearFounded}</span>}
          <span>Founded by {business.founders} (Class of {business.classYear})</span>
        </div>

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-600">{business.about ?? business.description}</p>

        {business.services && business.services.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-slate-900">Services</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {business.services.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={business.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50">
            <Globe className="h-4 w-4" /> Website
          </a>
          <a href={`mailto:${business.contactEmail}`} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xs transition-all hover:bg-emerald-700">
            <Mail className="h-4 w-4" /> Contact
          </a>
          {business.contactPhone && (
            <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs">
              <Phone className="h-4 w-4" /> {business.contactPhone}
            </span>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
