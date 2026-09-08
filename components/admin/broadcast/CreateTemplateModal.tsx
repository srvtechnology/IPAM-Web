"use client";

import { useState, type FormEvent } from "react";
import { useBroadcast } from "@/hooks/admin/useBroadcast";

const CHANNELS = ["SMS", "WHATSAPP", "EMAIL", "PUSH"] as const;
const TYPES = ["MESSAGE", "INVITATION", "NOTIFICATION"] as const;

export default function CreateTemplateModal({ onClose }: { onClose: () => void }) {
  const { createTemplate, loading, error } = useBroadcast();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("MESSAGE");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<string[]>(["SMS", "EMAIL"]);

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
    const result = await createTemplate({ name, type, title, message, channels });
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">New Message Template</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="font-body-compact text-on-surface-variant block">
            Template name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant block">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="font-body-compact text-on-surface-variant block">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant block">
            Message
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary resize-none"
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
                    className={`px-3 py-1.5 rounded-full font-label-badge transition-colors ${
                      selected
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container-low text-on-surface-variant border border-outline-variant/30"
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
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
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Saving…" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
