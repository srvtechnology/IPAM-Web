"use client";

import { useMemo, useState } from "react";
import AuditDetailModal from "./AuditDetailModal";

export interface AuditLogRow {
  id: string;
  displayId: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  actionLabel: string;
  category: string;
  target: string;
  targetType: string | null;
  status: string;
  severity: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  details: string;
  beforeState: unknown;
  afterState: unknown;
  tamperHash: string;
}

const CATEGORIES = [
  "SECURITY_RBAC",
  "ALUMNI_VERIFICATION",
  "SMART_ID_BUREAU",
  "OMNICHANNEL_BROADCAST",
  "COMMERCIAL_FINANCE",
  "SYSTEM_CORE",
];
const SEVERITIES = ["INFO", "NOTICE", "WARNING", "CRITICAL"];

const SEVERITY_COLOR: Record<string, string> = {
  INFO: "bg-surface-container-highest text-on-surface-variant",
  NOTICE: "bg-primary-container text-on-primary-container font-medium",
  WARNING: "bg-tertiary text-on-tertiary font-semibold",
  CRITICAL: "bg-error text-on-error font-bold",
};

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "bg-secondary/15 text-secondary border-secondary/30",
  FLAGGED: "bg-tertiary/20 text-tertiary border-tertiary/40",
  WARNING: "bg-tertiary/15 text-tertiary border-tertiary/30",
  BLOCKED_RBAC_VIOLATION: "bg-error/20 text-error border-error/40 animate-pulse",
};

const CATEGORY_ICON: Record<string, string> = {
  SECURITY_RBAC: "admin_panel_settings",
  ALUMNI_VERIFICATION: "verified_user",
  SMART_ID_BUREAU: "badge",
  OMNICHANNEL_BROADCAST: "campaign",
  COMMERCIAL_FINANCE: "account_balance",
  SYSTEM_CORE: "terminal",
};

export default function AuditTrailsView({ entries }: { entries: AuditLogRow[] }) {
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  const stats = useMemo(() => {
    const total = entries.length;
    const rbacEvents = entries.filter((e) => e.category === "SECURITY_RBAC").length;
    const verificationEvents = entries.filter((e) => e.category === "ALUMNI_VERIFICATION").length;
    const blockedEvents = entries.filter((e) => e.status === "BLOCKED_RBAC_VIOLATION").length;
    return { total, rbacEvents, verificationEvents, blockedEvents };
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (category && e.category !== category) return false;
      if (severity && e.severity !== severity) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !e.actorName.toLowerCase().includes(needle) &&
          !e.actorEmail.toLowerCase().includes(needle) &&
          !e.target.toLowerCase().includes(needle) &&
          !e.actionLabel.toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [entries, category, severity, q]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-headline-lg text-on-surface">Audit Trails & Security</h1>
        <p className="font-body-default text-on-surface-variant mt-1">
          {entries.length} tamper-evident event records across every governed module
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">history_edu</span>
          </div>
          <div>
            <div className="text-[10px] font-table-header uppercase text-on-surface-variant tracking-wider">
              Total Logged Events
            </div>
            <div className="font-headline-lg text-on-surface font-bold text-[20px]">{stats.total}</div>
          </div>
        </div>
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          </div>
          <div>
            <div className="text-[10px] font-table-header uppercase text-on-surface-variant tracking-wider">
              Security &amp; RBAC Actions
            </div>
            <div className="font-headline-lg text-on-surface font-bold text-[20px]">{stats.rbacEvents}</div>
          </div>
        </div>
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div>
            <div className="text-[10px] font-table-header uppercase text-on-surface-variant tracking-wider">
              Verification Sign-offs
            </div>
            <div className="font-headline-lg text-on-surface font-bold text-[20px]">{stats.verificationEvents}</div>
          </div>
        </div>
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-error/15 text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">gpp_bad</span>
          </div>
          <div>
            <div className="text-[10px] font-table-header uppercase text-on-surface-variant tracking-wider">
              Blocked Violations
            </div>
            <div className="font-headline-lg text-error font-bold text-[20px]">{stats.blockedEvents}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actor, target, action…"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-body-compact"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-body-compact"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-body-compact"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface-container-low rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-surface-container-lowest/60 font-table-header uppercase text-on-surface-variant">
              <tr>
                <th className="text-left px-4 py-2.5">Event</th>
                <th className="text-left px-4 py-2.5">Actor</th>
                <th className="text-left px-4 py-2.5">Category</th>
                <th className="text-left px-4 py-2.5">Severity</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-left px-4 py-2.5">Timestamp</th>
                <th className="text-left px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-outline-variant/20 hover:bg-surface-container-high/40 cursor-pointer"
                  onClick={() => setSelected(e)}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-body-medium text-on-surface">{e.actionLabel}</p>
                    <p className="font-code-compact text-[10px] text-on-surface-variant">{e.displayId}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {e.actorName.charAt(0)}
                      </div>
                      <span className="text-on-surface-variant">{e.actorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-outline">
                        {CATEGORY_ICON[e.category] ?? "history_edu"}
                      </span>
                      {e.category.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded font-table-header text-[10px] ${SEVERITY_COLOR[e.severity] ?? ""}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-code-compact border ${
                        STATUS_COLOR[e.status] ?? "bg-surface-container-highest text-on-surface border-outline-variant/30"
                      }`}
                    >
                      {e.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-on-surface-variant">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      chevron_right
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    No matching audit entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <AuditDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
