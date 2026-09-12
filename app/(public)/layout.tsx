import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { AppProvider, type PublicSessionUser } from "@/lib/public/context";
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import InfoModals from "@/components/public/InfoModals";
import GlobalVirtualIdModal from "@/components/public/GlobalVirtualIdModal";

async function loadSession(): Promise<PublicSessionUser | null> {
  const token = await getAlumniSession();
  if (!token) return null;

  const user = await db.alumniUser.findUnique({
    where: { id: token.sub },
    include: { profile: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    studentId: user.studentId,
    isVerifiedAlumni: user.isVerifiedAlumni,
    membershipTier: user.membershipTier,
    profile: user.profile
      ? {
          id: user.profile.id,
          name: user.profile.name,
          avatar: user.profile.avatar,
          classYear: user.profile.classYear,
          degree: user.profile.degree,
          major: user.profile.major,
        }
      : null,
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();

  return (
    <AppProvider initialSession={session}>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <InfoModals />
        <GlobalVirtualIdModal />
      </div>
    </AppProvider>
  );
}
