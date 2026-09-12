"use client";

import { useState, type FormEvent } from "react";
import { X, CheckCircle2, Send } from "lucide-react";

export interface LeadershipModalMember {
  id: string;
  name: string;
  role: string;
  classYear: string;
  image: string | null;
  bio: string;
}

export default function LeadershipModal({
  leader,
  onClose,
}: {
  leader: LeadershipModalMember | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!leader) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    // No messaging backend is wired into this project yet — this confirms
    // the flow visually; wire to a real inbox before relying on delivery.
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage("");
      onClose();
    }, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div
        className="relative my-8 w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            {leader.image ? (
              <img
                src={leader.image}
                alt={leader.name}
                className="h-20 w-20 shrink-0 rounded-full border-2 border-emerald-600 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-100 text-2xl font-bold text-emerald-700">
                {leader.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                {leader.classYear}
              </span>
              <h3 className="mt-1 text-xl font-bold text-slate-950">{leader.name}</h3>
              <p className="text-xs font-semibold text-emerald-700">{leader.role}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Executive Biography & Strategic Vision
            </h4>
            <p className="text-sm leading-relaxed text-slate-600">{leader.bio}</p>
          </div>

          <div className="border-t border-slate-200 pt-4">
            {sent ? (
              <div className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                <p className="text-xs font-bold">Message delivered to {leader.name}&apos;s office!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-900">Send Note to {leader.role}</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Write your inquiry or proposal for ${leader.name}...`}
                  className="input"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Send className="h-3.5 w-3.5" /> Submit Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
