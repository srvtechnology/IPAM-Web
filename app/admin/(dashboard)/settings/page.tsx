import { db } from "@/lib/db";
import SystemSettingsView from "@/components/admin/settings/SystemSettingsView";

export default async function SettingsPage() {
  const setting = await db.systemSetting.findUnique({ where: { key: "default_theme" } });
  const orgDefaultTheme = setting?.value === "light" ? "light" : "dark";

  return <SystemSettingsView orgDefaultTheme={orgDefaultTheme} />;
}
