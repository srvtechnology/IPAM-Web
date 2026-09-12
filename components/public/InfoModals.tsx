"use client";

import { useState, type FormEvent } from "react";
import { X, ShieldCheck, FileText, Mail, BookOpen, Send, CheckCircle2, Phone, MapPin } from "lucide-react";
import { useApp } from "@/lib/public/context";

export default function InfoModals() {
  const { infoModalType, setInfoModalType } = useApp();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSent, setContactSent] = useState(false);

  if (!infoModalType) return null;

  function close() {
    setInfoModalType(null);
  }

  function handleSendContact(e: FormEvent) {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      close();
    }, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={close}>
      <div
        className="relative my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          {infoModalType === "privacy" && (
            <div className="space-y-4">
              <ModalHeading icon={<ShieldCheck className="h-6 w-6" />} title="Privacy Policy" subtitle="Last revised: September 2026" />
              <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-600">
                <p>
                  The IPAM Alumni Association is committed to safeguarding member privacy. We collect directory
                  details, academic graduation records, and contact preferences solely for institutional networking,
                  mentorship, and event verification.
                </p>
                <h4 className="font-bold text-slate-900">Data Protection & Encryption</h4>
                <p>
                  All credentials, digital pass QR codes, and donation records are handled over encrypted connections.
                  We never sell or share alumni personal data with third-party telemarketers.
                </p>
                <h4 className="font-bold text-slate-900">Directory Visibility</h4>
                <p>
                  Members can update the details shown on their public directory profile at any time, including
                  contact information and mentor availability.
                </p>
              </div>
            </div>
          )}

          {infoModalType === "terms" && (
            <div className="space-y-4">
              <ModalHeading icon={<FileText className="h-6 w-6" />} title="Terms of Service" subtitle="Effective 2026" />
              <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-600">
                <p>
                  Welcome to the official IPAM Alumni Portal. By accessing this platform, you agree to maintain
                  professional conduct and uphold the honor code of the Institute of Public Administration &amp;
                  Management.
                </p>
                <h4 className="font-bold text-slate-900">Authorized Membership</h4>
                <p>
                  Access to the alumni directory, digital pass, and job referral board is restricted to verified
                  graduates, honorary fellows, and current faculty of IPAM.
                </p>
                <h4 className="font-bold text-slate-900">Job Board & Business Directory</h4>
                <p>
                  Job postings and business directory listings must adhere to fair labor practices and truthful
                  representations. Unverified or misleading listings will be removed.
                </p>
              </div>
            </div>
          )}

          {infoModalType === "bylaws" && (
            <div className="space-y-4">
              <ModalHeading icon={<BookOpen className="h-6 w-6" />} title="IPAM Alumni Constitution & Bylaws" subtitle="Adopted by the General Assembly" />
              <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-600">
                <h4 className="font-bold text-slate-900">Article I: Name & Objectives</h4>
                <p>
                  The Association shall be officially titled the IPAM Alumni Association. Its core objective is
                  fostering continuous educational fellowship, supporting university governance, and establishing
                  international chapter networks.
                </p>
                <h4 className="font-bold text-slate-900">Article II: Executive Council Elections</h4>
                <p>
                  The Executive Council shall be elected quadrennially through direct secret ballot by verified,
                  registered alumni.
                </p>
                <h4 className="font-bold text-slate-900">Article III: Global Chapters</h4>
                <p>
                  Regional alumni groups with 25 or more resident members may apply for formal charter status as
                  recognized international chapters.
                </p>
              </div>
            </div>
          )}

          {infoModalType === "contact" && (
            <div className="space-y-4">
              <ModalHeading icon={<Mail className="h-6 w-6" />} title="Contact Alumni Relations" subtitle="Office of Institutional Advancement & Alumni Affairs" />

              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>IPAM Campus, University of Sierra Leone</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>+232 76 000 000</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <span>alumni@ipam.edu</span>
                </div>
              </div>

              {contactSent ? (
                <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="text-sm font-bold">Message sent to the Alumni Secretariat!</p>
                </div>
              ) : (
                <form onSubmit={handleSendContact} className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Your Name
                      <input required value={contactName} onChange={(e) => setContactName(e.target.value)} className="input mt-1" />
                    </label>
                    <label className="block text-xs font-bold text-slate-700">
                      Your Email
                      <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input mt-1" />
                    </label>
                  </div>
                  <label className="block text-xs font-bold text-slate-700">
                    Message
                    <textarea
                      rows={3}
                      required
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder="How can the alumni secretariat assist you?"
                      className="input mt-1"
                    />
                  </label>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Send className="h-3.5 w-3.5" /> Send Message to Secretariat
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-700">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
