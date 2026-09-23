"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  QrCode,
  Briefcase,
  Users,
  Award,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo.alumni@ipam.edu");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Status response state
  const [statusType, setStatusType] = useState<"PENDING" | "REJECTED" | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [rejectedEmail, setRejectedEmail] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusType(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/alumni/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.status === "REJECTED") {
          setStatusType("REJECTED");
          setRejectionReason(json.rejectionReason ?? "Application did not meet registration criteria.");
          setRejectedEmail(json.email ?? email);
          return;
        }
        if (json.status === "PENDING") {
          setStatusType("PENDING");
          return;
        }
        setError(json.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-slate-200">
      {/* Sticky top bar */}
      <div className="sticky top-16 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-300 transition-colors hover:text-emerald-400 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
            <span>Back to Portal</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-slate-400 sm:inline">New alumni?</span>
            <Link
              href="/register"
              className="rounded-xl border border-emerald-500/30 bg-emerald-950 px-3 py-1.5 text-xs font-extrabold text-emerald-300 transition-colors hover:bg-emerald-900"
            >
              Register as Alumni
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Form column */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md sm:p-10"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

              <div className="mb-6 space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>IPAM Registrar SSO Verified</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Sign In to Alumni Portal
                </h1>
                <p className="text-xs text-slate-400 sm:text-sm">
                  Access your digital credential pass, exclusive jobs, executive network, and university privileges.
                </p>
              </div>

              <div className="mb-6 flex rounded-2xl border border-slate-800 bg-slate-950 p-1.5 text-xs font-bold">
                <span className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-750 bg-slate-900 py-2.5 font-black text-emerald-400 shadow-md">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Sign In</span>
                </span>
                <Link
                  href="/register"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-slate-400 transition-colors hover:text-white"
                >
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                  <span>Create Account / Register</span>
                </Link>
              </div>

              {statusType === "REJECTED" && (
                <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-950/80 p-5 shadow-lg text-rose-200">
                  <div className="flex items-center gap-2.5 font-bold text-rose-300 text-sm">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    <span>Registration Application Rejected</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    The IPAM Office of the Registrar reviewed your application and was unable to approve your account.
                  </p>
                  {rejectionReason && (
                    <div className="mt-2.5 rounded-xl border border-rose-500/30 bg-slate-950/80 p-3 text-xs text-rose-200">
                      <strong className="text-rose-400">Rejection Reason:</strong>
                      <p className="mt-0.5 italic text-slate-200">&quot;{rejectionReason}&quot;</p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-rose-500/20">
                    <span className="text-[11px] text-slate-400">You may update your details and re-submit:</span>
                    <Link
                      href={`/register?resubmit=true&email=${encodeURIComponent(rejectedEmail || email)}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-rose-400 transition-colors shadow-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Re-submit Registration</span>
                    </Link>
                  </div>
                </div>
              )}

              {statusType === "PENDING" && (
                <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-950/80 p-5 shadow-lg text-amber-200">
                  <div className="flex items-center gap-2.5 font-bold text-amber-300 text-sm">
                    <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                    <span>Account Pending Administrative Approval</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Your registration has been submitted and is currently in a <strong>Pending Approval</strong> state
                    awaiting verification by the IPAM Office of the Registrar.
                  </p>
                  <p className="mt-2 text-xs text-amber-300/90 font-medium">
                    You will be able to sign in once an administrator approves your graduation credentials. Please check back later.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-sm text-rose-300">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">University Email or Student ID *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Password *</label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-black text-slate-950 shadow-md transition-all hover:bg-emerald-400 hover:shadow-lg active:scale-98 disabled:opacity-60 sm:text-base"
                >
                  <span>{loading ? "Signing in…" : "Sign In to Portal"}</span>
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-slate-400">
                New alumni?{" "}
                <Link href="/register" className="font-medium text-emerald-400 hover:underline">
                  Register here
                </Link>
              </p>
            </form>
          </div>

          {/* Value proposition sidebar */}
          <div className="space-y-6 lg:col-span-5">
            <div className="relative space-y-6 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative z-10 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950 text-emerald-400">
                  <GraduationCap className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white sm:text-2xl">Why Join the IPAM Alumni Network?</h3>
                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                  Join thousands of graduates advancing governance, technology, banking, and commerce worldwide.
                </p>
              </div>

              <div className="relative z-10 space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 backdrop-blur-xs">
                  <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <strong className="block font-bold text-white">Official Scannable Virtual Pass</strong>
                    <span className="text-xs text-slate-400">
                      Instant smartphone ID card with live registrar QR code and offline wallet export.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 backdrop-blur-xs">
                  <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <strong className="block font-bold text-white">Curated Career Opportunities</strong>
                    <span className="text-xs text-slate-400">
                      Direct access to executive postings, alumni referrals, and hiring managers.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 backdrop-blur-xs">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <strong className="block font-bold text-white">1-on-1 Mentorship &amp; Directory</strong>
                    <span className="text-xs text-slate-400">
                      Connect with seasoned industry veterans and expand your cross-border professional circle.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 backdrop-blur-xs">
                  <Award className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <strong className="block font-bold text-white">Partner Discounts &amp; Campus Privileges</strong>
                    <span className="text-xs text-slate-400">
                      Enjoy exclusive discounts at alumni-owned enterprises and campus facility access.
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Registrar Node Online
                </span>
                <span className="font-bold text-slate-300">Encrypted 256-Bit SSL</span>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
                  alt="Dr. Fatmata Kamara"
                  className="h-12 w-12 rounded-full border-2 border-emerald-500 object-cover"
                />
                <div>
                  <p className="text-sm font-extrabold text-white">Dr. Fatmata Kamara</p>
                  <p className="text-xs font-semibold text-emerald-400">Managing Director, Apex Global • Class of &apos;12</p>
                </div>
              </div>
              <p className="text-xs italic leading-relaxed text-slate-300">
                &quot;The IPAM Alumni platform connects our brightest minds across continents. Signing in takes just a
                moment and opens doors to lifelong leadership.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
    </div>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [forgotEmail, setForgotEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;
    // No email provider is wired into this project yet — this confirms the
    // flow visually; wire to a real mailer + reset-token API before relying
    // on it to actually deliver anything.
    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center text-white shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950 text-emerald-400">
          <KeyRound className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Reset your password</h3>
          <p className="mt-1 text-xs text-slate-400">
            Enter your registered alumni email to receive a password recovery link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-1 rounded-2xl border border-emerald-500/40 bg-emerald-950 p-4 text-xs text-emerald-200">
            <p className="font-bold text-white">Recovery instructions sent!</p>
            <p>Please check your inbox at <strong>{forgotEmail}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="name@alumni.ipam.edu"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white focus:outline-emerald-500"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-emerald-400"
              >
                Send Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
