import { db } from "@/lib/db";
import OmnichannelBroadcastView from "@/components/admin/broadcast/OmnichannelBroadcastView";

export default async function BroadcastPage() {
  const [templates, audienceGroups, records, alumniRecords] = await Promise.all([
    db.broadcastMessageTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    db.targetAudienceGroup.findMany({ orderBy: { createdAt: "desc" } }),
    db.broadcastRecord.findMany({ orderBy: { date: "desc" }, take: 20 }),
    db.alumniRecord.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        regNo: true,
        faculty: true,
        gradYear: true,
        avatarUrl: true,
        initials: true,
        digitalPassIssued: true,
        phone: true,
      },
    }),
  ]);

  return (
    <OmnichannelBroadcastView
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        message: t.message,
        channels: t.channels as string[],
        type: t.type,
        category: t.category,
        priority: t.priority,
        actionUrl: t.actionUrl,
      }))}
      audienceGroups={audienceGroups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        estimatedCount: g.estimatedCount,
        criteria: g.criteria as any,
      }))}
      records={records.map((r) => ({
        id: r.id,
        title: r.title,
        audienceLabel: r.audienceLabel,
        recipientsCount: r.recipientsCount,
        channels: r.channels as string[],
        status: r.status,
        deliveryRate: r.deliveryRate,
        cost: r.cost,
        date: r.date.toISOString(),
      }))}
      alumni={alumniRecords.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        regNo: a.regNo,
        faculty: a.faculty,
        gradYear: a.gradYear,
        avatarUrl: a.avatarUrl,
        initials: a.initials,
        digitalPassIssued: a.digitalPassIssued,
      }))}
    />
  );
}
