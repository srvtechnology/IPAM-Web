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
  category?: string | null;
  priority?: string | null;
  actionUrl?: string | null;
  eventDate?: string | Date | null;
  eventVenue?: string | null;
  rsvpDeadline?: string | Date | null;
}

export interface AudienceGroupRow {
  id: string;
  name: string;
  description: string;
  estimatedCount: number | null;
  criteria?: {
    faculties?: string[];
    cohorts?: string[];
    authStatuses?: string[];
    chapter?: string;
    digitalPassOnly?: boolean;
    userIds?: string[];
    selectAll?: boolean;
    [key: string]: unknown;
  } | null;
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

export interface BroadcastAlumniItem {
  id: string;
  name: string;
  email: string;
  regNo: string;
  faculty: string;
  gradYear: number;
  avatarUrl?: string | null;
  initials?: string | null;
  digitalPassIssued?: boolean;
  phone?: string | null;
}

const CHANNEL_STYLE: Record<string, string> = {
  SMS: "bg-primary/15 text-primary",
  WHATSAPP: "bg-secondary/15 text-secondary",
  EMAIL: "bg-tertiary/15 text-tertiary",
  PUSH: "bg-error/15 text-error",
};

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded font-code-compact text-[10px] font-semibold ${
        CHANNEL_STYLE[channel] ?? "bg-surface-container-highest text-on-surface-variant"
      }`}
    >
      {channel}
    </span>
  );
}

export default function OmnichannelBroadcastView({
  templates,
  audienceGroups,
  records,
  alumni = [],
}: {
  templates: TemplateRow[];
  audienceGroups: AudienceGroupRow[];
  records: BroadcastRecordRow[];
  alumni?: BroadcastAlumniItem[];
}) {
  const { can } = useAdminSession();
  const { sendBroadcast, deleteTemplate, deleteAudienceGroup, loading, error } = useBroadcast();

  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);

  const [audienceOpen, setAudienceOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState<AudienceGroupRow | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "template" | "audience";
    id: string;
    name: string;
  } | null>(null);

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
      priority: template.priority ?? "NORMAL",
      actionUrl: template.actionUrl ?? null,
      eventDate: template.eventDate ?? null,
      eventVenue: template.eventVenue ?? null,
      rsvpDeadline: template.rsvpDeadline ?? null,
    });
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "template") {
      await deleteTemplate(deleteConfirm.id);
      if (selectedTemplate === deleteConfirm.id) setSelectedTemplate("");
    } else {
      await deleteAudienceGroup(deleteConfirm.id);
      if (selectedAudience === deleteConfirm.id) setSelectedAudience("");
    }
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">campaign</span>
            <h1 className="font-headline-lg text-on-surface">Omnichannel Broadcast</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1">
            Compose and dispatch messages across SMS, Email and Push.
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
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
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
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
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
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-on-secondary px-4 py-2 font-body-medium font-semibold shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
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
        {/* Message Templates Card */}
        <div className="rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">drafts</span>
              <h2 className="font-headline-sm text-on-surface">Message Templates</h2>
              <span className="font-code-compact text-xs text-on-surface-variant">({templates.length})</span>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateOpen(true);
                }}
                className="font-body-compact text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New template
              </button>
            )}
          </div>
          <div className="divide-y divide-outline-variant/10 max-h-80 overflow-y-auto flex-1">
            {templates.length === 0 && (
              <p className="px-4 py-8 text-center font-body-compact text-on-surface-variant">
                No templates yet. Click &quot;+ New template&quot; to create one.
              </p>
            )}
            {templates.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-container-high/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-body-medium text-on-surface truncate font-medium">{t.name}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {t.channels.map((ch) => (
                      <ChannelBadge key={ch} channel={ch} />
                    ))}
                    <span className="text-[10px] font-code-compact px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                      {t.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(t);
                        setTemplateOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                      title="Edit template"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: "template", id: t.id, name: t.name })}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Delete template"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Groups Card */}
        <div className="rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">groups</span>
              <h2 className="font-headline-sm text-on-surface">Audience Groups</h2>
              <span className="font-code-compact text-xs text-on-surface-variant">({audienceGroups.length})</span>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => {
                  setEditingAudience(null);
                  setAudienceOpen(true);
                }}
                className="font-body-compact text-secondary hover:underline flex items-center gap-1 font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New group
              </button>
            )}
          </div>
          <div className="divide-y divide-outline-variant/10 max-h-80 overflow-y-auto flex-1">
            {audienceGroups.length === 0 && (
              <p className="px-4 py-8 text-center font-body-compact text-on-surface-variant">
                No audience groups yet. Click &quot;+ New group&quot; to create one.
              </p>
            )}
            {audienceGroups.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-container-high/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-body-medium text-on-surface truncate font-medium">{a.name}</p>
                  <p className="font-body-compact text-on-surface-variant truncate">{a.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-code-compact text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded text-xs">
                    {a.estimatedCount ?? "—"} recipients
                  </span>
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAudience(a);
                        setAudienceOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-colors"
                      title="Edit audience group"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: "audience", id: a.id, name: a.name })}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Delete audience group"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
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
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-[20px]">history</span>
          <h2 className="font-headline-sm text-on-surface">Broadcast History</h2>
          <span className="font-code-compact text-xs text-on-surface-variant">({records.length})</span>
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
                  {r.audienceLabel} &middot; {r.recipientsCount} recipients
                </p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {r.channels.map((ch) => (
                    <ChannelBadge key={ch} channel={ch} />
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-label-badge px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                  {r.status}
                </span>
                <p className="font-code-compact text-secondary mt-1">
                  {r.deliveryRate} &middot; {r.cost}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Modal (Create & Edit) */}
      {templateOpen && (
        <CreateTemplateModal
          template={editingTemplate}
          onClose={() => {
            setTemplateOpen(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Audience Group Modal (Create & Edit) */}
      {audienceOpen && (
        <CreateAudienceGroupModal
          group={editingAudience}
          alumni={alumni}
          onClose={() => {
            setAudienceOpen(false);
            setEditingAudience(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20">
            <div className="flex items-center gap-3 text-error mb-3">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="font-headline-md text-on-surface">Confirm Delete</h3>
            </div>
            <p className="font-body-default text-on-surface-variant">
              Are you sure you want to delete the {deleteConfirm.type === "template" ? "template" : "audience group"}{" "}
              <strong className="text-on-surface">&quot;{deleteConfirm.name}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-error text-on-error font-body-medium font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
