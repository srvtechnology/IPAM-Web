import { clearAdminSessionCookie } from "@/lib/auth/session";
import { ok } from "@/lib/api-response";

export async function POST() {
  await clearAdminSessionCookie();
  return ok({ loggedOut: true });
}
