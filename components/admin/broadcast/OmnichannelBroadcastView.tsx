"use client";

import { useState } from "react";
import { useAdminSession } from "@/lib/admin/context";
import { useBroadcast } from "@/hooks/admin/useBroadcast";
import CreateTemplateModal from "./CreateTemplateModal";
import CreateAudienceGroupModal from "./CreateAudienceGroupModal";

export interface TemplateRow {
  id: string;
  name: string;
  title: string;
  message: string;
  channels: string[];
  type: string;
}
export interface AudienceGroupRow {
  id: string;
  name: string;
  description: string;
  estimatedCount: number | null;
}
export interface BroadcastRecordRow {
  id: string;
  title: string;
  audienceLabel: string;
  recipientsCount: number;
  channels: string[];
  status: string;
  deliveryRate: string | null;
  cost: string | null;
  date: string;
}

export default function OmnichannelBroadcastView({
  templates,
  audienceGroups,
  records,
}: {
  templates: TemplateRow[];
  audienceGroups: AudienceGroupRow[];
  records: BroadcastRecordRow[];
}) {
  const { can } = useAdminSession();
  const { sendBroadcast, deleteTemplate, deleteAudienceGroup, loading, error } = useBroadcast();
  const [templateOpen, setTemplateOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedAudience, setSelectedAudience] = useState<string>("");

  const canWrite = can("BROADCAST", "canWrite");
  const canDelete = can("BROADCAST", "canDelete");

  async function handleSend() {
    const template = templates.find((t) => t.id === selectedTemplate);
    const audience = audienceGroups.find((a) => a.id === selectedAudience);
    if (!template || !audience) return;
    await sendBroadcast({
      type: template.type,
      title: template.title,
      message: template.message,
      channels: template.channels,
      audienceLabel: audience.name,
      recipientsCount: audience.estimatedCount ?? 0,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-on-surface">Omnichannel Broadcast</h1>
          <p className="font-body-default text-on-surface-variant mt-1">
            Compose and dispatch messages across SMS, WhatsApp, Email and Push.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-4">
        <h2 className="font-headline-sm text-on-surface mb-3">Compose &amp; Send</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="font-body-compact text-on-surface-variant">
            Template
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none"
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Audience
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none"
            >
              <option value="">Select an audience…</option>
              {audienceGroups.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.estimatedCount ?? "—"})
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            {canWrite && (
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !selectedTemplate || !selectedAudience}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {loading ? "Sending…" : "Send Broadcast"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Templates & Audiences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-surface-container border border-outline-variant/20">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <h2 className="font-headline-sm text-on-surface">Message Templates</h2>
            {canWrite && (
              <button
                type="button"
                onClick={() => setTemplateOpen(true)}
                className="font-body-compact text-primary hover:underline"
              >
                + New template
              </button>
            )}
          </div>
          <div className="divide-y divide-outline-variant/10 max-h-80 overflow-y-auto">
            {templates.length === 0 && (
              <p className="px-4 py-6 font-body-compact text-on-surface-variant">No templates yet.</p>
            )}
            {templates.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body-medium text-on-surface truncate">{t.name}</p>
                  <p className="font-body-compact text-on-surface-variant truncate">
                    {t.channels.join(", ")}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteTemplate(t.id)}
                    className="text-on-surface-variant hover:text-error flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container border border-outline-variant/20">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <h2 className="font-headline-sm text-on-surface">Audience Groups</h2>
            {canWrite && (
              <button
                type="button"
                onClick={() => setAudienceOpen(true)}
                className="font-body-compact text-primary hover:underline"
              >
                + New group
              </button>
            )}
          </div>
          <div className="divide-y divide-outline-variant/10 max-h-80 overflow-y-auto">
            {audienceGroups.length === 0 && (
              <p className="px-4 py-6 font-body-compact text-on-surface-variant">No audience groups yet.</p>
            )}
            {audienceGroups.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body-medium text-on-surface truncate">{a.name}</p>
                  <p className="font-body-compact text-on-surface-variant truncate">{a.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-code-compact text-on-surface-variant">{a.estimatedCount ?? "—"}</span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteAudienceGroup(a.id)}
                      className="text-on-surface-variant hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl bg-surface-container border border-outline-variant/20">
        <div className="px-4 py-3 border-b border-outline-variant/20">
          <h2 className="font-headline-sm text-on-surface">Broadcast History</h2>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {records.length === 0 && (
            <p className="px-4 py-6 font-body-compact text-on-surface-variant">No broadcasts sent yet.</p>
          )}
          {records.map((r) => (
            <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-body-medium text-on-surface truncate">{r.title}</p>
                <p className="font-body-compact text-on-surface-variant truncate">
                  {r.audienceLabel} &middot; {r.recipientsCount} recipients &middot; {r.channels.join(", ")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-label-badge px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                  {r.status}
                </span>
                <p className="font-code-compact text-on-surface-variant mt-1">
                  {r.deliveryRate} &middot; {r.cost}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {templateOpen && <CreateTemplateModal onClose={() => setTemplateOpen(false)} />}
      {audienceOpen && <CreateAudienceGroupModal onClose={() => setAudienceOpen(false)} />}
    </div>
  );
}
