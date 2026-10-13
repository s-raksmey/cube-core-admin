"use client";

import { Copy, RefreshCw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MainTenantUserRow } from "@/lib/apollo/types";
import type { MainUserLinkResult } from "@/types/main-tenant-user.types";

type User = MainTenantUserRow;

type MainUserSecurityDialogsProps = {
  activationTarget: User | null;
  setActivationTarget: Dispatch<SetStateAction<User | null>>;
  activationLinkUnavailable: boolean;
  activationLookupFailed: boolean;
  activationResetMode: boolean;
  activationLinkUser: User | null;
  requestActivationRegeneration: () => void;
  retryActivationLookup: () => void;
  resetTarget: User | null;
  setResetTarget: Dispatch<SetStateAction<User | null>>;
  linkResult: MainUserLinkResult | null;
  setLinkResult: Dispatch<SetStateAction<MainUserLinkResult | null>>;
  formError: string | null;
  setFormError: Dispatch<SetStateAction<string | null>>;
  resetting: boolean;
  regenerating: boolean;
  confirmActivationLink: () => Promise<void>;
  confirmResetPassword: () => Promise<void>;
  copyLink: () => Promise<void>;
};

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function MainUserSecurityDialogs({
  activationTarget,
  setActivationTarget,
  activationLinkUnavailable,
  activationLookupFailed,
  activationResetMode,
  activationLinkUser,
  requestActivationRegeneration,
  retryActivationLookup,
  resetTarget,
  setResetTarget,
  linkResult,
  setLinkResult,
  formError,
  setFormError,
  resetting,
  regenerating,
  confirmActivationLink,
  confirmResetPassword,
  copyLink,
}: MainUserSecurityDialogsProps) {
  return (
    <>
      <Dialog
        open={!!activationTarget}
        onOpenChange={(open) => {
          if (!open) {
            setActivationTarget(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activationResetMode
                ? "Reactivate account and reset 2FA?"
                : activationLookupFailed
                  ? "Could not retrieve the activation link"
                  : activationLinkUnavailable
                    ? "No existing link is available"
                    : "Generate a new activation link?"}
            </DialogTitle>
            <DialogDescription>
              {activationResetMode ? (
                <>
                  This will revoke active sessions, clear the existing 2FA setup
                  and recovery codes, and move{" "}
                  <span className="font-medium text-foreground">
                    {activationTarget?.firstName} {activationTarget?.lastName}
                  </span>{" "}
                  ({activationTarget?.email}) back to pending activation. Their
                  username and password will be cleared; they will set them
                  again and scan a new QR code.
                </>
              ) : activationLookupFailed ? (
                "The request failed. No link was generated and any existing link remains unchanged. Retry to view it, or restart activation to clear partial credentials and replace the old link."
              ) : (
                <>
                  {activationLinkUnavailable
                    ? "The existing link is expired, already used, or cannot be recovered. Restart activation and generate a new single-use link for "
                    : "Restart this user's unfinished activation and generate a new single-use link for "}
                  <span className="font-medium text-foreground">
                    {activationTarget?.firstName} {activationTarget?.lastName}
                  </span>{" "}
                  ({activationTarget?.email})? This clears their unverified
                  username, password, and pending 2FA setup, then invalidates
                  previous activation links.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActivationTarget(null);
                setFormError(null);
              }}
              disabled={regenerating}
            >
              Cancel
            </Button>
            {activationResetMode ? (
              <Button
                type="button"
                onClick={() => void confirmActivationLink()}
                disabled={regenerating}
              >
                {regenerating ? "Reactivating…" : "Reactivate"}
              </Button>
            ) : activationLookupFailed ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={retryActivationLookup}
                  disabled={regenerating}
                >
                  Retry
                </Button>
                <Button
                  type="button"
                  onClick={() => void confirmActivationLink()}
                  disabled={regenerating}
                >
                  {regenerating ? "Generating…" : "Regenerate anyway"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => void confirmActivationLink()}
                disabled={regenerating}
              >
                {regenerating
                  ? "Resetting…"
                  : "Reset activation and generate link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password?</DialogTitle>
            <DialogDescription>
              View the current single-use password reset link for{" "}
              <span className="font-medium text-foreground">
                {resetTarget?.firstName} {resetTarget?.lastName}
              </span>{" "}
              ({resetTarget?.email})? A valid unused link is reused. An expired
              or used link is replaced and stored for two hours. Their current
              password will stop working after they set a new one. 2FA stays enabled.
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetTarget(null);
                setFormError(null);
              }}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void confirmResetPassword()}
              disabled={resetting}
            >
              {resetting ? "Loading link…" : "Yes, reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!linkResult}
        onOpenChange={(open) => {
          if (!open) setLinkResult(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkResult?.label ?? "Secure link"}</DialogTitle>
            <DialogDescription>
              Expires {formatDateTime(linkResult?.expiresAt)}. Copy and deliver
              through an approved channel. The link is single-use.
            </DialogDescription>
          </DialogHeader>
          <p className="break-all rounded-md bg-muted p-3 text-sm">
            {linkResult?.url}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkResult(null)}
            >
              Close
            </Button>
            <Button type="button" onClick={() => void copyLink()}>
              <Copy className="size-4" />
              Copy link
            </Button>
            {activationLinkUser &&
            linkResult?.label.startsWith("Activation link") ? (
              <Button
                type="button"
                variant="outline"
                onClick={requestActivationRegeneration}
              >
                <RefreshCw className="size-4" />
                Regenerate link
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
