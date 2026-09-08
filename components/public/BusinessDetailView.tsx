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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/businesses" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to businesses
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{business.industry}</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">{business.name}</h1>
        {business.tagline && <p className="mt-1 text-slate-500">{business.tagline}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{business.location}</span>
          {business.yearFounded && <span>Founded {business.yearFounded}</span>}
          <span>Founded by {business.founders} (Class of {business.classYear})</span>
        </div>

        <p className="mt-6 whitespace-pre-line text-sm text-slate-600">{business.about ?? business.description}</p>

        {business.services && business.services.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-slate-900">Services</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {business.services.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={business.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Globe className="h-4 w-4" /> Website
          </a>
          <a href={`mailto:${business.contactEmail}`} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Mail className="h-4 w-4" /> Contact
          </a>
          {business.contactPhone && (
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              <Phone className="h-4 w-4" /> {business.contactPhone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
