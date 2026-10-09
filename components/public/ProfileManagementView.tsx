"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  User,
  Camera,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Building2,
  MapPin,
  Globe2,
  Linkedin,
  HeartHandshake,
  Tag,
  Plus,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useApp } from "@/lib/public/context";

interface ProfileData {
  id?: string;
  name: string;
  avatar: string | null;
  classYear: number;
  degree: string;
  major: string;
  currentRole: string;
  company: string;
  location: string;
  country: string;
  industry: string;
  isMentor: boolean;
  bio: string;
  linkedin: string | null;
  skills?: { skill: string }[];
}

const COMMON_SKILLS = [
  "Public Policy",
  "Financial Management",
  "Internal Audit",
  "Strategic Governance",
  "Accounting",
  "Data Analysis",
  "Project Management",
  "Banking Operations",
  "Tax Compliance",
  "Human Resources",
  "Information Systems",
  "Legal Compliance",
];

const POPULAR_INDUSTRIES = [
  "Banking & Financial Services",
  "Public Sector & Governance",
  "Information Technology & FinTech",
  "Accounting & Taxation",
  "Consulting & Advisory",
  "Healthcare Administration",
  "Education & Research",
  "Telecommunications",
  "Non-Profit & International NGOs",
];

export default function ProfileManagementView({
  initialProfile,
  userEmail,
  studentId,
  membershipTier,
}: {
  initialProfile: ProfileData | null;
  userEmail: string;
  studentId: string;
  membershipTier: string;
}) {
  const { setSession, refreshSession, setIsSubscriptionModalOpen } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialSkillsList = Array.isArray(initialProfile?.skills)
    ? initialProfile.skills.map((s) => (typeof s === "string" ? s : (s as { skill?: string })?.skill || "")).filter(Boolean)
    : [];

  const [form, setForm] = useState({
    name: initialProfile?.name || "",
    avatar: initialProfile?.avatar || null,
    classYear: initialProfile?.classYear || new Date().getFullYear(),
    degree: initialProfile?.degree || "",
    major: initialProfile?.major || "",
    currentRole: initialProfile?.currentRole || "",
    company: initialProfile?.company || "",
    location: initialProfile?.location || "Freetown",
    country: initialProfile?.country || "Sierra Leone",
    industry: initialProfile?.industry || "Public Sector & Governance",
    isMentor: Boolean(initialProfile?.isMentor),
    bio: initialProfile?.bio || "",
    linkedin: initialProfile?.linkedin || "",
    skills: initialSkillsList,
  });

  const [newSkillInput, setNewSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 5MB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Data = canvas.toDataURL("image/jpeg", 0.85);
          setForm((prev) => ({ ...prev, avatar: base64Data }));
          setSuccessMsg("Profile photo uploaded as Base64! Click 'Save Profile Changes' below.");
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setForm((prev) => ({ ...prev, avatar: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccessMsg("Photo removed. Save changes to update your profile.");
  }

  function handleAddSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed || form.skills.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setNewSkillInput("");
  }

  function handleRemoveSkill(skillToRemove: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const cleanSkills = (form.skills || [])
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);

      const payload = {
        ...form,
        skills: cleanSkills,
      };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        let msg = json.error || "Failed to update profile";
        if (json.issues?.fieldErrors) {
          const errorEntries = Object.entries(json.issues.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`);
          if (errorEntries.length > 0) {
            msg = `${json.error || "Validation error"}: ${errorEntries.join(" • ")}`;
          }
        }
        throw new Error(msg);
      }

      const updated = json.data?.profile || json.data;
      if (updated) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                profile: {
                  id: updated.id,
                  name: updated.name,
                  avatar: updated.avatar,
                  classYear: updated.classYear,
                  degree: updated.degree,
                  major: updated.major,
                },
              }
            : null
        );
        await refreshSession();
      }

      setSuccessMsg("Your official alumni profile has been saved successfully!");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-bold text-white">Profile Management</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Alumni Profile &amp; Avatar</h1>
          <p className="mt-1 text-xs text-slate-400">
            Keep your official institutional records, contact channels, and career credentials up to date.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/subscription"
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/60 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Manage Subscription</span>
          </Link>
          <Link
            href="/pass"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <span>View Digital Pass</span>
          </Link>
        </div>
      </div>

      {/* Account Identity Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Verified Alumni Member Record</p>
              <p className="text-xs text-slate-400">{userEmail} • Student ID: {studentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-950/80 px-3 py-1 text-xs font-extrabold text-emerald-300">
              Tier: {membershipTier.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/70 p-4 text-xs font-semibold text-emerald-300 shadow-md">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/70 p-4 text-xs font-semibold text-rose-300 shadow-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Upload Section (Base64) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>Profile Photo &amp; Avatar (Base64 System)</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt={form.name}
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-emerald-500/50 shadow-2xl"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-950 text-3xl font-black text-emerald-300 ring-4 ring-emerald-500/30 shadow-2xl">
                  {form.name ? form.name.charAt(0) : "P"}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg ring-2 ring-slate-900 transition-transform hover:scale-110"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h3 className="text-sm font-bold text-white">Custom Profile Headshot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your picture from your computer. Our client-side system automatically optimizes and converts the image to a secure Base64 data string, visible across your Digital ID Card, Member Directory profile, and job applicant submissions.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/80 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose Photo File</span>
                </button>
                {form.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/60 transition-colors shadow-sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>Academic Credentials</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Class Year (Graduation) *</label>
              <input
                type="number"
                required
                min={1960}
                max={2035}
                value={form.classYear}
                onChange={(e) => setForm({ ...form, classYear: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Degree Title *</label>
              <input
                type="text"
                required
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Major / Discipline *</label>
              <input
                type="text"
                required
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Professional Career &amp; Employment</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Current Job Title *</label>
              <input
                type="text"
                required
                value={form.currentRole}
                onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Industry Sector *</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              >
                {POPULAR_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Country *</label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">City / Region *</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">LinkedIn Profile Link</label>
              <input
                type="url"
                value={form.linkedin || ""}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Mentorship Toggle */}
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={form.isMentor}
              onChange={(e) => setForm({ ...form, isMentor: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
                Available to Mentor Fellow Alumni &amp; Graduating Students
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Displays the verified mentor badge in directory search results.
              </span>
            </div>
          </label>
        </div>

        {/* Skills Tag Management */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Skills &amp; Key Competencies</span>
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill(newSkillInput);
                }
              }}
              placeholder="Type a skill and press Enter..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(newSkillInput)}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-300"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-emerald-400 hover:text-rose-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Recommended:</span>
            <div className="flex flex-wrap gap-1">
              {COMMON_SKILLS.filter((s) => !form.skills.includes(s)).slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddSkill(suggestion)}
                  className="rounded-md border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 hover:border-emerald-500 hover:text-white transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Alumni Biography &amp; Professional Statement
          </label>
          <textarea
            rows={5}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
            placeholder="Share your career achievements, leadership roles, and how IPAM contributed to your success..."
          />
          <span className="text-[11px] text-slate-500 block text-right">
            {form.bio.length}/2000 characters
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
