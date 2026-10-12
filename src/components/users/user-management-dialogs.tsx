"use client";

import type { Dispatch, SetStateAction } from "react";
import type { MainTenantUserRow } from "@/lib/apollo/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw } from "lucide-react";

type LinkResult = { url: string; expiresAt: string; label: string };
type User = MainTenantUserRow;

type UserManagementDialogsProps = {
  createOpen: boolean; setCreateOpen: Dispatch<SetStateAction<boolean>>;
  createConfirmOpen: boolean; setCreateConfirmOpen: Dispatch<SetStateAction<boolean>>;
  editUser: User | null; setEditUser: Dispatch<SetStateAction<User | null>>;
  editConfirmOpen: boolean; setEditConfirmOpen: Dispatch<SetStateAction<boolean>>;
  deleteTarget: User | null; setDeleteTarget: Dispatch<SetStateAction<User | null>>;
  resetTarget: User | null; setResetTarget: Dispatch<SetStateAction<User | null>>;
  activationTarget: User | null; setActivationTarget: Dispatch<SetStateAction<User | null>>;
  activationLinkUnavailable: boolean;
  activationLookupFailed: boolean;
  activationResetMode: boolean;
  activationLinkUser: User | null;
  requestActivationRegeneration: () => void;
  retryActivationLookup: () => void;
  firstName: string; setFirstName: Dispatch<SetStateAction<string>>;
  lastName: string; setLastName: Dispatch<SetStateAction<string>>;
  email: string; setEmail: Dispatch<SetStateAction<string>>;
  status: "ACTIVE" | "INACTIVE";
  setStatus: Dispatch<SetStateAction<"ACTIVE" | "INACTIVE">>;
  formError: string | null; setFormError: Dispatch<SetStateAction<string | null>>;
  linkResult: LinkResult | null; setLinkResult: Dispatch<SetStateAction<LinkResult | null>>;
  creating: boolean; updating: boolean; deleting: boolean; resetting: boolean; regenerating: boolean;
  requestCreate: () => void; requestUpdate: () => void;
  confirmCreate: () => Promise<void>; confirmUpdate: () => Promise<void>;
  handleDelete: () => Promise<void>; confirmResetPassword: () => Promise<void>;
  confirmActivationLink: () => Promise<void>; copyLink: () => Promise<void>;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function UserManagementDialogs(props: UserManagementDialogsProps) {
  const {
    createOpen, setCreateOpen, createConfirmOpen, setCreateConfirmOpen,
    editUser, setEditUser, editConfirmOpen, setEditConfirmOpen,
    deleteTarget, setDeleteTarget, resetTarget, setResetTarget,
    activationTarget, setActivationTarget, firstName, setFirstName,
    lastName, setLastName, email, setEmail, status, setStatus,
    formError, setFormError, linkResult, setLinkResult, creating, updating,
    deleting, resetting, regenerating, requestCreate, requestUpdate,
    confirmCreate, confirmUpdate, handleDelete, confirmResetPassword,
    confirmActivationLink, copyLink, activationLinkUnavailable,
    activationLinkUser, requestActivationRegeneration, activationLookupFailed,
    activationResetMode,
    retryActivationLookup,
  } = props;
  return (
    <>
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setFormError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Creates a Main Tenant SuperAdmin. Names may match other users; email
              must be unique. An activation link lets them choose a username, set
              a password, verify 2FA, and save recovery codes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-first-name">First name</Label>
                <Input
                  id="create-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-last-name">Last name</Label>
                <Input
                  id="create-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">SUPERADMIN</span>
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={requestCreate}
              disabled={
                !firstName.trim() || !lastName.trim() || !email.trim()
              }
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateConfirmOpen(false);
            setCreateOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create this user?</DialogTitle>
            <DialogDescription>
              Create SuperAdmin{" "}
              <span className="font-medium text-foreground">
                {firstName.trim()} {lastName.trim()}
              </span>{" "}
              ({email.trim()}) and generate a single-use activation link?
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
                setCreateConfirmOpen(false);
                setCreateOpen(true);
              }}
              disabled={creating}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={confirmCreate}
              disabled={creating}
            >
              {creating ? "Creating…" : "Yes, create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editUser && !editConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditUser(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Role stays SUPERADMIN. Tenant stays the Main Tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-first-name">First name</Label>
                <Input
                  id="edit-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-last-name">Last name</Label>
                <Input
                  id="edit-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Access</Label>
              {editUser?.status === "PENDING" ? (
                <div className="space-y-1.5">
                  <div className="flex h-9 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
                    Pending activation
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The user must complete activation before their access status
                    can be changed here.
                  </p>
                </div>
              ) : (
                <select
                  id="edit-status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "ACTIVE" | "INACTIVE")
                  }
                >
                  <option value="ACTIVE">Unsuspend</option>
                  <option value="INACTIVE">Suspend</option>
                </select>
              )}
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={requestUpdate}
              disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editConfirmOpen && !!editUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditConfirmOpen(false);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save these changes?</DialogTitle>
            <DialogDescription>
              Update{" "}
              <span className="font-medium text-foreground">
                {editUser?.firstName} {editUser?.lastName}
              </span>{" "}
              to {firstName.trim()} {lastName.trim()} ({email.trim()}), status{" "}
              {editUser?.status === "PENDING"
                ? "Pending activation"
                : status === "ACTIVE"
                  ? "Unsuspend"
                  : "Suspend"}
              ?
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
                setEditConfirmOpen(false);
                setFormError(null);
              }}
              disabled={updating}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={confirmUpdate}
              disabled={updating}
            >
              {updating ? "Saving…" : "Yes, save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              Suspend{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </span>{" "}
              ({deleteTarget?.email}) first. Once suspended, deleting permanently
              removes their Main Tenant account and all sessions. The last active
              SuperAdmin cannot be suspended.
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  This will revoke active sessions, clear the existing 2FA setup and recovery codes, and move{" "}
                  <span className="font-medium text-foreground">
                    {activationTarget?.firstName} {activationTarget?.lastName}
                  </span>{" "}
                  ({activationTarget?.email}) back to pending activation. Their username and password will be cleared; they will set them again and scan a new QR code.
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
                  ({activationTarget?.email})? This clears their unverified username, password, and pending 2FA setup, then invalidates previous activation links. They will set up their credentials and scan a new QR code.
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
              <Button type="button" onClick={confirmActivationLink} disabled={regenerating}>
                {regenerating ? "Reactivating…" : "Reactivate"}
              </Button>
            ) : activationLookupFailed ? (
              <>
                <Button type="button" variant="outline" onClick={retryActivationLookup} disabled={regenerating}>
                  Retry
                </Button>
                <Button type="button" onClick={confirmActivationLink} disabled={regenerating}>
                  {regenerating ? "Generating…" : "Regenerate anyway"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={confirmActivationLink}
                disabled={regenerating}
              >
                {regenerating ? "Resetting…" : "Reset activation and generate link"}
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
              Generate a single-use password reset link for{" "}
              <span className="font-medium text-foreground">
                {resetTarget?.firstName} {resetTarget?.lastName}
              </span>{" "}
              ({resetTarget?.email})? Their current password will stop working
              after they set a new one. 2FA stays enabled.
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
              onClick={confirmResetPassword}
              disabled={resetting}
            >
              {resetting ? "Generating…" : "Yes, reset password"}
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
            <Button type="button" onClick={copyLink}>
              <Copy className="size-4" />
              Copy link
            </Button>
            {activationLinkUser && linkResult?.label.startsWith("Activation link") ? (
              <Button type="button" variant="outline" onClick={requestActivationRegeneration}>
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
