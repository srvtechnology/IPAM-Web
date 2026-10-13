"use client";

import { useState, type FormEvent } from "react";
import { useBroadcast } from "@/hooks/admin/useBroadcast";
import type { TemplateRow } from "./OmnichannelBroadcastView";

const CHANNELS = ["SMS", "EMAIL", "PUSH"] as const;
const TYPES = ["MESSAGE", "INVITATION", "NOTIFICATION"] as const;
const PRIORITIES = ["NORMAL", "URGENT", "CRITICAL"] as const;

export default function CreateTemplateModal({
  template,
  onClose,
}: {
  template?: TemplateRow | null;
  onClose: () => void;
}) {
  const isEditing = Boolean(template);
  const { createTemplate, updateTemplate, loading, error } = useBroadcast();

  const [name, setName] = useState(template?.name ?? "");
  const [type, setType] = useState<(typeof TYPES)[number]>(
    (template?.type as (typeof TYPES)[number]) ?? "MESSAGE"
  );
  const [title, setTitle] = useState(template?.title ?? "");
  const [message, setMessage] = useState(template?.message ?? "");
  const [channels, setChannels] = useState<string[]>(
    template?.channels && template.channels.length > 0
      ? template.channels.filter((c) => c !== "WHATSAPP")
      : ["SMS", "EMAIL"]
  );
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>(
    (template?.priority as (typeof PRIORITIES)[number]) ?? "NORMAL"
  );
  const [actionUrl, setActionUrl] = useState(template?.actionUrl ?? "");

  function toggleChannel(ch: string) {
    setChannels((prev) => {
      if (prev.includes(ch)) {
        if (prev.length > 1) return prev.filter((c) => c !== ch);
        return prev;
      }
      return [...prev, ch];
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      type,
      title,
      message,
      channels,
      priority,
      actionUrl: actionUrl.trim() || undefined,
    };

    let result;
    if (isEditing && template) {
      result = await updateTemplate(template.id, payload);
    } else {
      result = await createTemplate(payload);
    }

    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20 animate-fade-in"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              {isEditing ? "edit_note" : "add_box"}
            </span>
            <h2 className="font-headline-md text-on-surface">
              {isEditing ? "Edit Message Template" : "New Message Template"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
          <label className="font-body-compact text-on-surface-variant block">
            Template name
            <input
              required
              placeholder="e.g. Convocation Reminder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="font-body-compact text-on-surface-variant block">
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="font-body-compact text-on-surface-variant block">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="font-body-compact text-on-surface-variant block">
            Subject / Headline Title
            <input
              required
              placeholder="e.g. Important Alumni Gathering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="font-body-compact text-on-surface-variant block">
            Message Body
            <textarea
              required
              rows={3}
              placeholder="Type your message content..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary resize-none"
            />
          </label>

          <label className="font-body-compact text-on-surface-variant block">
            Action URL (optional)
            <input
              type="url"
              placeholder="https://alumni.ipam.edu/rsvp"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>

          <div>
            <p className="font-body-compact text-on-surface-variant mb-1.5">Delivery channels</p>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => {
                const selected = channels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-full font-label-badge transition-colors flex items-center gap-1.5 ${
                      selected
                        ? "bg-primary-container text-on-primary-container ring-1 ring-primary/40 font-semibold"
                        : "bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {selected ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
            {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
