"use client";

import { ConsoleAuthCard } from "@/components/auth/console-auth-card";
import { Button } from "@/components/ui/button";
import {
  loginAdmin,
  verifyAdminLoginTotp,
  verifyAdminRecoveryCode,
  verifyAdminTotpEnrollment,
} from "@/lib/auth/session-actions";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ConsoleAuthChallenge, ConsoleAuthStep } from "@/types/auth.types";

type AuthStep = ConsoleAuthStep;
type ChallengeState = ConsoleAuthChallenge;

type ConsoleAuthFlowProps = {
  initialShowLogin?: boolean;
  dashboardPath?: string;
  branding?: { managementLogoUrl: string | null; faviconUrl: string | null };
};

function mainAssetUrl(path: string) {
  return `/main-assets/${path.replace(/^\/storage\//, "")}`;
}

function apolloErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function requiresFreshLogin(message: string) {
  return /locked|challenge expired|challenge already used|invalid sign-in challenge|enrollment expired/i.test(
    message,
  );
}

export function ConsoleAuthFlow({
  initialShowLogin = false,
  dashboardPath = "/dashboard",
  branding,
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
      const input = {
        challengeToken: challenge.challengeToken,
        code: nextCode,
      };
      const result = recovery
        ? await verifyAdminRecoveryCode(input)
        : step === "enroll"
          ? await verifyAdminTotpEnrollment(input)
          : await verifyAdminLoginTotp(input);

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        autoSubmitRef.current = false;
        setCode("");
        if (requiresFreshLogin(result.error)) {
          setChallenge(null);
          setUseRecoveryCode(false);
          setStep("password");
        }
        return;
      }

      router.replace(dashboardPath);
    } catch (err) {
      setError(apolloErrorMessage(err, "Could not verify the code"));
      setLoading(false);
      autoSubmitRef.current = false;
      setCode("");
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
  const logoUrl = branding?.managementLogoUrl
    ? mainAssetUrl(branding.managementLogoUrl)
    : null;

  useEffect(() => {
    document
      .querySelector<HTMLLinkElement>("link[data-main-tenant-favicon]")
      ?.remove();
    if (!branding?.faviconUrl) return;
    const link = document.createElement("link");
    link.dataset.mainTenantFavicon = "true";
    link.rel = "icon";
    link.href = `${mainAssetUrl(branding.faviconUrl)}?v=${encodeURIComponent(branding.faviconUrl)}`;
    document.head.appendChild(link);
    return () => link.remove();
  }, [branding?.faviconUrl]);

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

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-5">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Cube Core"
            width={280}
            height={72}
            className="h-12 w-auto object-contain sm:h-14"
            priority
          />
        ) : null}
        <span className="text-sm font-semibold text-foreground sm:text-base">
          Cube Core
        </span>
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
            <ConsoleAuthCard
              step={step}
              email={email}
              password={password}
              code={code}
              useRecoveryCode={useRecoveryCode}
              challenge={challenge}
              error={error}
              loading={loading}
              onClose={closeLogin}
              onPasswordSubmit={onPasswordSubmit}
              onVerifySubmit={onVerifySubmit}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onCodeChange={(value) => {
                setError(null);
                autoSubmitRef.current = false;
                setCode(value);
              }}
              onToggleRecoveryCode={() => {
                setUseRecoveryCode((value) => !value);
                setCode("");
                setError(null);
                autoSubmitRef.current = false;
              }}
            />
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
