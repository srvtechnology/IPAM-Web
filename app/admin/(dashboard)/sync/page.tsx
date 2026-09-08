import { db } from "@/lib/db";
import ApiSyncLogsView from "@/components/admin/sync/ApiSyncLogsView";

export default async function SyncPage() {
  const logs = await db.sisSyncLog.findMany({ orderBy: { timestamp: "desc" }, take: 200 });

  return (
    <ApiSyncLogsView
      logs={logs.map((l) => ({
        id: l.id,
        timestamp: l.timestamp.toISOString(),
        node: l.node,
        operation: l.operation,
        recordsSynced: l.recordsSynced,
        status: l.status,
        latencyMs: l.latencyMs,
      }))}
    />
  );
}
