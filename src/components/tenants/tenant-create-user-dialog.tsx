"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubTenantRow } from "@/lib/apollo/types";
import { Check, Copy } from "lucide-react";
import { useState, type FormEvent } from "react";

export type TenantUserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "EDITOR";
};

export function TenantCreateUserDialog({
  tenant,
  activationUrl,
  expiresAt,
  loading,
  error,
  open,
  onOpenChange,
  onSubmit,
}: {
  tenant: SubTenantRow;
  activationUrl: string | null;
  expiresAt: string | null;
  loading: boolean;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TenantUserFormValues) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR">("ADMIN");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!activationUrl) return;
    await navigator.clipboard.writeText(activationUrl);
    setCopied(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ firstName, lastName, email, role });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {activationUrl ? "Activation link" : "Create tenant user"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {tenant.name} <span className="font-mono">({tenant.id})</span>
          </p>
        </DialogHeader>
        {activationUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The account is pending activation. Share this single-use link with
              the user to set a password and enroll 2FA.
              {expiresAt
                ? ` Expires ${new Date(expiresAt).toLocaleString()}.`
                : ""}
            </p>
            <div className="flex gap-2">
              <Input
                value={activationUrl}
                readOnly
                aria-label="Activation link"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyLink}
                aria-label="Copy activation link"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-user-first-name">First name</Label>
                <Input
                  id="tenant-user-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  maxLength={60}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-user-last-name">Last name</Label>
                <Input
                  id="tenant-user-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  maxLength={60}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenant-user-email">Email</Label>
              <Input
                id="tenant-user-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenant-user-role">Role</Label>
              <select
                id="tenant-user-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "ADMIN" | "EDITOR")
                }
                disabled={loading}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
