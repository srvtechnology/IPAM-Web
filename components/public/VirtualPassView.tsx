"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  GraduationCap,
  RotateCw,
  Download,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Linkedin,
  Send,
  CreditCard,
  ScanLine,
  CheckCircle2,
  Printer,
  Smartphone,
  X,
} from "lucide-react";
import PhysicalCardOrderForm from "@/components/public/PhysicalCardOrderForm";

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
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [scanState, setScanState] = useState<"scanning" | "verified" | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [dispatchSent, setDispatchSent] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  // Starts as a stable placeholder so the server- and first client-rendered
  // HTML match, then swaps to the real origin post-hydration — computing
  // window.location.origin during render would mismatch SSR output.
  const [cardUrl, setCardUrl] = useState(`https://ipamalumni.org/pass?card=${pass.studentId}`);
  useEffect(() => {
    setCardUrl(`${window.location.origin}/pass?card=${encodeURIComponent(pass.studentId)}`);
  }, [pass.studentId]);

  const shareTitle = `IPAM Alumni Digital Pass - ${pass.name}`;
  const shareText = `Verify official IPAM Alumni Association credential for ${pass.name} (Member ID ${pass.studentId}, Class of ${pass.classYear}): ${cardUrl}`;

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
      link.download = `IPAM-Alumni-QR-${pass.studentId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  function handleDispatch(e: FormEvent) {
    e.preventDefault();
    if (!recipientEmail) return;
    // No email provider is wired into this project yet — this records the
    // intent locally so the flow can be tried end-to-end; wire to a real
    // mailer before relying on it to actually notify anyone.
    setDispatchSent(true);
  }

  function handleTestScan() {
    setScanState("scanning");
    setTimeout(() => setScanState("verified"), 1200);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Virtual Alumni Pass</h1>
        <p className="mt-1 text-sm text-slate-500">
          Present this pass at IPAM events and partner venues, or share it with anyone who needs to verify your credential.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: flip card */}
        <div className="lg:col-span-7">
          <div
            className="relative mx-auto max-w-md cursor-pointer select-none"
            onClick={() => setIsFlipped((v) => !v)}
            title="Click card to flip"
          >
            {!isFlipped ? (
              <div className="aspect-[1.586/1] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-800 p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6" />
                    <span className="text-sm font-bold">IPAM Alumni Association</span>
                  </div>
                  <span className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-black">IPAM</span>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
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
                      <p className="text-lg font-bold leading-tight">{pass.name}</p>
                      <p className="text-sm text-emerald-100">{pass.degree}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                          Class of {pass.classYear}
                        </span>
                        {pass.isVerifiedAlumni && (
                          <span className="rounded-md bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-emerald-950">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white p-1.5">
                    <QRCodeSVG value={cardUrl} size={56} level="M" />
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between border-t border-white/20 pt-3 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-emerald-200/80">Member ID</p>
                    <p className="font-mono font-bold">{pass.studentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-emerald-200/80">Tier</p>
                    <p className="font-black text-amber-300">{pass.membershipTier.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[1.586/1] w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl">
                <div className="-mx-6 -mt-6 h-9 bg-slate-800" />
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Registrar Signature & Security Token
                    </p>
                    <p className="font-mono text-[11px] font-bold text-emerald-400">
                      SHA256: 8f4a-92b1-ipam-alum-pass
                    </p>
                    <p className="text-[10px] leading-snug text-slate-400">
                      Valid for global university privileges and partner facility access.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white p-1.5">
                    <QRCodeSVG value={cardUrl} size={56} level="M" />
                  </div>
                </div>
                <div className="mt-5 flex h-8 items-center justify-center rounded-lg bg-white font-mono text-[10px] font-black tracking-widest text-black">
                  ||| | |||| | || ||||| ||| |||| | |||
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
                  <span>Official Credential · IPAM Alumni Association</span>
                  <span className="font-bold text-emerald-400">ipamalumni.org/pass</span>
                </div>
              </div>
            )}
          </div>

          <div className="mx-auto mt-3 flex max-w-md items-center justify-center gap-1.5 text-xs text-slate-500">
            <RotateCw className="h-3.5 w-3.5 text-emerald-600" />
            <span>Click card to flip ({isFlipped ? "showing back" : "showing front"})</span>
          </div>

          <div className="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => alert("Digital pass saved to Apple / Google Wallet!")}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black"
            >
              <Smartphone className="h-4 w-4 text-emerald-400" />
              Add to Wallet
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Print / PDF Pass
            </button>
            <button
              onClick={() => setIsOrderOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Order Physical PVC
            </button>
          </div>
        </div>

        {/* Right: QR + sharing suite */}
        <div className="space-y-6 lg:col-span-5">
          <div ref={qrRef} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
              <ScanLine className="h-3.5 w-3.5" /> Live Scannable QR
            </div>
            <h3 className="mt-2 text-lg font-black text-slate-900">Scan to Verify</h3>
            <div className="mx-auto mt-4 inline-block rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-b from-slate-50 to-emerald-50/40 p-5">
              <QRCodeSVG value={cardUrl} size={180} level="H" includeMargin />
              <div className="mt-3 border-t border-slate-200 pt-2">
                <p className="text-xs font-black text-slate-900">{pass.name}</p>
                <p className="font-mono text-[11px] font-bold text-emerald-700">{pass.studentId}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" /> Download QR
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleTestScan}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <ScanLine className="h-3.5 w-3.5 text-emerald-600" /> Test Scan QR Code
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Share2 className="h-4 w-4 text-emerald-600" /> Share Pass to Anyone
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <Share2 className="h-4 w-4 text-emerald-600" /> Share
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`}
                className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <Mail className="h-4 w-4 text-blue-600" /> Email
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <Linkedin className="h-4 w-4 text-sky-700" /> LinkedIn
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Send className="h-4 w-4 text-emerald-600" /> Send Pass via Email
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Send directly to an employer, recruiter, or colleague for verification.
            </p>

            {dispatchSent ? (
              <div className="mt-4 space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-emerald-900">Digital pass dispatched to {recipientEmail}.</p>
                <button
                  onClick={() => {
                    setDispatchSent(false);
                    setRecipientEmail("");
                    setRecipientName("");
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Send to another recipient
                </button>
              </div>
            ) : (
              <form onSubmit={handleDispatch} className="mt-3 space-y-2.5">
                <input
                  type="text"
                  placeholder="Recipient name (optional)"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="input"
                />
                <input
                  type="email"
                  required
                  placeholder="Recipient email address"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="input"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Send className="h-3.5 w-3.5" /> Dispatch Digital Pass
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {isOrderOpen && <OrderCardModal pass={pass} onClose={() => setIsOrderOpen(false)} />}

      {scanState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setScanState(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {scanState === "scanning" ? (
              <div className="space-y-3 py-4">
                <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ScanLine className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Scanning QR Code…</h3>
                <p className="text-xs text-slate-500">Connecting to IPAM registrar verification nodes…</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Credential Authenticated</h3>
                <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-bold text-slate-900">{pass.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Member ID</span><span className="font-mono font-bold text-slate-900">{pass.studentId}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Degree</span><span className="font-bold text-slate-900">{pass.degree}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-bold text-emerald-700">Good Standing</span></div>
                </div>
                <button
                  onClick={() => setScanState(null)}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCardModal({ pass, onClose }: { pass: VirtualPassData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Order Physical Alumni ID Card</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <PhysicalCardOrderForm memberName={pass.name} />
      </div>
    </div>
  );
}
