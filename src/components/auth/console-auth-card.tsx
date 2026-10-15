"use client";

import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConsoleAuthChallenge, ConsoleAuthStep } from "@/types/auth.types";
import { X } from "lucide-react";
import Image from "next/image";
import type { FormEvent } from "react";

type ConsoleAuthCardProps = {
  step: ConsoleAuthStep;
  email: string;
  password: string;
  code: string;
  useRecoveryCode: boolean;
  challenge: ConsoleAuthChallenge | null;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onPasswordSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVerifySubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onToggleRecoveryCode: () => void;
};

/** Shared sign-in, enrollment, and verification card for the Main Tenant. */
export function ConsoleAuthCard({
  step,
  email,
  password,
  code,
  useRecoveryCode,
  challenge,
  error,
  loading,
  onClose,
  onPasswordSubmit,
  onVerifySubmit,
  onEmailChange,
  onPasswordChange,
  onCodeChange,
  onToggleRecoveryCode,
}: ConsoleAuthCardProps) {
  const heading =
    step === "enroll"
      ? "Set up two-factor authentication"
      : step === "verify"
        ? "Enter verification code"
        : "Sign in to Cube Core";
  const description =
    step === "enroll"
      ? "Scan the QR code, then enter the 6-digit code from your authenticator."
      : step === "verify"
        ? "Enter the 6-digit code from your authenticator app."
        : "SuperAdmin main console access.";
  return (
    <div className="max-w-md rounded-2xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
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
              onChange={(event) => onEmailChange(event.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <PasswordField
            id="landing-password"
            value={password}
            onChange={onPasswordChange}
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
              <Image
                src={challenge.qrCodeDataUrl}
                alt="Authenticator QR code"
                width={192}
                height={192}
                unoptimized
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
          <VerificationCodeInput
            code={code}
            recovery={false}
            loading={loading}
            onChange={onCodeChange}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing you in…" : "Verify and activate 2FA"}
          </Button>
        </form>
      ) : null}
      {step === "verify" ? (
        <form className="space-y-4" onSubmit={onVerifySubmit}>
          <VerificationCodeInput
            code={code}
            recovery={useRecoveryCode}
            loading={loading}
            onChange={onCodeChange}
          />
          <button
            type="button"
            className="text-sm text-primary hover:underline disabled:opacity-50"
            disabled={loading}
            onClick={onToggleRecoveryCode}
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
  );
}

function VerificationCodeInput({
  code,
  recovery,
  loading,
  onChange,
}: {
  code: string;
  recovery: boolean;
  loading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="verify-code">
        {recovery ? "Recovery code" : "6-digit code"}
      </Label>
      <Input
        id="verify-code"
        inputMode={recovery ? "text" : "numeric"}
        autoComplete="one-time-code"
        pattern={recovery ? undefined : "[0-9]{6}"}
        maxLength={recovery ? 64 : 6}
        value={code}
        onChange={(event) =>
          onChange(
            recovery
              ? event.target.value.trim().toUpperCase()
              : event.target.value.replace(/\D/g, "").slice(0, 6),
          )
        }
        required
        autoFocus
        disabled={loading}
      />
    </div>
  );
}
