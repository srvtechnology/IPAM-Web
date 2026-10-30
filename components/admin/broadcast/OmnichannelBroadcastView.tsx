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
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);
  const [sendingTestSms, setSendingTestSms] = useState(false);

  // Custom Email + SMS composer state
  const [composeMode, setComposeMode] = useState<"template" | "custom">("custom");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customChannels, setCustomChannels] = useState<string[]>(["EMAIL", "SMS"]);
  const [customPriority, setCustomPriority] = useState<"NORMAL" | "URGENT" | "CRITICAL">("NORMAL");
  const [customAudience, setCustomAudience] = useState<string>("");
  const [customActionUrl, setCustomActionUrl] = useState("");
  const [directRecipientMode, setDirectRecipientMode] = useState(false);
  const [directEmail, setDirectEmail] = useState("");
  const [directPhone, setDirectPhone] = useState("");
  const [customSendStatus, setCustomSendStatus] = useState<string | null>(null);

  const canWrite = can("BROADCAST", "canWrite");
  const canDelete = can("BROADCAST", "canDelete");

  async function handleSendTestEmail() {
    setSendingTest(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch("/api/admin/broadcast/test-email", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setTestEmailStatus(`✔ Test email dispatched to ${json.data.recipient}!`);
      } else {
        setTestEmailStatus(`✖ Test failed: ${json.error || "Unknown error"}`);
      }
    } catch {
      setTestEmailStatus("✖ Network error dispatching test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendTestSms() {
    setSendingTestSms(true);
    setTestSmsStatus(null);
    try {
      const res = await fetch("/api/admin/broadcast/test-sms", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setTestSmsStatus(`✔ Twilio SMS verified: ${json.data.friendlyName || "Active"} (${json.data.accountStatus})`);
      } else {
        setTestSmsStatus(`✖ Twilio test failed: ${json.error || "Unknown error"}`);
      }
    } catch {
      setTestSmsStatus("✖ Network error verifying Twilio SMS");
    } finally {
      setSendingTestSms(false);
    }
  }

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
      audienceGroupId: audience.id,
      recipientsCount: audience.estimatedCount ?? 0,
      priority: template.priority ?? "NORMAL",
      actionUrl: template.actionUrl ?? null,
      eventDate: template.eventDate ?? null,
      eventVenue: template.eventVenue ?? null,
      rsvpDeadline: template.rsvpDeadline ?? null,
    });
  }

  async function handleCustomSend() {
    if (!customTitle.trim() || !customMessage.trim() || customChannels.length === 0) return;
    setCustomSendStatus(null);

    // Direct single recipient dispatch (Email or SMS)
    if (directRecipientMode) {
      const results: string[] = [];
      if (customChannels.includes("EMAIL") && directEmail.trim()) {
        try {
          const res = await fetch("/api/admin/broadcast/test-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: directEmail.trim(), subject: customTitle, message: customMessage }),
          });
          const json = await res.json();
          if (res.ok && json.success) results.push(`Email delivered to ${directEmail.trim()}`);
          else results.push(`Email failed: ${json.error || "Unknown"}`);
        } catch {
          results.push(`Email network error`);
        }
      }

      if (customChannels.includes("SMS") && directPhone.trim()) {
        try {
          const res = await fetch("/api/admin/broadcast/test-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: directPhone.trim(), message: `[IPAM] ${customTitle}: ${customMessage}` }),
          });
          const json = await res.json();
          if (res.ok && json.success) results.push(`SMS dispatched to ${directPhone.trim()}`);
          else results.push(`SMS failed: ${json.error || "Unknown"}`);
        } catch {
          results.push(`SMS network error`);
        }
      }

      setCustomSendStatus(results.join(" | ") || "No direct recipient details specified.");
      return;
    }

    // Broadcast to audience group or all alumni
    const audience = audienceGroups.find((a) => a.id === customAudience);
    const audienceLabel = audience ? audience.name : "All Registered Alumni";
    const recipientsCount = audience?.estimatedCount ?? alumni.length;

    const res = await sendBroadcast({
      type: "MESSAGE",
      title: customTitle.trim(),
      message: customMessage.trim(),
      channels: customChannels,
      audienceLabel,
      audienceGroupId: audience?.id,
      recipientsCount,
      priority: customPriority,
      actionUrl: customActionUrl.trim() || null,
    });

    if (res) {
      setCustomSendStatus(`✔ Custom broadcast "${customTitle}" successfully dispatched to ${audienceLabel}!`);
      setCustomTitle("");
      setCustomMessage("");
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">campaign</span>
            <h1 className="font-headline-lg text-on-surface">Omnichannel Broadcast</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1">
            Compose and dispatch messages across SMS, Email and Push.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-on-surface-variant font-code-compact">SMTP: growpos.official@gmail.com</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-on-surface-variant font-code-compact">SMS: Twilio (MG3220f...)</span>
          </div>
          {canWrite && (
            <>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                {sendingTest ? "Sending…" : "Test Email"}
              </button>
              <button
                type="button"
                onClick={handleSendTestSms}
                disabled={sendingTestSms}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">sms</span>
                {sendingTestSms ? "Checking…" : "Test SMS"}
              </button>
            </>
          )}
        </div>
      </div>

      {testEmailStatus && (
        <div
          className={`rounded-lg px-3 py-2 font-body-compact text-xs flex items-center justify-between ${
            testEmailStatus.startsWith("✔")
              ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
              : "bg-error-container text-on-error-container"
          }`}
        >
          <span>{testEmailStatus}</span>
          <button
            type="button"
            onClick={() => setTestEmailStatus(null)}
            className="text-xs hover:opacity-75 ml-2 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {testSmsStatus && (
        <div
          className={`rounded-lg px-3 py-2 font-body-compact text-xs flex items-center justify-between ${
            testSmsStatus.startsWith("✔")
              ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
              : "bg-error-container text-on-error-container"
          }`}
        >
          <span>{testSmsStatus}</span>
          <button
            type="button"
            onClick={() => setTestSmsStatus(null)}
            className="text-xs hover:opacity-75 ml-2 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-outline-variant/20 pb-3">
          <div>
            <h2 className="font-headline-sm text-on-surface">Compose &amp; Send</h2>
            <p className="text-xs text-on-surface-variant font-body-compact">
              Dispatch custom messages or saved templates across SMTP Email, Twilio SMS, and Firebase Push.
            </p>
          </div>
          <div className="flex items-center rounded-lg bg-surface-container-low p-1 border border-outline-variant/30 text-xs">
            <button
              type="button"
              onClick={() => setComposeMode("custom")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                composeMode === "custom"
                  ? "bg-secondary text-on-secondary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Custom Email + SMS
            </button>
            <button
              type="button"
              onClick={() => setComposeMode("template")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                composeMode === "template"
                  ? "bg-secondary text-on-secondary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Saved Template
            </button>
          </div>
        </div>

        {customSendStatus && (
          <div className="mb-4 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 px-3 py-2 text-xs flex items-center justify-between">
            <span>{customSendStatus}</span>
            <button
              type="button"
              onClick={() => setCustomSendStatus(null)}
              className="font-bold text-xs hover:opacity-75 ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {composeMode === "custom" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="font-body-compact text-on-surface-variant md:col-span-2">
                Subject / Title *
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Official University Dispatch: Annual Alumni Summit"
                  className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary text-sm"
                />
              </label>
              <label className="font-body-compact text-on-surface-variant">
                Target Audience *
                <select
                  value={customAudience}
                  onChange={(e) => setCustomAudience(e.target.value)}
                  disabled={directRecipientMode}
                  className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary text-sm disabled:opacity-40"
                >
                  <option value="">All Registered Alumni ({alumni.length})</option>
                  {audienceGroups.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.estimatedCount ?? "—"})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block font-body-compact text-on-surface-variant">
              Message Content *
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Compose your announcement message here. Formatted with university styling for emails and segmented for SMS delivery..."
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary text-sm"
              />
              <div className="flex justify-between items-center text-[11px] text-on-surface-variant/70 mt-1">
                <span>Supports plain text and line breaks</span>
                <span className="font-code-compact">
                  {customMessage.length} chars • ~{Math.ceil(customMessage.length / 160) || 1} SMS segment(s)
                </span>
              </div>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <span className="block font-body-compact text-on-surface-variant mb-1.5">Dispatch Channels:</span>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-on-surface">
                    <input
                      type="checkbox"
                      checked={customChannels.includes("EMAIL")}
                      onChange={(e) => {
                        if (e.target.checked) setCustomChannels((prev) => [...prev, "EMAIL"]);
                        else setCustomChannels((prev) => prev.filter((c) => c !== "EMAIL"));
                      }}
                      className="rounded border-outline-variant/50 text-secondary focus:ring-0"
                    />
                    <span className="font-semibold text-emerald-400">Email</span> (SMTP)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-on-surface">
                    <input
                      type="checkbox"
                      checked={customChannels.includes("SMS")}
                      onChange={(e) => {
                        if (e.target.checked) setCustomChannels((prev) => [...prev, "SMS"]);
                        else setCustomChannels((prev) => prev.filter((c) => c !== "SMS"));
                      }}
                      className="rounded border-outline-variant/50 text-secondary focus:ring-0"
                    />
                    <span className="font-semibold text-blue-400">SMS</span> (Twilio)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-on-surface">
                    <input
                      type="checkbox"
                      checked={customChannels.includes("PUSH")}
                      onChange={(e) => {
                        if (e.target.checked) setCustomChannels((prev) => [...prev, "PUSH"]);
                        else setCustomChannels((prev) => prev.filter((c) => c !== "PUSH"));
                      }}
                      className="rounded border-outline-variant/50 text-secondary focus:ring-0"
                    />
                    <span className="font-semibold text-purple-400">Push</span> (FCM)
                  </label>
                </div>
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block">
                  Priority
                  <select
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value as any)}
                    className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 font-body-default text-on-surface outline-none focus:border-secondary text-sm"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="URGENT">Urgent Notice</option>
                    <option value="CRITICAL">Critical Alert</option>
                  </select>
                </label>
              </div>

              <div>
                <label className="font-body-compact text-on-surface-variant block">
                  Action Link (Optional)
                  <input
                    type="url"
                    value={customActionUrl}
                    onChange={(e) => setCustomActionUrl(e.target.value)}
                    placeholder="https://ipam.billnbite.cloud/events/..."
                    className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 font-body-default text-on-surface outline-none focus:border-secondary text-sm"
                  />
                </label>
              </div>
            </div>

            {/* Direct Single Recipient Toggle */}
            <div className="pt-2 border-t border-outline-variant/20">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant mb-2">
                <input
                  type="checkbox"
                  checked={directRecipientMode}
                  onChange={(e) => setDirectRecipientMode(e.target.checked)}
                  className="rounded border-outline-variant/50 text-secondary focus:ring-0"
                />
                <span className="font-medium text-on-surface">Direct Custom Dispatch (Single Recipient Mode)</span>
              </label>

              {directRecipientMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
                  <label className="text-on-surface-variant">
                    Specific Recipient Email (for Custom Email)
                    <input
                      type="email"
                      value={directEmail}
                      onChange={(e) => setDirectEmail(e.target.value)}
                      placeholder="alumnus@example.com"
                      className="mt-1 w-full rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 text-on-surface text-xs outline-none"
                    />
                  </label>
                  <label className="text-on-surface-variant">
                    Specific Recipient Phone (for Custom SMS, E.164)
                    <input
                      type="text"
                      value={directPhone}
                      onChange={(e) => setDirectPhone(e.target.value)}
                      placeholder="+23276123456 or +14155552671"
                      className="mt-1 w-full rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 text-on-surface text-xs outline-none"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              {canWrite && (
                <button
                  type="button"
                  onClick={handleCustomSend}
                  disabled={loading || !customTitle.trim() || !customMessage.trim() || customChannels.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-secondary text-on-secondary px-6 py-2.5 font-body-medium font-semibold shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {loading ? "Dispatching…" : directRecipientMode ? "Send Direct Custom Message" : "Dispatch Custom Broadcast"}
                </button>
              )}
            </div>
          </div>
        ) : (
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
        )}
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
