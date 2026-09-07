import { SignJWT, jwtVerify } from "jose";

const alumniSecret = new TextEncoder().encode(
  process.env.JWT_ALUMNI_SECRET ?? "dev-alumni-secret-change-me"
);
const adminSecret = new TextEncoder().encode(
  process.env.JWT_ADMIN_SECRET ?? "dev-admin-secret-change-me"
);

export interface AlumniTokenPayload {
  sub: string;
  email: string;
}

export interface AdminTokenPayload {
  sub: string;
  email: string;
  roleId: string;
  roleSlug: string;
}

const ALUMNI_TTL = "7d";
const ADMIN_TTL = "8h";

export async function signAlumniToken(payload: AlumniTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ALUMNI_TTL)
    .sign(alumniSecret);
}

export async function verifyAlumniToken(token: string): Promise<AlumniTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, alumniSecret);
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TTL)
    .sign(adminSecret);
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, adminSecret);
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.roleId !== "string" ||
      typeof payload.roleSlug !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      roleId: payload.roleId,
      roleSlug: payload.roleSlug,
    };
  } catch {
    return null;
  }
}
