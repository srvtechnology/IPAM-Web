"use client";

import { useAdminSession } from "@/lib/admin/context";
import { useSettings } from "@/hooks/admin/useSettings";

export default function SystemSettingsView({ orgDefaultTheme }: { orgDefaultTheme: "dark" | "light" }) {
  const { theme, toggleTheme, can } = useAdminSession();
  const { updateDefaultTheme, saving, error } = useSettings();
  const canWrite = can("SYSTEM_SETTINGS", "canWrite");

  return (
    <div className="space-y-space-xl max-w-4xl">
      <div className="bg-surface-container-low p-space-lg rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-[22px]">settings</span>
          <h2 className="font-headline-lg text-on-surface">System Governance</h2>
        </div>
        <p className="font-body-compact text-on-surface-variant mt-1">
          Configure organization-wide defaults for the admin console.
        </p>
      </div>

      <div className="bg-surface-container p-space-lg rounded-xl shadow-md space-y-space-md">
        <span className="font-headline-sm text-on-surface">Your Personal Theme</span>
        <p className="font-body-compact text-on-surface-variant text-[12px]">
          Saved to this browser only. Overrides the organization default below until cleared.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <ThemeOption
            icon="dark_mode"
            iconColor="text-tertiary"
            label="Dark Theme"
            active={theme === "dark"}
            onClick={() => theme !== "dark" && toggleTheme()}
          />
          <ThemeOption
            icon="light_mode"
            iconColor="text-primary"
            label="Light Theme"
            active={theme === "light"}
            onClick={() => theme !== "light" && toggleTheme()}
          />
        </div>
      </div>

      <div className="bg-surface-container p-space-lg rounded-xl shadow-md space-y-space-md">
        <span className="font-headline-sm text-on-surface">Organization Default Theme</span>
        <p className="font-body-compact text-on-surface-variant text-[12px]">
          Applied to admins who have not set a personal preference on their browser. Currently{" "}
          <strong className="text-on-surface">{orgDefaultTheme}</strong>.
        </p>
        {canWrite ? (
          <div className="flex gap-2">
            <button
              disabled={saving || orgDefaultTheme === "dark"}
              onClick={() => updateDefaultTheme("dark")}
              className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-body-medium disabled:opacity-40"
            >
              Set Org Default: Dark
            </button>
            <button
              disabled={saving || orgDefaultTheme === "light"}
              onClick={() => updateDefaultTheme("light")}
              className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-body-medium disabled:opacity-40"
            >
              Set Org Default: Light
            </button>
          </div>
        ) : (
          <p className="font-body-compact text-on-surface-variant text-[11px]">
            You do not have write access to change the organization default.
          </p>
        )}
        {error && <p className="font-body-compact text-error">{error}</p>}
      </div>
    </div>
  );
}

function ThemeOption({
  icon,
  iconColor,
  label,
  active,
  onClick,
}: {
  icon: string;
  iconColor: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
        active
          ? "bg-surface-container-high/90 border-primary-container ring-2 ring-primary-container/40"
          : "bg-surface-container-low border-outline-variant/30 hover:bg-surface-container-high/50"
      }`}
    >
      <span className={`material-symbols-outlined text-[24px] ${iconColor}`}>{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-body-medium text-[13px] font-semibold text-on-surface">{label}</span>
          {active && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-medium">
              Active
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
