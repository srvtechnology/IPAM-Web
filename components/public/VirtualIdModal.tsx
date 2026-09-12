"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  QrCode,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Download,
  RotateCw,
  Share2,
  Copy,
  Check,
  Send,
  Mail,
  MessageCircle,
  Linkedin,
  Maximize2,
  GraduationCap,
} from "lucide-react";
import type { PublicSessionUser } from "@/lib/public/context";
import PhysicalCardOrderForm from "@/components/public/PhysicalCardOrderForm";

export default function VirtualIdModal({
  session,
  initialTab = "virtual",
  onClose,
}: {
  session: PublicSessionUser;
  initialTab?: "virtual" | "qr" | "order";
  onClose: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<"virtual" | "qr" | "order">(initialTab);
  const [copiedLink, setCopiedLink] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [dispatchSent, setDispatchSent] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const profile = session.profile;

  const [cardUrl, setCardUrl] = useState(`https://ipamalumni.org/pass?card=${session.studentId}`);
  useEffect(() => {
    setCardUrl(`${window.location.origin}/pass?card=${encodeURIComponent(session.studentId)}`);
  }, [session.studentId]);

  if (!profile) return null;

  const shareTitle = `IPAM Alumni Digital Pass - ${profile.name}`;
  const shareText = `Verify official IPAM Alumni Association credential for ${profile.name} (Member ID ${session.studentId}, Class of ${profile.classYear}): ${cardUrl}`;

  function handleCopyLink() {
    navigator.clipboard?.writeText(cardUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: cardUrl });
      } catch {
        // user dismissed the share sheet
      }
    } else {
      handleCopyLink();
    }
  }

  function handleDownloadQR() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 600;
    canvas.height = 600;
    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 50, 50, 500, 500);
      const link = document.createElement("a");
      link.download = `IPAM-Alumni-QR-${session.studentId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  function handleDispatch(e: FormEvent) {
    e.preventDefault();
    if (!recipientEmail) return;
    setDispatchSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative my-6 w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <button
            onClick={() => setActiveTab("virtual")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold sm:text-sm ${
              activeTab === "virtual" ? "border border-emerald-200/60 bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-700" />
            <span className="truncate">Digital Pass</span>
          </button>
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold sm:text-sm ${
              activeTab === "qr" ? "border border-emerald-200/60 bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <QrCode className="h-4 w-4 text-emerald-700" />
            <span className="truncate">Scan & Share QR</span>
          </button>
          <button
            onClick={() => setActiveTab("order")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold sm:text-sm ${
              activeTab === "order" ? "border border-emerald-200/60 bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <CreditCard className="h-4 w-4 text-emerald-700" />
            <span className="truncate">Order Physical</span>
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-7">
          {activeTab === "virtual" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  <ShieldCheck className="h-3 w-3" /> Verified Registrar Credential
                </div>
                <h3 className="text-xl font-black text-slate-950 sm:text-2xl">IPAM Alumni Virtual Card</h3>
                <p className="mx-auto mt-0.5 max-w-md text-xs text-slate-500">
                  Scan the QR code or present this digital pass for campus access, alumni events, and partner privileges worldwide.
                </p>
              </div>

              <div
                className="relative mx-auto max-w-sm cursor-pointer select-none"
                onClick={() => setIsFlipped((v) => !v)}
                title="Click card to flip"
              >
                {!isFlipped ? (
                  <div className="aspect-[1.586/1] w-full overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-700 to-teal-800 p-4 text-white shadow-xl sm:p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" />
                        <span className="text-xs font-bold">IPAM Alumni Association</span>
                      </div>
                      <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[9px] font-black">IPAM</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt={profile.name} className="h-14 w-14 shrink-0 rounded-xl border-2 border-white object-cover shadow-md" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg font-black">
                            {profile.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-black leading-tight sm:text-base">{profile.name}</p>
                          <p className="truncate text-[11px] font-medium text-emerald-100 sm:text-xs">{profile.degree}</p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="rounded bg-white/20 px-2 py-0.5 text-[9px] font-bold">Class of {profile.classYear}</span>
                            {session.isVerifiedAlumni && (
                              <span className="rounded bg-emerald-400 px-2 py-0.5 text-[9px] font-black text-emerald-950">Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); setActiveTab("qr"); }}
                        className="shrink-0 rounded-xl bg-white p-1.5 text-center shadow-md transition-transform hover:scale-105"
                        title="Click to enlarge & share QR code"
                      >
                        <QRCodeSVG value={cardUrl} size={52} level="M" />
                        <span className="block pt-0.5 text-[8px] font-extrabold leading-tight text-slate-900">SCAN QR</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-end justify-between border-t border-white/20 pt-1.5 text-[9px] sm:text-[10px]">
                      <div>
                        <span className="block text-emerald-200/80">Member ID</span>
                        <span className="font-mono font-bold tracking-wider">{session.studentId}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-emerald-200/80">Tier</span>
                        <span className="font-black text-amber-300">{session.membershipTier.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[1.586/1] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-xl sm:p-5">
                    <div className="-mx-4 -mt-1 h-8 bg-slate-800 sm:-mx-5" />
                    <div className="flex items-center justify-between gap-3 py-1">
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold uppercase text-slate-400">Cryptographic RFID / QR Token</div>
                        <div className="font-mono text-[9px] font-bold text-emerald-400">SHA256: 8f4a-92b1-ipam-alum-pass</div>
                        <div className="text-[8px] text-slate-500">Scan with any smartphone camera for live registrar verification.</div>
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); setActiveTab("qr"); }}
                        className="shrink-0 rounded-xl border border-white/40 bg-white p-1.5 shadow-sm"
                      >
                        <QRCodeSVG value={cardUrl} size={50} level="M" />
                      </div>
                    </div>
                    <div className="flex h-6 items-center justify-center rounded bg-white font-mono text-[9px] font-black tracking-widest text-black">
                      ||| | |||| | || ||||| ||| |||| | |||
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-1 text-[8px] text-slate-400">
                      <span>Official Credential · IPAM Alumni</span>
                      <span className="font-bold text-emerald-400">ipamalumni.org/pass</span>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                  <RotateCw className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Click card to flip ({isFlipped ? "showing back" : "showing front"})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => setActiveTab("qr")}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <QrCode className="h-4 w-4" /> Share QR & Card
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  {copiedLink ? (<><Check className="h-4 w-4 text-emerald-400" /> Link Copied!</>) : (<><Copy className="h-4 w-4" /> Copy Card URL</>)}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
                <Link href="/pass" onClick={onClose} className="flex items-center gap-1 font-bold text-emerald-700 hover:underline">
                  <Maximize2 className="h-3.5 w-3.5" /> Open Full Dedicated Card Page
                </Link>
                <button onClick={() => setActiveTab("order")} className="ml-auto flex items-center gap-1 font-semibold text-slate-600 hover:underline">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Need physical PVC card?
                </button>
              </div>
            </div>
          )}

          {activeTab === "qr" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  <QrCode className="h-3.5 w-3.5" /> Instant Camera Scanning
                </div>
                <h3 className="text-xl font-black text-slate-950 sm:text-2xl">Share Your QR & Digital Pass</h3>
                <p className="mx-auto mt-0.5 max-w-sm text-xs text-slate-500">
                  Point any phone camera at this QR code to instantly verify your alumni status and open your digital card.
                </p>
              </div>

              <div ref={qrRef} className="relative mx-auto max-w-xs space-y-4 rounded-3xl border-2 border-emerald-200/80 bg-gradient-to-b from-slate-50 to-white p-6 text-center shadow-md">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-700 text-[10px] font-black text-white">IPAM</div>
                    <span className="text-xs font-black text-slate-900">Alumni Pass</span>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Live Verified</span>
                </div>
                <div className="inline-block rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
                  <QRCodeSVG value={cardUrl} size={190} level="H" includeMargin />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-slate-900">{profile.name}</p>
                  <p className="font-mono text-xs font-bold text-slate-500">{session.studentId}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Share Option</span>
                  <button onClick={handleCopyLink} className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900">
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Copied to Clipboard" : "Copy Direct Link"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button onClick={handleNativeShare} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50">
                    <Share2 className="h-4 w-4 text-emerald-600" /> Quick Share
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`}
                    className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50"
                  >
                    <Mail className="h-4 w-4 text-blue-600" /> Email Pass
                  </a>
                  <button onClick={handleDownloadQR} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50">
                    <Download className="h-4 w-4 text-purple-600" /> Save QR PNG
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-emerald-700" />
                  <h4 className="text-xs font-black text-slate-900">Send Digital Pass Directly to Recipient</h4>
                </div>

                {dispatchSent ? (
                  <div className="space-y-1 rounded-xl border border-emerald-300 bg-emerald-100/80 p-3 text-center">
                    <p className="text-xs font-bold text-emerald-900">Digital Credential & QR Dispatched!</p>
                    <p className="text-[11px] text-emerald-800">An official verification link has been sent to <strong>{recipientEmail}</strong>.</p>
                    <button
                      onClick={() => { setDispatchSent(false); setRecipientEmail(""); }}
                      className="mx-auto block pt-1 text-[11px] font-bold text-emerald-900 hover:underline"
                    >
                      Send to another recipient
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDispatch} className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        type="text" placeholder="Recipient Name (Optional)"
                        value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-emerald-500"
                      />
                      <input
                        type="email" required placeholder="Recipient Email Address"
                        value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-emerald-500"
                      />
                    </div>
                    <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                      <Send className="h-3.5 w-3.5" /> Dispatch Official Digital Pass
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === "order" && (
            <div className="space-y-4">
              <div className="mb-2 text-center">
                <h3 className="text-xl font-bold text-slate-950">Order Physical Alumni ID Card</h3>
              </div>
              <PhysicalCardOrderForm memberName={profile.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
