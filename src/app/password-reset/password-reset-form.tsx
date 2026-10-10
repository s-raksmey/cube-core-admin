"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import {
  completePasswordReset,
  validatePasswordResetToken,
} from "@/lib/auth/upstream-actions";

export function PasswordResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validate() {
      if (!token) {
        setValidating(false);
        return;
      }
      const { ok, payload } = await validatePasswordResetToken(token);
      setValidating(false);
      if (!ok) {
        setValid(false);
        return;
      }
      setValid(!!payload.valid);
      setExpiresAt(
        typeof payload.expiresAt === "string" ? payload.expiresAt : null,
      );
      setUsername(typeof payload.username === "string" ? payload.username : "");
    }
    void validate();
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { ok, payload } = await completePasswordReset({
      token,
      password,
      confirmPassword,
    });
    setLoading(false);

    if (!ok) {
      setError(
        typeof payload.error === "string"
          ? payload.error
          : "Password reset failed",
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace("/login"), 2500);
  }

  if (validating) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Validating reset link…</p>
      </div>
    );
  }

  if (!token || !valid) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset link unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>This password reset link is invalid, expired, or already used.</p>
            <Link href="/login" className="text-primary hover:underline">
              Return to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password updated</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your password was reset and two-factor authentication was cleared.
            Sign in with your new password to scan a new QR code and save new
            recovery codes.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          {expiresAt ? (
            <p className="text-sm text-muted-foreground">
              Link expires {new Date(expiresAt).toLocaleString()}.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                disabled
                autoComplete="username"
              />
            </div>
            <PasswordField
              id="password"
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
