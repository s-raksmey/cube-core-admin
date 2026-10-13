"use client";

import {
  ActivationCompleteCard,
  ActivationCredentialsForm,
  ActivationTotpForm,
  ActivationUnavailableCard,
  RecoveryCodesCard,
} from "@/components/auth/activation-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  activateTotp,
  completeActivation,
  validateActivationToken,
} from "@/lib/auth/upstream-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

type Step = "credentials" | "totp" | "recovery" | "done";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");

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
    if (token) {
      // Keep the bearer activation secret out of history and referrer URLs.
      window.history.replaceState(window.history.state, "", "/activate");
    }
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

    if (!ok) {
      setError(payload.error);
      return;
    }
    if (typeof payload.challengeToken !== "string") {
      setError("Activation failed");
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
        <p className="text-sm text-muted-foreground">
          Validating activation link…
        </p>
      </div>
    );
  }

  if (!token || !valid) {
    return <ActivationUnavailableCard />;
  }

  if (step === "done") {
    return <ActivationCompleteCard />;
  }

  if (step === "recovery") {
    return (
      <RecoveryCodesCard
        recoveryCodes={recoveryCodes}
        onContinue={finishActivation}
      />
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
            <ActivationCredentialsForm
              email={email}
              username={username}
              password={password}
              confirmPassword={confirmPassword}
              error={error}
              loading={loading}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={onCredentialsSubmit}
            />
          ) : (
            <ActivationTotpForm
              qrCodeDataUrl={qrCodeDataUrl}
              manualEntryKey={manualEntryKey}
              code={code}
              error={error}
              loading={loading}
              onCodeChange={setCode}
              onSubmit={onTotpSubmit}
            />
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
