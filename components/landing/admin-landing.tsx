"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "signin" | "signup";

export function AdminLanding({
  initialShowLogin = false,
}: {
  initialShowLogin?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode | null>(
    initialShowLogin ? "signin" : null,
  );
  const [email, setEmail] = useState("superadmin@cube-core.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showForm = mode !== null;

  function openAuth(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  function closeAuth() {
    setMode(null);
    setError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Sign up is not implemented yet — both flows use console login for now.
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(
        mode === "signup"
          ? payload.error ?? "Sign up is not available yet. Use Sign In with an existing account."
          : (payload.error ?? "Login failed"),
      );
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-brand-light/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-brand-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-0 size-56 rounded-full bg-primary/10 blur-3xl"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 py-5">
        <Image
          src="/images/cube-logo.webp"
          alt="Cube Core"
          width={280}
          height={72}
          className="h-16 w-auto object-contain sm:h-20"
          priority
        />
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100svh-5.5rem)] w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          {!showForm ? (
            <>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Create. Manage.{" "}
                <span className="text-primary">Publish with Ease.</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                A modern and secure platform to manage your tenants, admins, and
                digital operations — built for a more connected and informed
                organization.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" onClick={() => openAuth("signin")}>
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="max-w-md rounded-2xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {mode === "signup" ? "Sign up for Cube Core" : "Sign in to Cube Core"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "signup"
                      ? "Create access for the management console."
                      : "SuperAdmin, Admin, or Editor console access."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={closeAuth}
                  aria-label="Close form"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="landing-email">Email</Label>
                  <Input
                    id="landing-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="landing-password">Password</Label>
                  <Input
                    id="landing-password"
                    type="password"
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? mode === "signup"
                      ? "Creating…"
                      : "Signing in…"
                    : mode === "signup"
                      ? "Sign up"
                      : "Sign in"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {mode === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => openAuth("signin")}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Need an account?{" "}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => openAuth("signup")}
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          )}
        </section>

        <section className="relative mx-auto flex w-full max-w-xl items-center justify-center lg:max-w-none">
          <div className="relative aspect-square w-full max-w-130">
            <Image
              src="/images/Futuristic-Glowing-Cube-Network.webp"
              alt="Cube Core glowing network illustration"
              fill
              priority
              className="object-contain drop-shadow-xl"
              sizes="(max-width: 1024px) 90vw, 520px"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
