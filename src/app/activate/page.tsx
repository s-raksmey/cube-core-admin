"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import {
  activateTotp,
  completeActivation,
  validateActivationToken,
} from "@/lib/auth/upstream-actions";

type Step = "credentials" | "totp" | "recovery" | "done";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [manualEntryKey, setManualEntryKey] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validate() {
      if (!token) {
        setValidating(false);
        return;
      }
      const { ok, payload } = await validateActivationToken(token);
      setValidating(false);
      if (!ok) {
        setValid(false);
        return;
      }
      setValid(!!payload.valid);
      setExpiresAt(
        typeof payload.expiresAt === "string" ? payload.expiresAt : null,
      );
      setEmail(typeof payload.email === "string" ? payload.email : "");
      setFirstName(
        typeof payload.firstName === "string" ? payload.firstName : "",
      );
      setLastName(typeof payload.lastName === "string" ? payload.lastName : "");
    }
    void validate();
  }, [token]);

  async function onCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { ok, payload } = await completeActivation({
      token,
      username,
      password,
      confirmPassword,
    });
    setLoading(false);

    if (!ok || typeof payload.challengeToken !== "string") {
      setError(
        typeof payload.error === "string" ? payload.error : "Activation failed",
      );
      return;
    }

    setChallengeToken(payload.challengeToken);
    setQrCodeDataUrl(
      typeof payload.qrCodeDataUrl === "string" ? payload.qrCodeDataUrl : null,
    );
    setManualEntryKey(
      typeof payload.manualEntryKey === "string"
        ? payload.manualEntryKey
        : null,
    );
    setCode("");
    setStep("totp");
  }

  async function onTotpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { ok, payload } = await activateTotp({
      challengeToken,
      code,
      activationToken: token,
    });
    setLoading(false);

    if (!ok) {
      setError(
        typeof payload.error === "string"
          ? payload.error
          : "Verification failed",
      );
      return;
    }

    setRecoveryCodes(
      Array.isArray(payload.recoveryCodes)
        ? payload.recoveryCodes.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    );
    setStep("recovery");
  }

  function finishActivation() {
    setStep("done");
    setTimeout(() => router.replace("/login"), 1200);
  }

  if (validating) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Validating activation link…</p>
      </div>
    );
  }

  if (!token || !valid) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Activation link unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This activation link is invalid, expired, or already used. Ask a
              SuperAdmin for a new link.
            </p>
            <Link href="/login" className="text-primary hover:underline">
              Return to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account activated</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You can sign in with your username or email. Redirecting to login…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "recovery") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Save your recovery codes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Store these somewhere safe. Each code works once if you lose access
              to your authenticator.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid gap-2 rounded-md bg-muted p-3 font-mono text-sm">
              {recoveryCodes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                void navigator.clipboard.writeText(recoveryCodes.join("\n"))
              }
            >
              Copy codes
            </Button>
            <Button type="button" className="w-full" onClick={finishActivation}>
              I saved my codes — continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === "credentials" ? "Activate your account" : "Set up 2FA"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {firstName} {lastName}
            {email ? ` · ${email}` : ""}
          </p>
          {expiresAt && step === "credentials" ? (
            <p className="text-sm text-muted-foreground">
              Link expires {new Date(expiresAt).toLocaleString()}.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form className="space-y-4" onSubmit={onCredentialsSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="activate-email">Email</Label>
                <Input
                  id="activate-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activate-username">Username</Label>
                <Input
                  id="activate-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  autoComplete="username"
                  required
                  autoFocus
                  minLength={2}
                  maxLength={40}
                  pattern="[a-zA-Z0-9._-]+"
                />
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, dots, underscores, and hyphens. You can sign
                  in with username or email.
                </p>
              </div>
              <PasswordField
                id="activate-password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />
              <PasswordField
                id="activate-confirm-password"
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Continuing…" : "Continue to 2FA"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onTotpSubmit}>
              {qrCodeDataUrl ? (
                <div className="flex justify-center rounded-lg border border-border bg-background p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeDataUrl}
                    alt="Authenticator QR code"
                    className="size-48"
                  />
                </div>
              ) : null}
              {manualEntryKey ? (
                <div className="space-y-1.5">
                  <Label>Manual setup key</Label>
                  <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs tracking-wider">
                    {manualEntryKey}
                  </p>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="activate-totp">6-digit code</Label>
                <Input
                  id="activate-totp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  autoFocus
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying…" : "Verify and finish"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background px-4">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ActivateForm />
    </Suspense>
  );
}
