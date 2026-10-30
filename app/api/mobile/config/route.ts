import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    appName: "IPAM Alumni Mobile",
    version: "1.0.0",
    buildNumber: 1,
    minSupportedVersion: "1.0.0",
    forceUpdate: false,
    maintenanceMode: false,
    environment: process.env.NODE_ENV || "production",
    features: {
      virtualPass: true,
      physicalCards: true,
      donations: true,
      jobBoard: true,
      events: true,
      mentoring: true,
      commercialMarketplace: true,
      biometricScanner: true,
      stripePayments: true,
      pushNotifications: true,
    },
    notifications: {
      firebaseProjectId: "auratrade-p93c",
      messagingSenderId: "570831339769",
      defaultTopic: "all_alumni",
      channelId: "ipam_alumni_notifications",
      channelName: "IPAM Alumni Official Notifications",
    },
    support: {
      email: "support@ipam.edu",
      phone: "+232 76 112233",
      institution: "Institute of Public Administration and Management (IPAM USL)",
      portalUrl: "https://ipam.billnbite.cloud",
      apiDocsUrl: "https://ipam.billnbite.cloud/api-docs",
      termsUrl: "https://ipam.billnbite.cloud/about",
      privacyUrl: "https://ipam.billnbite.cloud/about",
    },
  });
}
