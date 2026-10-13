"use client";

import { useState, type FormEvent } from "react";
import { useLeadership } from "@/hooks/admin/useLeadership";

export interface LeadershipAdminItem {
  id: string;
  name: string;
  role: string;
  classYear: string;
  image: string | null;
  bio: string;
  quote: string;
  email: string;
  initiatives?: { id: number; title: string }[];
}

const PRESET_AVATARS = [
  {
    label: "Prof. Aminata (President)",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsuL2S9s6sSIlISq3h7KL6-B0R7bx6LoT7A1zMV7Gefwcqg9gKchBTyLVaXC-eGBO4VYMSy6ylDo2C0qcKvfaxlLsL2QPdz_OgFLT2roVRd-zmsEuNQg1wjCn8fTH3uqamfM3-OhOVc7M8lyaOcsoTKVJ-cQeb_eSHGcJo0PXPi767uc89Oq4N5Enn3bYYil8d1LLvu0mYz7xJ2BqLHf-WUZ3L1j7PB0SsEewid-_8dSNE9lZob3y2",
  },
  {
    label: "Marcus Thorne (Secretary)",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_WKPQ7aK_zObvddw9LpJ_IVp5ME68iSknd7QdTkh0ytTIb54x6tQix3yNJqV2U9_3is-6mMnvycN3JijjFiFLn3OezWI5ZDiWsFEXwAWzS4Wu2IH5E23ALjw2QTtNvaOXYgUhKVn3YCVXAl0-Ra5jKPIwqfpGlqcCecschb7ql-fYW6f52EGgDlOBEAV9Q2EO-Rv7hibjhzU_z5tmhNLInzHWywTRzt2RBoOmhDLsXnz_L4V-yOWp",
  },
  {
    label: "Elena Rodriguez (Treasurer)",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCS-NRqSAAcl0_OJslI41htFs9MZZD4KwiPZO2G5RGs8WReNqmyJoiG5Nib3PiWjDZSTiEnlGGq0vgY5tau-fBMyHi7JY6_hUliWrISs_jmMdaBR0b62sBxckmyApak3LKaK3VkjgQSL5dA66cObulhOzHXijuen4QyIq6PBDbRpiP7vsLR1O10a3rESoaXnTYvjeOOIOBH2oWRUzqw7CjFwqRkOS9mdAPaMtUjIWd16R5-rwZv3mZF",
  },
  {
    label: "David Okoro (VP Outreach)",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoDJ3459AtBhITEgI-DmIWmP2qjFktqreunpYDWbmXMFLHI48d52px0MVMdKqUwGhlg9YTo6UucW6Hjbq2YyxDThGUXFYe6EfjtTclQLVcEAMSG9jSiGE1BCwswn1p7V12MTVHYqasZW_TcL7zQ9TasJ3EhKRr7J3M93DXQk2JixzycfSlIEu8-qVx6BVQFmkic5u3pB5dy8paULxslw41hRY41cG_VypXLHe1JvkU-tVq2YfCoWmR",
  },
];

const SUGGESTED_ROLES = [
  "President, IPAM Alumni Association",
  "Secretary General",
  "Treasurer",
  "VP Outreach",
  "VP Academic Affairs",
  "Director of Global Chapters",
  "Director of Mentorship & Careers",
  "Chair of Strategic Initiatives",
];

export default function CreateEditLeaderModal({
  leader,
  onClose,
}: {
  leader?: LeadershipAdminItem | null;
  onClose: () => void;
}) {
  const isEditing = Boolean(leader);
  const { createLeader, updateLeader, loading, error } = useLeadership();

  const [name, setName] = useState(leader?.name ?? "");
  const [role, setRole] = useState(leader?.role ?? "");
  const [classYear, setClassYear] = useState(leader?.classYear ?? "");
  const [email, setEmail] = useState(leader?.email ?? "");
  const [image, setImage] = useState(leader?.image ?? "");
  const [bio, setBio] = useState(leader?.bio ?? "");
  const [quote, setQuote] = useState(leader?.quote ?? "");
  const [initiatives, setInitiatives] = useState<string[]>(() => {
    if (leader?.initiatives && leader.initiatives.length > 0) {
      return leader.initiatives.map((i) => i.title);
    }
    return [""];
  });

  function handleAddInitiative() {
    setInitiatives((prev) => [...prev, ""]);
  }

  function handleInitiativeChange(index: number, val: string) {
    setInitiatives((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  }

  function handleRemoveInitiative(index: number) {
    setInitiatives((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      role: role.trim(),
      classYear: classYear.trim(),
      email: email.trim(),
      image: image.trim() || null,
      bio: bio.trim(),
      quote: quote.trim(),
      initiatives: initiatives.map((i) => i.trim()).filter(Boolean),
    };

    let result;
    if (isEditing && leader) {
      result = await updateLeader(leader.id, payload);
    } else {
      result = await createLeader(payload);
    }

    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20 max-h-[90vh] flex flex-col my-auto animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">
              {isEditing ? "manage_accounts" : "person_add"}
            </span>
            <h2 className="font-headline-md text-on-surface">
              {isEditing ? "Edit Global Leader" : "Add Global Leader"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="my-3 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact flex-shrink-0">
            {error}
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-4 overflow-y-auto pr-1 py-3 flex-1">
          {/* Avatar Preview & URL */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-secondary bg-surface-container-highest shadow-xs">
              {image ? (
                <img src={image} alt={name || "Leader"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-secondary">
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="font-body-compact text-on-surface-variant block">
                Profile Photo URL
                <input
                  type="url"
                  placeholder="https://.../headshot.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 font-body-default text-on-surface outline-none focus:border-secondary text-sm"
                />
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-body-compact text-on-surface-variant">Presets:</span>
                {PRESET_AVATARS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImage(p.url)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container hover:bg-secondary/20 hover:text-secondary text-on-surface-variant border border-outline-variant/20 transition-colors"
                  >
                    {p.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="font-body-compact text-on-surface-variant block">
              Full Name *
              <input
                required
                placeholder="e.g. Prof. Aminata Bangura"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
              />
            </label>

            <div>
              <label className="font-body-compact text-on-surface-variant block">
                Executive Role / Title *
                <input
                  required
                  list="roles-list"
                  placeholder="e.g. President, IPAM Alumni Association"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
                />
                <datalist id="roles-list">
                  {SUGGESTED_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </label>
            </div>
          </div>

          {/* Class Year & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="font-body-compact text-on-surface-variant block">
              Class Year *
              <input
                required
                placeholder="e.g. 1998, 2005, Class of '12"
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
              />
            </label>

            <label className="font-body-compact text-on-surface-variant block">
              Official Email *
              <input
                required
                type="email"
                placeholder="e.g. leadership@alumni.ipam.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
              />
            </label>
          </div>

          {/* Bio */}
          <label className="font-body-compact text-on-surface-variant block">
            Executive Bio &amp; Background *
            <textarea
              required
              rows={3}
              placeholder="Highlight education, career achievements, and contributions to IPAM..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary resize-none"
            />
          </label>

          {/* Personal Quote */}
          <label className="font-body-compact text-on-surface-variant block">
            Vision Statement / Personal Quote *
            <textarea
              required
              rows={2}
              placeholder="Inspiring quote or leadership vision statement for the alumni community..."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary resize-none"
            />
          </label>

          {/* Strategic Initiatives */}
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-body-compact text-on-surface font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">flag</span>
                Strategic Initiatives &amp; Portfolios
              </label>
              <button
                type="button"
                onClick={handleAddInitiative}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Add Initiative
              </button>
            </div>

            <div className="space-y-2">
              {initiatives.map((init, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`e.g. Priority Initiative #${idx + 1}`}
                    value={init}
                    onChange={(e) => handleInitiativeChange(idx, e.target.value)}
                    className="flex-1 rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 font-body-compact text-on-surface outline-none focus:border-secondary text-sm"
                  />
                  {initiatives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInitiative(idx)}
                      className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/20 transition-colors"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-body-medium font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
            {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Leader"}
          </button>
        </div>
      </form>
    </div>
  );
}
