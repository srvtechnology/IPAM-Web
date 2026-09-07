import { cookies } from "next/headers";
import {
  type AdminTokenPayload,
  type AlumniTokenPayload,
  signAdminToken,
  signAlumniToken,
  verifyAdminToken,
  verifyAlumniToken,
} from "@/lib/auth/jwt";

export const ALUMNI_COOKIE = "ipam_alumni_session";
export const ADMIN_COOKIE = "ipam_admin_session";

const isProd = process.env.NODE_ENV === "production";

const ALUMNI_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const ADMIN_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function setAlumniSessionCookie(payload: AlumniTokenPayload) {
  const token = await signAlumniToken(payload);
  const store = await cookies();
  store.set(ALUMNI_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ALUMNI_MAX_AGE,
  });
}

export async function clearAlumniSessionCookie() {
  const store = await cookies();
  store.set(ALUMNI_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAlumniSession(): Promise<AlumniTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ALUMNI_COOKIE)?.value;
  if (!token) return null;
  return verifyAlumniToken(token);
}

export async function setAdminSessionCookie(payload: AdminTokenPayload) {
  const token = await signAdminToken(payload);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    // Path=/ (not /admin): the cookie must also reach /api/admin/* and
    // /api/auth/admin/* which don't share the /admin prefix. Isolation from
    // the alumni cookie comes from the distinct name + secret + payload shape.
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
