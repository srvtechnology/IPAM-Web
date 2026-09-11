"use client";

import { QRCodeSVG } from "qrcode.react";
import { GraduationCap, ShieldCheck } from "lucide-react";

export interface VirtualPassData {
  id: string;
  name: string;
  avatar: string | null;
  studentId: string;
  classYear: number;
  degree: string;
  isVerifiedAlumni: boolean;
  membershipTier: string;
}

export default function VirtualPassView({ pass }: { pass: VirtualPassData }) {
  const qrPayload = JSON.stringify({
    id: pass.id,
    studentId: pass.studentId,
    name: pass.name,
    verified: pass.isVerifiedAlumni,
  });

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-center text-2xl font-black text-slate-900">Virtual Alumni ID</h1>
      <p className="mt-1 text-center text-sm text-slate-500">Present this pass at IPAM events and partner venues.</p>

      <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-800 p-6 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold">IPAM Alumni Association</span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          {pass.avatar ? (
            <img
              src={pass.avatar}
              alt={pass.name}
              className="h-16 w-16 flex-shrink-0 rounded-2xl border-2 border-white object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-black">
              {pass.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-lg font-bold">{pass.name}</p>
            <p className="text-sm text-emerald-100">{pass.degree} · Class of {pass.classYear}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Member ID</p>
            <p className="font-mono text-sm font-semibold text-slate-900">{pass.studentId}</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {pass.isVerifiedAlumni ? "Verified" : "Pending verification"} · {pass.membershipTier.replace(/_/g, " ")}
            </p>
          </div>
          <QRCodeSVG value={qrPayload} size={88} />
        </div>
      </div>
    </div>
  );
}
