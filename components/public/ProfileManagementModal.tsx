"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
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
  Sparkles,
  HeartHandshake,
  Tag,
  Plus,
  Loader2,
} from "lucide-react";
import { useApp } from "@/lib/public/context";

interface ProfileData {
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
  linkedin: string;
  skills: string[];
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

export default function ProfileManagementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { session, setSession, refreshSession } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileData>({
    name: "",
    avatar: null,
    classYear: new Date().getFullYear(),
    degree: "",
    major: "",
    currentRole: "",
    company: "",
    location: "Freetown",
    country: "Sierra Leone",
    industry: "Public Sector & Governance",
    isMentor: false,
    bio: "",
    linkedin: "",
    skills: [],
  });

  const [newSkillInput, setNewSkillInput] = useState("");

  // Load existing profile from API when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setFetching(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    fetch("/api/profile")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const p = json.data?.profile || json.data;
        if (p) {
          const skillsList = Array.isArray(p.skills)
            ? p.skills.map((s: unknown) => (typeof s === "string" ? s : (s as { skill?: string })?.skill || "")).filter(Boolean)
            : [];
          setForm({
            name: p.name || "",
            avatar: p.avatar || null,
            classYear: p.classYear || new Date().getFullYear(),
            degree: p.degree || "",
            major: p.major || "",
            currentRole: p.currentRole || "",
            company: p.company || "",
            location: p.location || "Freetown",
            country: p.country || "Sierra Leone",
            industry: p.industry || "Banking & Financial Services",
            isMentor: Boolean(p.isMentor),
            bio: p.bio || "",
            linkedin: p.linkedin || "",
            skills: skillsList,
          });
        } else if (session?.profile) {
          setForm((prev) => ({
            ...prev,
            name: session.profile?.name || "",
            avatar: session.profile?.avatar || null,
            classYear: session.profile?.classYear || new Date().getFullYear(),
            degree: session.profile?.degree || "",
            major: session.profile?.major || "",
          }));
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg("Failed to load profile data");
      })
      .finally(() => {
        if (isMounted) setFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, session]);

  // Handle Base64 Profile Picture Upload with resizing for optimal size & speed
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
        // Resize image to max 500x500 square for fast base64 storage
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
          setSuccessMsg("Photo loaded! Click 'Save Changes' to update your account.");
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
    setSuccessMsg("Profile photo removed. Save changes to confirm.");
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
        // Update local session immediately so header avatar & name update
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

      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while saving profile.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Alumni Profile Management</h2>
              <p className="text-xs text-slate-400">Update your public biography, professional credentials, and avatar photo.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {fetching ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-xs font-semibold text-slate-400">Loading your profile record...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
            {/* Feedback Alerts */}
            {successMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-3.5 text-xs font-semibold text-emerald-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/60 p-3.5 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Profile Picture Upload Section (Base64) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group shrink-0">
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt={form.name}
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-emerald-500/50 shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-950 text-2xl font-black text-emerald-300 ring-4 ring-emerald-500/30 shadow-lg">
                      {form.name ? form.name.charAt(0) : "P"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md ring-2 ring-slate-900 transition-transform hover:scale-110"
                    title="Change Profile Photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="text-sm font-bold text-white">Profile Photo (Base64 System)</h3>
                  <p className="text-xs text-slate-400">
                    Upload a high-resolution headshot for your digital pass and directory card. Supported formats: JPEG, PNG, WebP (auto-optimized as Base64).
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
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
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/80 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload New Photo</span>
                    </button>
                    {form.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-950/60 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic & Personal Identity */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <GraduationCap className="h-4 w-4" />
                <span>Academic &amp; Graduate Identity</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal / Alumni Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Dr. Alex Sesay"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Graduation Class Year *</label>
                  <input
                    type="number"
                    required
                    min={1970}
                    max={2030}
                    value={form.classYear}
                    onChange={(e) => setForm({ ...form, classYear: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="2018"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Conferred Degree *</label>
                  <input
                    type="text"
                    required
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="e.g. B.Sc. Public Administration"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Major / Specialization *</label>
                  <input
                    type="text"
                    required
                    value={form.major}
                    onChange={(e) => setForm({ ...form, major: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Governance & Financial Policy"
                  />
                </div>
              </div>
            </div>

            {/* Professional & Career Identity */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <Briefcase className="h-4 w-4" />
                <span>Career &amp; Professional Information</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Current Job Title / Role *</label>
                  <input
                    type="text"
                    required
                    value={form.currentRole}
                    onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Senior Financial Analyst"
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
                    placeholder="e.g. Bank of Sierra Leone"
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
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
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
                    placeholder="e.g. Sierra Leone"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City / Location *</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Freetown"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={form.linkedin}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>
              </div>

              {/* Mentorship Availability Toggle */}
              <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isMentor}
                  onChange={(e) => setForm({ ...form, isMentor: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
                    Open to Mentoring Younger Alumni &amp; IPAM Students
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Display the &quot;Available for Mentorship&quot; badge on your directory profile card.
                  </span>
                </div>
              </label>
            </div>

            {/* Skills & Expertise Management */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <Tag className="h-4 w-4" />
                <span>Skills &amp; Functional Competencies</span>
              </h3>
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
                  placeholder="Add a core skill (e.g. Risk Audit, Python)..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkillInput)}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Added Skills Tags */}
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

              {/* Suggestions */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Quick add suggestions:</span>
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

            {/* Biography */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Alumni Biography &amp; Professional Statement
              </label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                placeholder="Share your career journey, leadership experience, and how IPAM shaped your path..."
              />
              <span className="text-[11px] text-slate-500 block text-right">
                {form.bio.length}/2000 characters
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
