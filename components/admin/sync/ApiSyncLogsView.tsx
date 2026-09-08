"use client";

import { useAdminSession } from "@/lib/admin/context";
import { useSisSync } from "@/hooks/admin/useSisSync";

export interface SisSyncLogRow {
  id: string;
  timestamp: string;
  node: string;
  operation: string;
  recordsSynced: number;
  status: string;
  latencyMs: number;
}

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "text-tertiary",
  WARNING: "text-secondary",
  ERROR: "text-error",
};

export default function ApiSyncLogsView({ logs }: { logs: SisSyncLogRow[] }) {
  const { can } = useAdminSession();
  const { trigger, triggering, error } = useSisSync();

  return (
    <div className="space-y-space-xl">
      <div className="bg-surface-container-low p-space-lg rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">terminal</span>
            <h2 className="font-headline-lg text-on-surface">IPAM Student Information System (SIS) API Logs</h2>
          </div>
          <p className="font-body-compact text-on-surface-variant mt-1">
            {logs.length} synchronization events with University of Sierra Leone central nodes. Sync is manually
            triggered in this environment (no live SIS integration).
          </p>
        </div>
        {can("SIS_SYNC", "canWrite") && (
          <button
            onClick={() => trigger()}
            disabled={triggering}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            {triggering ? "Syncing…" : "Trigger Sync"}
          </button>
        )}
      </div>

      {error && <p className="font-body-compact text-error">{error}</p>}

      <div className="bg-surface-container rounded-xl shadow-md p-space-lg space-y-space-md">
        <span className="font-headline-sm text-on-surface">Live Event Stream</span>
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-surface-container-low rounded-lg font-code-compact text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant/20"
            >
              <div className="flex items-center gap-3">
                <span className="text-secondary font-bold">[{new Date(log.timestamp).toLocaleString()}]</span>
                <span className="text-primary font-semibold">{log.operation}</span>
                <span className="text-on-surface-variant">{log.node}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-on-surface">{log.recordsSynced} records</span>
                <span className="text-tertiary">{log.latencyMs}ms</span>
                <span className={`font-bold ${STATUS_COLOR[log.status] ?? ""}`}>
                  {log.status === "SUCCESS" ? "✓" : "⚠"} {log.status}
                </span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-on-surface-variant font-body-compact">No sync events yet — trigger one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
