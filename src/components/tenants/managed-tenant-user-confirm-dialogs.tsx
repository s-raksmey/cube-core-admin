"use client";

import type {
  ManagedTenantUser,
  ManagedTenantUserLinkResult,
} from "@/types/tenant-management.types";
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
  result,
  error,
  loading,
  copied,
  onOpenChange,
  onConfirm,
  onCopy,
  onDone,
}: {
  user: ManagedTenantUser | null;
  result: ManagedTenantUserLinkResult | null;
  error: string | null;
  loading: boolean;
  copied: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCopy: () => void;
  onDone: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        {result?.url ? (
          <>
            <DialogHeader>
              <DialogTitle>New activation link</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Share this single-use link securely with {result.user.fullName}.
                It expires {new Date(result.expiresAt).toLocaleString()}.
              </p>
            </DialogHeader>
            <div className="flex gap-2">
              <Input value={result.url} readOnly aria-label="Activation link" />
              <Button type="button" variant="outline" size="icon" onClick={onCopy} aria-label="Copy activation link">
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            {copied ? <p className="text-sm text-muted-foreground" role="status">Link copied.</p> : null}
            <DialogFooter>
              <Button onClick={onDone}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {user?.accountStatus === "ACTIVE"
                  ? "Reactivate account and reset 2FA?"
                  : "Regenerate activation link?"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {user?.accountStatus === "ACTIVE"
                  ? `This will revoke active sessions, clear the existing 2FA setup and recovery codes, and move user ${user.username ?? user.fullName} (${user.email}) back to pending activation. Their username and password will be cleared; they will set them again and scan a new QR code.`
                  : `The existing activation link for ${user?.fullName} will be revoked. Only the new link will work.`}
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
                {loading
                  ? user?.accountStatus === "ACTIVE"
                    ? "Reactivating…"
                    : "Regenerating…"
                  : user?.accountStatus === "ACTIVE"
                    ? "Reactivate"
                    : "Regenerate link"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ResetManagedTenantUserPasswordDialog({ user, error, loading, onOpenChange, onConfirm }: { user: ManagedTenantUser | null; error: string | null; loading: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  return <Dialog open={Boolean(user)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Reset password?</DialogTitle><p className="text-sm text-muted-foreground">View the current single-use reset link for {user?.fullName} ({user?.email}). A valid unused stored link is reused; an expired or used link is replaced for two hours.</p></DialogHeader>{error ? <p className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={loading} onClick={onConfirm}>{loading ? "Loading link…" : "Yes, reset password"}</Button></DialogFooter></DialogContent></Dialog>;
}

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
            {result?.kind === "password-reset"
              ? "Password reset link"
              : result?.isNew
                ? "New activation link"
                : "Current activation link"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {result?.kind === "password-reset"
              ? `Use this single-use reset link for ${result.user.fullName}. It expires ${expiry}.`
              : result?.isNew
              ? `Share this link securely with ${result.user.fullName}. It is single-use and expires ${expiry}.`
              : `This existing link for ${result?.user.fullName} expires ${expiry}.`}
          </p>
        </DialogHeader>
        {result?.url ? (
          <div className="flex gap-2">
            <Input
              value={result.url}
              readOnly
              aria-label={result?.kind === "password-reset" ? "Password reset link" : "Activation link"}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCopy}
              aria-label={result?.kind === "password-reset" ? "Copy password reset link" : "Copy activation link"}
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
