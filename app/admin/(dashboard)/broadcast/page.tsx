import { db } from "@/lib/db";
import OmnichannelBroadcastView from "@/components/admin/broadcast/OmnichannelBroadcastView";

export default async function BroadcastPage() {
  const [templates, audienceGroups, records] = await Promise.all([
    db.broadcastMessageTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    db.targetAudienceGroup.findMany({ orderBy: { createdAt: "desc" } }),
    db.broadcastRecord.findMany({ orderBy: { date: "desc" }, take: 20 }),
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
      }))}
      audienceGroups={audienceGroups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        estimatedCount: g.estimatedCount,
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
    />
  );
}
