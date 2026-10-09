import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";
import { seedDefaultSubscriptionTiers } from "@/lib/subscription-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "FINANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  let configs = await db.subscriptionTierConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });

  if (configs.length === 0) {
    await seedDefaultSubscriptionTiers();
    configs = await db.subscriptionTierConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  return ok(configs);
}
