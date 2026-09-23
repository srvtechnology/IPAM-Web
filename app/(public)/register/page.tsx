"use client";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Briefcase,
  Building2,
  MapPin,
  Globe2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  QrCode,
  Users,
  Award,
  KeyRound,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const DEGREE_OPTIONS = [
  "B.Sc. Information Technology",
  "B.Sc. Banking & Finance",
  "B.Sc. Accounting",
  "B.Sc. Public Administration",
  "B.Sc. Business Administration",
  "Master of Business Administration (MBA)",
  "M.Sc. Finance & Investment",
  "Diploma in Procurement & Logistics",
];

const INDUSTRY_OPTIONS = [
  "General",
  "Public Administration & Governance",
  "Banking & Finance",
  "Technology",
  "Accounting & Audit",
  "Logistics & Procurement",
  "Education",
  "Healthcare",
  "Other",
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  studentId: "",
  classYear: CURRENT_YEAR,
  degree: DEGREE_OPTIONS[0],
  major: "",
  currentRole: "",
  company: "",
  location: "",
  country: "",
  industry: INDUSTRY_OPTIONS[0],
  bio: "",
  isMentor: true,
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2FA OTP state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("123456");
  const [otpError, setOtpError] = useState<string | null>(null);

  // Re-submission state
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Pending success state
  const [registeredPending, setRegisteredPending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const resubmitParam = searchParams.get("resubmit");

    if (emailParam) {
      update("email", emailParam);
      if (resubmitParam === "true") {
        setIsResubmitting(true);
        fetch(`/api/auth/alumni/resubmit-info?email=${encodeURIComponent(emailParam)}`)
          .then((res) => res.json())
          .then((json) => {
            if (json.data) {
              const d = json.data;
              if (d.rejectionReason) setRejectionReason(d.rejectionReason);
              if (d.name) update("name", d.name);
              if (d.studentId) update("studentId", d.studentId);
              if (d.classYear) update("classYear", d.classYear);
              if (d.degree) update("degree", d.degree);
              if (d.major) update("major", d.major);
              if (d.currentRole) update("currentRole", d.currentRole);
              if (d.company) update("company", d.company);
              if (d.location) update("location", d.location);
              if (d.country) update("country", d.country);
              if (d.industry) update("industry", d.industry);
              if (d.bio) update("bio", d.bio);
              if (typeof d.isMentor === "boolean") update("isMentor", d.isMentor);
            }
          })
          .catch(() => {});
      }
    }
  }, [searchParams]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleStartVerification(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Alumni Association Bylaws & Data Privacy terms.");
      return;
    }

    // Open 2FA modal
    setOtp("123456");
    setOtpError(null);
    setOtpModalOpen(true);
  }

  async function handleVerifyAndSubmit() {
    if (!otp.trim()) {
      setOtpError("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/alumni/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, otp: otp.trim(), isResubmission: isResubmitting }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error ?? json.issues?.formErrors?.[0] ?? "Registration failed");
        return;
      }

      setOtpModalOpen(false);
      setRegisteredPending(true);
    } catch {
      setOtpError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-slate-200">
      <div className="sticky top-16 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-300 transition-colors hover:text-emerald-400 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
            <span>Back to Portal</span>
          </Link>

          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 md:flex">
            <Link href="/" className="hover:text-emerald-400">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-bold text-white">Graduate Registration</span>
          </div>

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

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-7">
            {registeredPending ? (
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
                  Thank you, <strong className="text-white">{form.name}</strong>. Your alumni profile for Student ID{" "}
                  <strong className="text-emerald-400 font-mono">{form.studentId}</strong> has been authenticated with Two-Factor
                  Verification and submitted to the <strong className="text-white">IPAM Office of the Registrar</strong>.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-left text-xs space-y-2 text-slate-300">
                  <p className="font-bold text-white text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    What happens next?
                  </p>
                  <p>
                    1. <strong>Registrar Review:</strong> Administrators cross-reference your submitted degree and
                    matriculation records against the central SIS registry.
                  </p>
                  <p>
                    2. <strong>Pending State:</strong> To protect student confidentiality, your account remains in a{" "}
                    <span className="text-amber-400 font-bold">Pending Approval</span> state. You will not be able to log in
                    until an administrator signs off.
                  </p>
                  <p>
                    3. <strong>Activation:</strong> Once approved, your digital membership pass is activated and you may sign
                    in anytime.
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
                    <span>Return to Portal</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleStartVerification}
                className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md sm:p-10"
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

                {isResubmitting && (
                  <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-950/60 p-4 text-rose-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                      <span>Application Re-submission Mode</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-200">
                      Your previous registration application was rejected. Please review and update your credentials
                      below:
                    </p>
                    {rejectionReason && (
                      <div className="mt-2 rounded-xl bg-slate-950/80 p-3 border border-rose-500/20 text-xs font-mono text-rose-300">
                        <strong>Reason given:</strong> &quot;{rejectionReason}&quot;
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6 space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>IPAM Registrar Verified &middot; 2FA Protected</span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                    {isResubmitting ? "Re-submit Graduate Profile" : "Register New Graduate Profile"}
                  </h1>
                  <p className="text-xs text-slate-400 sm:text-sm">
                    Submit your graduation records for 2-factor verified registrar authentication and lifetime membership.
                  </p>
                </div>

                <div className="mb-6 flex rounded-2xl border border-slate-800 bg-slate-950 p-1.5 text-xs font-bold">
                  <Link
                    href="/login"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-slate-400 transition-colors hover:text-white"
                  >
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Sign In</span>
                  </Link>
                  <span className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-750 bg-slate-900 py-2.5 font-black text-emerald-400 shadow-md">
                    <GraduationCap className="h-4 w-4 text-emerald-400" />
                    <span>{isResubmitting ? "Re-submit Application" : "Create Account / Register"}</span>
                  </span>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-sm text-rose-300">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="mb-3 border-b border-slate-800 pb-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white">
                      <User className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Academic & Personal Details</span>
                    </h3>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Full Legal Name (as on Degree / Certificate) *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Mohamed Sesay"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">
                        Student ID / Matriculation No *
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. IPAM-2021-9844"
                          value={form.studentId}
                          onChange={(e) => update("studentId", e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 font-mono text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Graduation Year *</label>
                      <select
                        value={form.classYear}
                        onChange={(e) => update("classYear", Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                      >
                        {GRAD_YEARS.map((yr) => (
                          <option key={yr} value={yr} className="bg-slate-900 text-white">
                            Class of {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Degree / Faculty *</label>
                      <select
                        value={form.degree}
                        onChange={(e) => update("degree", e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                      >
                        {DEGREE_OPTIONS.map((d) => (
                          <option key={d} value={d} className="bg-slate-900 text-white">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Major / Specialization *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Software Engineering"
                        value={form.major}
                        onChange={(e) => update("major", e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Current Professional Role</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. Finance Analyst / Founder"
                          value={form.currentRole}
                          onChange={(e) => update("currentRole", e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Current Employer</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. Sierra Cloud Tech Ltd"
                          value={form.company}
                          onChange={(e) => update("company", e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">City / Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. Freetown"
                          value={form.location}
                          onChange={(e) => update("location", e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Country</label>
                      <div className="relative">
                        <Globe2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. Sierra Leone"
                          value={form.country}
                          onChange={(e) => update("country", e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Industry</label>
                    <select
                      value={form.industry}
                      onChange={(e) => update("industry", e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                    >
                      {INDUSTRY_OPTIONS.map((ind) => (
                        <option key={ind} value={ind} className="bg-slate-900 text-white">
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Preferred Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="alex.sesay@alumni.ipam.edu"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="••••••••••••"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
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
                    <p className="mt-1 text-[11px] text-slate-400">Must be at least 8 characters long</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-xs font-semibold text-white focus:outline-emerald-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>
                        I certify that I am a graduate of IPAM and accept the{" "}
                        <span className="font-semibold text-emerald-400 hover:underline">
                          Alumni Association Bylaws &amp; Data Privacy Policy
                        </span>
                        .
                      </span>
                    </label>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-black text-slate-950 shadow-md transition-all hover:bg-emerald-400 hover:shadow-lg active:scale-98 disabled:opacity-60 sm:text-base"
                    >
                      <span>
                        {isResubmitting
                          ? "Proceed to 2FA & Re-submit Profile"
                          : "Proceed to 2FA Verification & Submit"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Value Prop Column */}
          <div className="space-y-6 lg:col-span-5">
            <div className="relative space-y-6 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative z-10 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950 text-emerald-400">
                  <GraduationCap className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white sm:text-2xl">Why Register with IPAM Alumni?</h3>
                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                  Join graduates advancing governance, technology, banking, and commerce worldwide.
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
                &quot;The IPAM Alumni platform connects our brightest minds across continents. Registering takes just
                two minutes and opens doors to lifelong leadership.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Factor Authentication Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Two-Factor Authentication</h3>
                  <p className="text-[11px] text-slate-400">Security Verification Code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3.5 text-xs text-emerald-200">
              <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Demonstration Test Environment
              </p>
              <p className="mt-1 text-slate-300">
                A verification code has been dispatched. For this test environment, enter default OTP:
              </p>
              <div className="mt-2 text-center">
                <span className="inline-block rounded-lg bg-emerald-900/80 px-4 py-1 font-mono text-base font-black tracking-widest text-emerald-300 border border-emerald-500/40">
                  123456
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                Enter 6-Digit Verification Code *
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black rounded-xl border border-slate-800 bg-slate-950 py-3 text-white focus:outline-emerald-500"
              />
              {otpError && (
                <p className="mt-2 text-center text-xs font-semibold text-rose-400">{otpError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-750 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleVerifyAndSubmit}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{loading ? "Verifying…" : "Verify & Complete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 py-20 text-center text-slate-400">Loading registration…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
