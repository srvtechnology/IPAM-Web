import { getAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function AdminOverviewPage() {
  const session = await getAdminSession();
  const admin = session
    ? await db.adminUser.findUnique({ where: { id: session.sub }, include: { role: true } })
    : null;

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-white">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      <p className="mt-2 text-slate-400">
        Milestone 2 placeholder — full dashboard is ported in a later milestone.
      </p>
      {admin && (
        <div className="mt-6 rounded-xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <p className="text-sm text-slate-400">Signed in as</p>
          <p className="text-lg font-semibold">{admin.name}</p>
          <p className="text-sm text-slate-400">{admin.email}</p>
          <p className="mt-2 inline-block rounded-full bg-indigo-950 px-3 py-1 text-xs font-medium text-indigo-300">
            {admin.role.name}
          </p>
        </div>
      )}
    </main>
  );
}
