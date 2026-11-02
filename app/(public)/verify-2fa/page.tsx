"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

function Verify2faRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    router.replace(`/register/verify${query}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
        <span className="text-sm font-semibold">Redirecting to Two-Factor Verification…</span>
      </div>
    </div>
  );
}

export default function Verify2faPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
        </div>
      }
    >
      <Verify2faRedirect />
    </Suspense>
  );
}

