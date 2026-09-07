import { clearAlumniSessionCookie } from "@/lib/auth/session";
import { ok } from "@/lib/api-response";

export async function POST() {
  await clearAlumniSessionCookie();
  return ok({ loggedOut: true });
}
