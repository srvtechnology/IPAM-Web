"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSession, type PermissionModuleKey } from "@/lib/admin/context";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  module: PermissionModuleKey | null; // null = always visible to any authenticated admin
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard", module: null },
  { href: "/admin/directory", label: "Alumni Directory & 2-Way Auth", icon: "verified_user", module: "DIRECTORY" },
  { href: "/admin/id-cards", label: "ID Card Issuance Desk", icon: "badge", module: "ID_CARDS" },
  { href: "/admin/broadcast", label: "Omnichannel Broadcast", icon: "campaign", module: "BROADCAST" },
  { href: "/admin/jobs", label: "Job Matching & Recruiters", icon: "work_history", module: "JOBS" },
  { href: "/admin/commercial", label: "Ads & Commercial Banners", icon: "ad_units", module: "COMMERCIAL" },
  { href: "/admin/finance", label: "Subscriptions & Finance", icon: "account_balance_wallet", module: "FINANCE" },
  { href: "/admin/reports", label: "Reports & Analytics", icon: "query_stats", module: null },
  { href: "/admin/audit-trails", label: "Audit Trails & Security", icon: "history_edu", module: "AUDIT_TRAILS" },
  { href: "/admin/rbac", label: "RBAC & Access Control", icon: "admin_panel_settings", module: "RBAC_GOVERNANCE" },
  { href: "/admin/sync", label: "IPAM API Sync & Logs", icon: "terminal", module: "SIS_SYNC" },
  { href: "/admin/settings", label: "System Settings", icon: "settings", module: "SYSTEM_SETTINGS" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { can, admin } = useAdminSession();

  const visibleItems = NAV_ITEMS.filter((item) => !item.module || can(item.module, "canRead"));

  return (
    <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col bg-surface-container-low border-r border-outline-variant/30">
      <div className="h-16 px-4 flex items-center gap-3 border-b border-outline-variant/30 bg-surface-container-lowest/60">
        <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm">
          IP
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-headline-sm text-on-surface truncate tracking-tight">IPAM Admin</span>
          <span className="font-table-header text-on-surface-variant uppercase tracking-wider truncate">
            Sierra Leone Core
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-2 mb-1 font-table-header uppercase text-on-surface-variant/70 tracking-wider">
          Administrative Modules
        </div>
        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  isActive
                    ? "bg-primary-container text-on-primary-container font-headline-sm shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-medium"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-outline-variant/30 bg-surface-container-lowest/80 space-y-2">
        <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
          <p className="font-table-header uppercase text-on-surface-variant">Signed in as</p>
          <p className="font-body-medium text-on-surface truncate mt-0.5">{admin.name}</p>
          <p className="mt-1 font-code-compact text-[10px] text-secondary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="truncate">{admin.roleName}</span>
          </p>
        </div>
        <div className="flex items-center justify-between px-1 font-code-compact text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
            </span>
            System Operational
          </span>
        </div>
      </div>
    </aside>
  );
}
