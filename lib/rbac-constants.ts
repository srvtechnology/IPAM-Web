import type { PermissionModule } from "@prisma/client";

/**
 * Human-readable labels/descriptions for the 10 permission modules, ported
 * verbatim (in intent) from the legacy admin portal's
 * PERMISSION_MODULE_DEFINITIONS so the RBAC UI reads the same way.
 */
export const PERMISSION_MODULE_DEFINITIONS: {
  id: PermissionModule;
  name: string;
  category: string;
  description: string;
}[] = [
  {
    id: "DIRECTORY",
    name: "Alumni Directory & 2-Way Auth",
    category: "Alumni Governance",
    description: "View, search, verify biometric statuses, and approve degree records.",
  },
  {
    id: "ID_CARDS",
    name: "Smart ID Card Issuance Desk",
    category: "Bureau & Hardware",
    description: "Manage print press queues, encode RFID chips, and dispatch smart badges.",
  },
  {
    id: "BROADCAST",
    name: "Omnichannel Broadcasts",
    category: "Communications",
    description: "Send SMS, WhatsApp, and email announcements to segmented cohorts.",
  },
  {
    id: "JOBS",
    name: "Job Matching & Recruiters",
    category: "Career & Industry",
    description: "Post job opportunities, review applications, and select candidates.",
  },
  {
    id: "COMMERCIAL",
    name: "Ads & Commercial Banners",
    category: "Sponsorship & Revenue",
    description: "Schedule corporate sponsor banners and generate dual-currency invoices.",
  },
  {
    id: "FINANCE",
    name: "Subscriptions & Finance",
    category: "Sponsorship & Revenue",
    description: "Audit transactions and reconcile treasury accounts.",
  },
  {
    id: "SIS_SYNC",
    name: "IPAM SIS & Central Database",
    category: "System Integration",
    description: "Execute delta synchronization with University of Sierra Leone central nodes.",
  },
  {
    id: "AUDIT_TRAILS",
    name: "Audit Trails & Security Logs",
    category: "Security & Governance",
    description: "Inspect tamper-evident system logs, actor sessions, and event hashes.",
  },
  {
    id: "RBAC_GOVERNANCE",
    name: "RBAC & Role Assignment",
    category: "Security & Governance",
    description: "Assign admin roles, configure granular permissions, and enforce 2FA.",
  },
  {
    id: "SYSTEM_SETTINGS",
    name: "System Governance & API Keys",
    category: "System Core",
    description: "Manage telecom gateway credentials, themes, and registrar signing keys.",
  },
];

export const CAPABILITY_KEYS = ["canRead", "canWrite", "canApprove", "canExport", "canDelete"] as const;

export const CAPABILITY_LABELS: Record<(typeof CAPABILITY_KEYS)[number], string> = {
  canRead: "Read",
  canWrite: "Write",
  canApprove: "Approve",
  canExport: "Export",
  canDelete: "Delete",
};
