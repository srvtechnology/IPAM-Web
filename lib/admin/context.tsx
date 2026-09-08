"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Capability } from "@/lib/auth/permissions";

export type PermissionModuleKey =
  | "DIRECTORY"
  | "ID_CARDS"
  | "BROADCAST"
  | "JOBS"
  | "COMMERCIAL"
  | "FINANCE"
  | "SIS_SYNC"
  | "AUDIT_TRAILS"
  | "RBAC_GOVERNANCE"
  | "SYSTEM_SETTINGS";

export type CapabilitySet = Record<Capability, boolean>;

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  roleSlug: string;
}

interface AdminSessionContextType {
  admin: AdminSessionUser;
  permissions: Partial<Record<PermissionModuleKey, CapabilitySet>>;
  can: (module: PermissionModuleKey, capability: Capability) => boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined);

export const AdminSessionProvider: React.FC<{
  children: React.ReactNode;
  admin: AdminSessionUser;
  permissions: Partial<Record<PermissionModuleKey, CapabilitySet>>;
  /** Org-wide default theme from the SystemSetting table (System Settings
   * module), used only when this browser has no personal localStorage
   * preference saved yet. */
  defaultTheme?: "dark" | "light";
}> = ({ children, admin, permissions, defaultTheme = "dark" }) => {
  const [theme, setTheme] = useState<"dark" | "light">(defaultTheme);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ipam-admin-theme");
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      // localStorage unavailable — keep the org-wide default theme
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("ipam-admin-theme", next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const can = (module: PermissionModuleKey, capability: Capability) =>
    permissions[module]?.[capability] ?? false;

  return (
    <AdminSessionContext.Provider value={{ admin, permissions, can, theme, toggleTheme }}>
      <div data-admin-theme={theme} className="min-h-screen">
        {children}
      </div>
    </AdminSessionContext.Provider>
  );
};

export const useAdminSession = () => {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error("useAdminSession must be used within an AdminSessionProvider");
  return ctx;
};
