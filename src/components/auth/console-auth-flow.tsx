"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import {
  loginAdmin,
  verifyAdminLoginTotp,
  verifyAdminRecoveryCode,
  verifyAdminTotpEnrollment,
} from "@/lib/auth/session-actions";

type AuthStep = "landing" | "password" | "enroll" | "verify";

type ChallengeState = {
  challengeToken: string;
  nextStep: "TOTP_ENROLL" | "TOTP_VERIFY";
  qrCodeDataUrl?: string;
  manualEntryKey?: string;
};

type ConsoleAuthFlowProps = {
  initialShowLogin?: boolean;
  dashboardPath?: string;
};

function goToDashboard(path: string) {
  // Full navigation so cookies are applied and Apollo cache starts clean.
  window.location.assign(path);
}

function apolloErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function ConsoleAuthFlow({
  initialShowLogin = false,
  dashboardPath = "/dashboard",
}: ConsoleAuthFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>(
    initialShowLogin ? "password" : "landing",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoSubmitRef = useRef(false);

  function closeLogin() {
    setChallenge(null);
    setError(null);
    setCode("");
    setPassword("");
    setUseRecoveryCode(false);
    autoSubmitRef.current = false;
    if (initialShowLogin) {
      router.replace("/");
      return;
    }
    setStep("landing");
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await loginAdmin({ email: email.trim(), password });
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setChallenge({
        challengeToken: result.challengeToken,
        nextStep: result.nextStep,
        qrCodeDataUrl: result.qrCodeDataUrl ?? undefined,
        manualEntryKey: result.manualEntryKey ?? undefined,
      });
      setCode("");
      autoSubmitRef.current = false;
      setStep(result.nextStep === "TOTP_ENROLL" ? "enroll" : "verify");
      setLoading(false);
    } catch (err) {
      setError(apolloErrorMessage(err, "Invalid username/email or password"));
      setLoading(false);
    }
  }

  async function verifyChallenge(nextCode: string, recovery: boolean) {
    if (!challenge || loading) return;
    setLoading(true);
    setError(null);

    try {
      const input = { challengeToken: challenge.challengeToken, code: nextCode };
      const result = recovery
        ? await verifyAdminRecoveryCode(input)
        : step === "enroll"
          ? await verifyAdminTotpEnrollment(input)
          : await verifyAdminLoginTotp(input);

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        autoSubmitRef.current = false;
        return;
      }

      goToDashboard(dashboardPath);
    } catch (err) {
      setError(apolloErrorMessage(err, "Could not verify the code"));
      setLoading(false);
      autoSubmitRef.current = false;
    }
  }

  async function onVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyChallenge(code, useRecoveryCode && step === "verify");
  }

  useEffect(() => {
    if (step !== "verify" && step !== "enroll") return;
    if (useRecoveryCode) return;
    if (code.length !== 6) {
      autoSubmitRef.current = false;
      return;
    }
    if (autoSubmitRef.current || loading || !challenge) return;
    autoSubmitRef.current = true;
    void verifyChallenge(code, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional auto-submit on 6 digits
  }, [code, step, useRecoveryCode, loading, challenge]);

  const showForm = step !== "landing";

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
                Secure main console access for SuperAdmin operations across the
                Cube Core platform.
              </p>
              <Button size="lg" asChild>
                <Link href="/login">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </>
          ) : (
            <div className="max-w-md rounded-2xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {step === "enroll"
                      ? "Set up two-factor authentication"
                      : step === "verify"
                        ? "Enter verification code"
                        : "Sign in to Cube Core"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step === "enroll"
                      ? "Scan the QR code, then enter the 6-digit code from your authenticator."
                      : step === "verify"
                        ? "Enter the 6-digit code from your authenticator app."
                        : "SuperAdmin main console access."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={closeLogin}
                  aria-label="Close form"
                  disabled={loading}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {step === "password" ? (
                <form className="space-y-4" onSubmit={onPasswordSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="landing-email">Username or email</Label>
                    <Input
                      id="landing-email"
                      type="text"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <PasswordField
                    id="landing-password"
                    value={password}
                    onChange={setPassword}
                    disabled={loading}
                  />
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Continuing…" : "Continue"}
                  </Button>
                </form>
              ) : null}

              {step === "enroll" ? (
                <form className="space-y-4" onSubmit={onVerifySubmit}>
                  {challenge?.qrCodeDataUrl ? (
                    <div className="flex justify-center rounded-lg border border-border bg-background p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={challenge.qrCodeDataUrl}
                        alt="Authenticator QR code"
                        className="size-48"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Preparing authenticator setup…
                    </p>
                  )}
                  {challenge?.manualEntryKey ? (
                    <div className="space-y-1.5">
                      <Label>Manual setup key</Label>
                      <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs tracking-wider">
                        {challenge.manualEntryKey}
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="totp-code">6-digit code</Label>
                    <Input
                      id="totp-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        setError(null);
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      }}
                      required
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing you in…" : "Verify and activate 2FA"}
                  </Button>
                </form>
              ) : null}

              {step === "verify" ? (
                <form className="space-y-4" onSubmit={onVerifySubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="verify-code">
                      {useRecoveryCode ? "Recovery code" : "6-digit code"}
                    </Label>
                    <Input
                      id="verify-code"
                      inputMode={useRecoveryCode ? "text" : "numeric"}
                      autoComplete="one-time-code"
                      pattern={useRecoveryCode ? undefined : "[0-9]{6}"}
                      maxLength={useRecoveryCode ? 64 : 6}
                      value={code}
                      onChange={(e) => {
                        setError(null);
                        setCode(
                          useRecoveryCode
                            ? e.target.value.trim().toUpperCase()
                            : e.target.value.replace(/\D/g, "").slice(0, 6),
                        );
                      }}
                      required
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                    disabled={loading}
                    onClick={() => {
                      setUseRecoveryCode((v) => !v);
                      setCode("");
                      setError(null);
                      autoSubmitRef.current = false;
                    }}
                  >
                    {useRecoveryCode
                      ? "Use authenticator code instead"
                      : "Use a recovery code"}
                  </button>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing you in…" : "Verify and sign in"}
                  </Button>
                </form>
              ) : null}
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
