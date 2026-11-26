"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Share2,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Linkedin,
  QrCode,
  Download,
  Globe,
  Sparkles,
} from "lucide-react";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  url: string;
  shareText?: string;
  imageUrl?: string | null;
}

export function resolveShareUrl(pathOrUrl: string): string {
  if (!pathOrUrl) {
    return typeof window !== "undefined" ? window.location.href : "https://ipamalumni.org";
  }
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (typeof window !== "undefined") {
    const prefix = pathOrUrl.startsWith("/") ? "" : "/";
    return `${window.location.origin}${prefix}${pathOrUrl}`;
  }
  return pathOrUrl;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle,
  categoryLabel = "IPAM Alumni Network",
  url,
  shareText,
  imageUrl,
}: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const resolvedUrl = resolveShareUrl(url);
  const formattedText =
    shareText?.trim() || `${title}${subtitle ? ` — ${subtitle}` : ""} via IPAM Alumni Association`;
  const combinedShareBody = `${formattedText}\n\n${resolvedUrl}`;

  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCopiedLink(false);
      setCopiedPost(false);
      setShowQr(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback ignore
    }
  }

  async function handleCopyPost() {
    try {
      await navigator.clipboard.writeText(combinedShareBody);
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 2500);
    } catch {
      // fallback ignore
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: formattedText,
          url: resolvedUrl,
        });
        return;
      } catch {
        // user dismissed or cancelled share sheet
      }
    }
    await handleCopyPost();
  }

  function handleDownloadQr() {
    const svg = qrWrapperRef.current?.querySelector("svg");
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
      const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "ipam-share";
      link.download = `IPAM-${safeName}-QR.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(combinedShareBody)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(resolvedUrl)}`;
  const xTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedText)}&url=${encodeURIComponent(resolvedUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resolvedUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(combinedShareBody)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/65 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${title}`}
    >
      <div
        className="relative my-6 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Share</h3>
              <p className="text-[11px] font-medium text-slate-500">Send via social, messaging, or QR code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
            aria-label="Close share dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Rich Preview Card */}
          <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {categoryLabel}
              </span>
              <h4 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900">{title}</h4>
              {subtitle && <p className="line-clamp-1 text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>

          {/* Toggle QR View */}
          {showQr ? (
            <div className="flex flex-col items-center space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
              <div ref={qrWrapperRef} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <QRCodeSVG value={resolvedUrl} size={172} level="H" includeMargin={false} />
              </div>
              <p className="text-[11px] font-medium text-slate-600">
                Point any phone camera at this QR code to open directly.
              </p>
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download QR PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Social & Messaging Channels Grid */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Share via Platform
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-800"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-sky-500 hover:bg-sky-50/50 hover:text-sky-800"
                  >
                    <Linkedin className="h-5 w-5 text-sky-600" />
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href={xTwitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-slate-800 hover:bg-slate-100"
                  >
                    <span className="flex h-5 w-5 items-center justify-center text-base font-black text-slate-900">
                      𝕏
                    </span>
                    <span>X / Twitter</span>
                  </a>

                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-800"
                  >
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>Facebook</span>
                  </a>

                  <a
                    href={emailUrl}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-800"
                  >
                    <Mail className="h-5 w-5 text-slate-700" />
                    <span>Email</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQr(true)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-800"
                  >
                    <QrCode className="h-5 w-5 text-emerald-700" />
                    <span>QR Code</span>
                  </button>
                </div>
              </div>

              {/* Copy Link & Formatted Message */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Direct Link
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-3">
                  <input
                    type="text"
                    readOnly
                    value={resolvedUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      copiedLink
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyPost}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {copiedPost ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Message + Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy Share Message</span>
                      </>
                    )}
                  </button>
                  {hasNativeShare && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>More Apps</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
