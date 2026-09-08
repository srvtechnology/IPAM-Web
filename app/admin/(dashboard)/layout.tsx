import { redirect } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/admin.css";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import { AdminSessionProvider, type AdminSessionUser } from "@/lib/admin/context";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter-admin" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code-admin" });

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: { include: { permissions: true } } },
  });
  if (!admin || admin.status !== "ACTIVE") redirect("/admin/login");

  const permissions = getEffectivePermissions(admin);
  const themeSetting = await db.systemSetting.findUnique({ where: { key: "default_theme" } });
  const defaultTheme = themeSetting?.value === "light" ? "light" : "dark";
  const sessionUser: AdminSessionUser = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    title: admin.title,
    department: admin.department,
    avatarUrl: admin.avatarUrl,
    roleId: admin.role.id,
    roleName: admin.role.name,
    roleSlug: admin.role.slug,
  };

  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
      <AdminSessionProvider admin={sessionUser} permissions={permissions} defaultTheme={defaultTheme}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </AdminSessionProvider>
    </div>
  );
}
