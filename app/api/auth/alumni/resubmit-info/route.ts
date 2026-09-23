import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return fail(400, "Email is required");

  const user = await db.alumniUser.findUnique({
    where: { email },
    include: { profile: true, alumniRecord: true },
  });

  if (!user) return fail(404, "User not found");

  const isRejected = user.status === "REJECTED" || user.alumniRecord?.status === "REJECTED";
  const rejectionReason = user.rejectionReason || user.alumniRecord?.rejectionReason || null;

  return ok({
    isRejected,
    status: user.status,
    rejectionReason,
    email: user.email,
    studentId: user.studentId,
    name: user.profile?.name ?? user.alumniRecord?.name ?? "",
    classYear: user.profile?.classYear ?? user.alumniRecord?.gradYear ?? new Date().getFullYear(),
    degree: user.profile?.degree ?? user.alumniRecord?.degree ?? "",
    major: user.profile?.major ?? user.alumniRecord?.faculty ?? "",
    currentRole: user.profile?.currentRole ?? "",
    company: user.profile?.company ?? "",
    location: user.profile?.location ?? "",
    country: user.profile?.country ?? "",
    industry: user.profile?.industry ?? "General",
    bio: user.profile?.bio ?? "",
    isMentor: user.profile?.isMentor ?? false,
  });
}
