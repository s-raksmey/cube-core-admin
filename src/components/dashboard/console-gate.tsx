"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { CURRENT_USER_QUERY } from "@/lib/apollo/operations";
import { ConsoleShell } from "@/components/dashboard/console-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const SESSION_CHECK_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("Session check timed out")),
      timeoutMs,
    );
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  });
}

function isGraphQLResponseError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors)
  );
}

export function ConsoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const redirected = useRef(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { data, loading, error, refetch } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });
  const user = data?.me ?? null;
  const ready = !loading && !!user;

  const retrySession = useCallback(async () => {
    setRetrying(true);
    try {
      const result = await withTimeout(
        refetch(),
        SESSION_CHECK_TIMEOUT_MS,
      );
      if (result.data?.me) {
        setServiceUnavailable(false);
        return;
      }
      if (result.error && !isGraphQLResponseError(result.error)) {
        setServiceUnavailable(true);
        return;
      }
      redirected.current = true;
      router.replace("/login");
    } catch {
      setServiceUnavailable(true);
    } finally {
      setRetrying(false);
    }
  }, [refetch, router]);

  useEffect(() => {
    if (!loading) return;

    const timeout = window.setTimeout(
      () => setServiceUnavailable(true),
      SESSION_CHECK_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (loading || redirected.current) return;

    if (user) return;
    if (error && !isGraphQLResponseError(error)) {
      setServiceUnavailable(true);
      return;
    }

    // `me` is the session authority. A null result means the session is
    // expired/revoked; retrying here would toggle Apollo's loading state and
    // risk an effect-driven request loop.
    redirected.current = true;
    router.replace("/login");
  }, [loading, user, error, router]);

  if (!ready) {
    return (
      <>
        <div className="flex min-h-svh items-center justify-center bg-background p-6">
        {serviceUnavailable ? (
          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-center">
            <div className="space-y-1">
              <h1 className="font-semibold">Couldn’t verify your session</h1>
              <p className="text-sm text-muted-foreground">
                The session check timed out or the server is unavailable. Retry
                when the server is ready, or sign in again.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  redirected.current = true;
                  router.replace("/login");
                }}
              >
                Sign in
              </Button>
              <Button onClick={() => void retrySession()} disabled={retrying}>
                {retrying ? "Retrying…" : "Retry"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <p className="text-center text-sm text-muted-foreground">
              Opening console…
            </p>
          </div>
        )}
        </div>
        <div hidden aria-hidden>
          {children}
        </div>
      </>
    );
  }

  return <ConsoleShell user={user}>{children}</ConsoleShell>;
}
