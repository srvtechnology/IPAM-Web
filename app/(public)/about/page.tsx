import { db } from "@/lib/db";

export default async function AboutPage() {
  const leaders = await db.leadershipMember.findMany({ include: { initiatives: true } });
  const alumniCount = await db.alumniMember.count();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900">About the IPAM Alumni Association</h1>
      <p className="mt-4 text-slate-600">
        The Institute of Public Administration and Management (IPAM), University of Sierra Leone, has produced
        generations of public administrators, business leaders, and civic innovators. The IPAM Alumni Association
        exists to keep that community connected — across careers, continents, and time — through mentorship,
        networking, career opportunities, and shared investment in the Institute&apos;s future.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div>
          <p className="text-2xl font-black text-emerald-700">{alumniCount}+</p>
          <p className="text-xs text-slate-500">Alumni Network</p>
        </div>
        <div>
          <p className="text-2xl font-black text-emerald-700">{leaders.length}</p>
          <p className="text-xs text-slate-500">Executive Leaders</p>
        </div>
        <div>
          <p className="text-2xl font-black text-emerald-700">Global</p>
          <p className="text-xs text-slate-500">Reach</p>
        </div>
      </div>

      {leaders.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">Leadership</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {leaders.map((l) => (
              <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">{l.name}</h3>
                <p className="text-sm text-emerald-700">{l.role} · Class of {l.classYear}</p>
                <p className="mt-2 text-sm text-slate-500">{l.bio}</p>
                {l.initiatives.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                    {l.initiatives.map((i) => <li key={i.id}>{i.title}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
