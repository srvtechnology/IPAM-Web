"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminSession } from "@/lib/admin/context";

export default function Header() {
  const router = useRouter();
  const { admin, theme, toggleTheme } = useAdminSession();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="h-16 flex items-center justify-between gap-4 px-6 border-b border-outline-variant/30 bg-surface-container-lowest/60">
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search alumni, orders, admins…"
            className="bg-transparent outline-none flex-1 font-body-default placeholder:text-on-surface-variant/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {theme === "dark" ? "dark_mode" : "light_mode"}
          </span>
        </button>

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm">
              {admin.name.charAt(0)}
            </div>
            <span className="font-body-medium text-on-surface hidden sm:inline">{admin.name}</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-surface-container shadow-lg ring-1 ring-outline-variant/30 py-1 z-50">
              <div className="px-3 py-2 border-b border-outline-variant/20">
                <p className="font-body-medium text-on-surface truncate">{admin.email}</p>
                <p className="font-body-compact text-on-surface-variant">{admin.roleName}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 font-body-default text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
