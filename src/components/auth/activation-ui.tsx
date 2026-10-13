"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";

type CenteredCardProps = {
  children: ReactNode;
};

function CenteredCard({ children }: CenteredCardProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}

export function ActivationUnavailableCard() {
  return (
    <CenteredCard>
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
    </CenteredCard>
  );
}

export function ActivationCompleteCard() {
  return (
    <CenteredCard>
      <CardHeader>
        <CardTitle>Account activated</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        You can sign in with your username or email. Redirecting to login…
      </CardContent>
    </CenteredCard>
  );
}

export function RecoveryCodesCard({
  recoveryCodes,
  onContinue,
}: {
  recoveryCodes: string[];
  onContinue: () => void;
}) {
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
          <Button type="button" variant="outline" className="w-full" onClick={() => void navigator.clipboard.writeText(recoveryCodes.join("\n"))}>
            Copy codes
          </Button>
          <Button type="button" className="w-full" onClick={onContinue}>
            I saved my codes — continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type CredentialsFormProps = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  loading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ActivationCredentialsForm({
  email,
  username,
  password,
  confirmPassword,
  error,
  loading,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: CredentialsFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="activate-email">Email</Label>
        <Input id="activate-email" type="email" value={email} readOnly disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="activate-username">Username</Label>
        <Input id="activate-username" value={username} onChange={(event) => onUsernameChange(event.target.value.trim())} autoComplete="username" required autoFocus minLength={2} maxLength={40} pattern="[a-zA-Z0-9._-]+" />
        <p className="text-xs text-muted-foreground">
          Letters, numbers, dots, underscores, and hyphens. You can sign in with username or email.
        </p>
      </div>
      <PasswordField id="activate-password" label="Password" value={password} onChange={onPasswordChange} autoComplete="new-password" />
      <PasswordField id="activate-confirm-password" label="Confirm password" value={confirmPassword} onChange={onConfirmPasswordChange} autoComplete="new-password" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Continuing…" : "Continue to 2FA"}
      </Button>
    </form>
  );
}

type TotpFormProps = {
  qrCodeDataUrl: string | null;
  manualEntryKey: string | null;
  code: string;
  error: string | null;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ActivationTotpForm({
  qrCodeDataUrl,
  manualEntryKey,
  code,
  error,
  loading,
  onCodeChange,
  onSubmit,
}: TotpFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {qrCodeDataUrl ? (
        <div className="flex justify-center rounded-lg border border-border bg-background p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeDataUrl} alt="Authenticator QR code" className="size-48" />
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
        <Input id="activate-totp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Verifying…" : "Verify and finish"}
      </Button>
    </form>
  );
}

