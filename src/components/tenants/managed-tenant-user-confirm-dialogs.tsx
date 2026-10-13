"use client";

import type { ManagedTenantUser } from "@/components/tenants/managed-tenant-users-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";

export function DeleteManagedTenantUserDialog({
  user,
  error,
  loading,
  onOpenChange,
  onConfirm,
}: {
  user: ManagedTenantUser | null;
  error: string | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete tenant user?</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Suspend this user first. Once suspended, deleting permanently
            removes their account, credentials, and sessions from the database.
          </p>
        </DialogHeader>
        {user ? (
          <p className="rounded-md border p-3 text-sm">
            {user.fullName} · {user.email}
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" disabled={loading} onClick={onConfirm}>
            {loading ? "Deleting…" : "Delete user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RegenerateActivationLinkDialog({
  user,
  error,
  loading,
  onOpenChange,
  onConfirm,
}: {
  user: ManagedTenantUser | null;
  error: string | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate activation link?</DialogTitle>
          <p className="text-sm text-muted-foreground">
            The existing activation link for {user?.fullName} will be revoked.
            Only the new link will work.
          </p>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Regenerating…" : "Regenerate link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ManagedTenantUserLinkResult = {
  user: ManagedTenantUser;
  url: string | null;
  expiresAt: string;
  isNew: boolean;
};

export function ManagedTenantActivationLinkDialog({
  result,
  error,
  loading,
  copied,
  canRegenerate,
  onOpenChange,
  onCopy,
  onRegenerate,
}: {
  result: ManagedTenantUserLinkResult | null;
  error: string | null;
  loading: boolean;
  copied: boolean;
  canRegenerate: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: () => void;
  onRegenerate: (user: ManagedTenantUser) => void;
}) {
  const expiry = result?.expiresAt
    ? new Date(result.expiresAt).toLocaleString()
    : "—";

  return (
    <Dialog open={Boolean(result)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {result?.isNew ? "New activation link" : "Current activation link"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {result?.isNew
              ? `Share this link securely with ${result.user.fullName}. It is single-use and expires ${expiry}.`
              : `This existing link for ${result?.user.fullName} expires ${expiry}.`}
          </p>
        </DialogHeader>
        {result?.url ? (
          <div className="flex gap-2">
            <Input
              value={result.url}
              readOnly
              aria-label="New activation link"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCopy}
              aria-label="Copy activation link"
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading current activation link…
          </p>
        ) : result && !result.isNew && !error ? (
          <p className="text-sm text-muted-foreground" role="status">
            {result.expiresAt
              ? "This link was created before secure link viewing was enabled, so its original URL cannot be recovered. Regenerate it to create a new link."
              : "There is no current activation link available to recover. Regenerate to create a new link."}
          </p>
        ) : null}
        {copied ? (
          <p className="text-sm text-muted-foreground" role="status">
            Link copied.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          {!result?.isNew && canRegenerate && result ? (
            <Button variant="outline" onClick={() => onRegenerate(result.user)}>
              Regenerate link
            </Button>
          ) : null}
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
