"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Mail,
  GraduationCap,
} from "lucide-react";

interface DraftRegistration {
  form: {
    email: string;
    studentId: string;
    password: string;
    name: string;
    classYear: number;
    degree: string;
    major: string;
    currentRole: string;
    company: string;
    location: string;
    country: string;
    industry: string;
    bio: string;
    isMentor: boolean;
  };
  isResubmitting: boolean;
  timestamp: number;
}

function Verify2faContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string>("");
  const [draft, setDraft] = useState<DraftRegistration | null>(null);
  const [hasCheckedDraft, setHasCheckedDraft] = useState(false);

  // OTP form state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ name: string; studentId: string } | null>(null);

  useEffect(() => {
    // 1. Resolve email from query parameter or sessionStorage draft
    const paramEmail = searchParams.get("email");

    try {
      const saved = sessionStorage.getItem("ipam_registration_draft");
      if (saved) {
        const parsed: DraftRegistration = JSON.parse(saved);
        if (parsed?.form?.email) {
          setDraft(parsed);
          setEmail(parsed.form.email);
        } else if (paramEmail) {
          setEmail(paramEmail);
        }
      } else if (paramEmail) {
        setEmail(paramEmail);
      }
    } catch {
      if (paramEmail) setEmail(paramEmail);
    } finally {
      setHasCheckedDraft(true);
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResendCode() {
    if (!email || resendCooldown > 0 || resending) return;
    setResending(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/2fa/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          purpose: "REGISTRATION",
          name: draft?.form?.name || "Alumni Candidate",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error || "Failed to dispatch verification email. Please check your address.");
      } else {
        setResendCooldown(30);
      }
    } catch {
      setOtpError("Network error dispatching verification email.");
    } finally {
      setResending(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!draft?.form) {
      setOtpError("Registration details not found. Please return to the registration form and re-submit.");
      return;
    }

    setLoading(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/alumni/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft.form,
          otp: cleanOtp,
          isResubmission: draft.isResubmitting,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error ?? json.issues?.formErrors?.[0] ?? "Registration verification failed.");
        return;
      }

      // Successful registration!
      setSuccessInfo({
        name: draft.form.name,
        studentId: draft.form.studentId,
      });
      setIsSuccess(true);

      // Clean up draft from session storage
      try {
        sessionStorage.removeItem("ipam_registration_draft");
      } catch {}
    } catch {
      setOtpError("Something went wrong verifying your code. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Loading state while checking draft
  if (!hasCheckedDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          <span className="text-sm font-semibold">Loading verification session…</span>
        </div>
      </div>
    );
  }

  // Success Confirmation Screen
  if (isSuccess && successInfo) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-200">
        <div className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md text-center sm:p-12">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500" />

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-950/60 text-amber-400 shadow-inner">
              <Clock className="h-10 w-10 animate-pulse text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/80 px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-4">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>2FA Verified &middot; Status: Pending Approval</span>
            </div>

            <h2 className="text-2xl font-black text-white sm:text-3xl">Registration Submitted!</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 max-w-lg mx-auto">
              Thank you, <strong className="text-white">{successInfo.name}</strong>. Your alumni profile for Student ID{" "}
              <strong className="text-emerald-400 font-mono">{successInfo.studentId}</strong> has been authenticated with Two-Factor
              Verification and submitted to the <strong className="text-white">IPAM Office of the Registrar</strong>.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-left text-xs space-y-2 text-slate-300">
              <p className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                What happens next?
              </p>
              <p>
                1. <strong>Registrar Review:</strong> University administrators cross-reference your submitted degree and matriculation records against the university registry.
              </p>
              <p>
                2. <strong>Pending State:</strong> To protect student confidentiality, your account remains in a{" "}
                <span className="text-amber-400 font-bold">Pending Approval</span> state. You will not be able to log in until an administrator approves your profile.
              </p>
              <p>
                3. <strong>Activation:</strong> Once approved, your digital virtual membership pass is activated and you can sign in anytime.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 shadow-md hover:bg-emerald-400 transition-all"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-750 transition-colors"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Missing draft / session expired view
  if (!draft?.form && !email) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-200">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/40 text-amber-400">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-white">No Active Registration Found</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Please fill out your alumni registration details first before verifying your identity.
          </p>
          <div className="mt-6">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go to Registration Form</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-slate-200">
      {/* Top Header Bar */}
      <div className="sticky top-16 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link
            href="/register"
            className="flex items-center gap-2 text-xs font-bold text-slate-300 transition-colors hover:text-emerald-400 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
            <span>Back to Registration Details</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-slate-400 sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="rounded-xl border border-emerald-500/30 bg-emerald-950 px-3 py-1.5 text-xs font-extrabold text-emerald-300 transition-colors hover:bg-emerald-900"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Factor Authentication Page Content */}
      <div className="mx-auto max-w-xl px-4 py-12 md:py-16">
        <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md sm:p-10">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950 text-emerald-400 shadow-lg shadow-emerald-950/50">
              <KeyRound className="h-8 w-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-0.5 text-[11px] font-bold text-emerald-400 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Step 2 of 2: Security Verification</span>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Two-Factor Authentication</h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Verify your email address to authenticate your registration request
            </p>
          </div>

          {/* Email Info Card */}
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/50 p-4 text-xs text-emerald-200">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                SMTP Security Verification
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-900/60 px-2 py-0.5 text-[10px] text-emerald-300">
                {resending ? "Sending..." : "Dispatched via SMTP"}
              </span>
            </div>
            <p className="mt-2 text-slate-300 leading-relaxed">
              A single-use 6-digit dynamic verification code has been dispatched via SMTP email to:
            </p>
            <p className="mt-1.5 select-all rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-center font-mono text-sm font-extrabold text-white">
              {email}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Please check your inbox (and spam/junk folder) for the verification email sent from{" "}
              <span className="font-semibold text-emerald-400">IPAM Alumni Security</span>. The code expires in 15 minutes.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-[11px] text-slate-400">
              <span>Didn&apos;t receive the code?</span>
              <button
                type="button"
                disabled={resending || resendCooldown > 0}
                onClick={handleResendCode}
                className="font-bold text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
              </button>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="mt-6 space-y-5">
            <div>
              <label className="block text-center text-xs font-bold text-slate-300 mb-2">
                Enter 6-Digit Verification Code *
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3.5 text-center font-mono text-3xl font-black tracking-[0.5em] text-white shadow-inner placeholder:text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {otpError && (
                <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-center text-xs font-semibold text-rose-300">
                  {otpError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-750"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Edit Details</span>
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-black text-slate-950 shadow-md transition-all hover:bg-emerald-400 hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify &amp; Submit</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Security Note */}
          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-[11px] text-slate-500">
            Protected by IPAM Multi-Factor Authentication &amp; 256-Bit SSL Encryption
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Verify2faPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <span className="text-sm font-semibold">Loading verification page…</span>
          </div>
        </div>
      }
    >
      <Verify2faContent />
    </Suspense>
  );
}

