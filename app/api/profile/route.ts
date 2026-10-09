import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { updateProfileSchema } from "@/lib/validation/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAlumniSession();
  if (!session) return fail(401, "Authentication required");

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: {
      profile: {
        include: {
          skills: true,
        },
      },
    },
  });

  if (!user) return fail(404, "User not found");
  if (user.status !== "APPROVED") return fail(403, "Account is pending approval");

  const { passwordHash: _omit, ...safeUser } = user;
  return ok({ user: safeUser, profile: user.profile });
}

export async function PATCH(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "Authentication required");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });

  if (!user) return fail(404, "User not found");
  if (user.status !== "APPROVED") return fail(403, "Account is pending approval");

  const {
    name,
    avatar,
    currentRole,
    company,
    industry,
    location,
    country,
    degree,
    major,
    classYear,
    bio,
    linkedin,
    isMentor,
    skills,
  } = parsed.data;

  let profile = user.profile;

  if (profile) {
    profile = await db.alumniMember.update({
      where: { id: profile.id },
      data: {
        name: name || profile.name,
        avatar: avatar !== undefined ? avatar : profile.avatar,
        currentRole: currentRole || profile.currentRole,
        company: company || profile.company,
        industry: industry || profile.industry,
        location: location || profile.location,
        country: country || profile.country,
        degree: degree || profile.degree,
        major: major || profile.major,
        classYear: classYear || profile.classYear,
        bio: bio !== undefined ? bio : profile.bio,
        linkedin: linkedin !== undefined ? linkedin : profile.linkedin,
        isMentor: isMentor !== undefined ? isMentor : profile.isMentor,
      },
    });
  } else {
    profile = await db.alumniMember.create({
      data: {
        userId: user.id,
        name,
        avatar: avatar || null,
        currentRole,
        company,
        industry,
        location,
        country,
        degree,
        major,
        classYear,
        bio,
        linkedin: linkedin || null,
        isMentor,
      },
    });
  }

  // Update skills if provided
  if (Array.isArray(skills)) {
    await db.alumniMemberSkill.deleteMany({
      where: { alumniId: profile.id },
    });

    if (skills.length > 0) {
      const uniqueSkills = Array.from(new Set(skills.map((s) => s.trim()))).filter(Boolean);
      await db.alumniMemberSkill.createMany({
        data: uniqueSkills.map((skill) => ({
          alumniId: profile.id,
          skill,
        })),
      });
    }
  }

  const updatedUser = await db.alumniUser.findUnique({
    where: { id: user.id },
    include: {
      profile: {
        include: {
          skills: true,
        },
      },
    },
  });

  const { passwordHash: _omit, ...safeUser } = updatedUser!;
  const skillNames = (updatedUser?.profile?.skills || []).map((s) => s.skill);
  return ok({
    user: safeUser,
    profile: updatedUser?.profile ? { ...updatedUser.profile, skills: skillNames } : null,
  });
}
