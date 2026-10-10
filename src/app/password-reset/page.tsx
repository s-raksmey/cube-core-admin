import { Suspense } from "react";
import { PasswordResetForm } from "@/app/password-reset/password-reset-form";

function PasswordResetFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">Validating reset link…</p>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<PasswordResetFallback />}>
      <PasswordResetForm />
    </Suspense>
  );
}
