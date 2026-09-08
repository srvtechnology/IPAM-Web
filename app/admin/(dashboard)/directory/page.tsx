import { db } from "@/lib/db";
import AlumniDirectoryView from "@/components/admin/directory/AlumniDirectoryView";

export default async function DirectoryPage() {
  const records = await db.alumniRecord.findMany({ orderBy: { dateRegistered: "desc" } });

  return (
    <AlumniDirectoryView
      records={records.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        initials: r.initials,
        regNo: r.regNo,
        degree: r.degree,
        faculty: r.faculty,
        gradYear: r.gradYear,
        authStatus: r.authStatus,
        role: r.role,
        status: r.status,
        phone: r.phone,
        digitalPassIssued: r.digitalPassIssued,
        dateRegistered: r.dateRegistered.toISOString(),
      }))}
    />
  );
}
