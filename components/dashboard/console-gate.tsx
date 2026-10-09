"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/lib/graphql/operations";
import { ConsoleShell } from "@/components/dashboard/console-shell";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/lib/types";

type MeData = { me: AuthUser | null };

export function ConsoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, loading, error } = useQuery<MeData>(ME_QUERY);
  const user = data?.me ?? null;
  const ready = !loading && !!user && !error;

  useEffect(() => {
    if (!loading && (!user || error)) {
      router.replace("/");
    }
  }, [loading, user, error, router]);

  // Always keep {children} in the render tree so Next.js Instant Navigation
  // can validate nested segments like /dashboard.
  if (!ready) {
    return (
      <>
        <div className="flex min-h-svh items-center justify-center bg-background p-6">
          <div className="w-full max-w-md space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        </div>
        <div hidden aria-hidden>
          {children}
        </div>
      </>
    );
  }

  return <ConsoleShell user={user}>{children}</ConsoleShell>;
}
