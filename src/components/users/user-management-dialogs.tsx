"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MainTenantUserDeleteDialog } from "@/components/users/main-tenant-user-delete-dialog";
import { MainTenantUserFields } from "@/components/users/main-tenant-user-fields";
import { MainUserSecurityDialogs } from "@/components/users/main-user-security-dialogs";
import type { MainTenantUserRow } from "@/lib/apollo/types";
import type { MainUserLinkResult } from "@/types/main-tenant-user.types";
import type { Dispatch, SetStateAction } from "react";

type User = MainTenantUserRow;

type UserManagementDialogsProps = {
  createOpen: boolean;
  setCreateOpen: Dispatch<SetStateAction<boolean>>;
  createConfirmOpen: boolean;
  setCreateConfirmOpen: Dispatch<SetStateAction<boolean>>;
  editUser: User | null;
  setEditUser: Dispatch<SetStateAction<User | null>>;
  editConfirmOpen: boolean;
  setEditConfirmOpen: Dispatch<SetStateAction<boolean>>;
  deleteTarget: User | null;
  setDeleteTarget: Dispatch<SetStateAction<User | null>>;
  resetTarget: User | null;
  setResetTarget: Dispatch<SetStateAction<User | null>>;
  activationTarget: User | null;
  setActivationTarget: Dispatch<SetStateAction<User | null>>;
  activationLinkUnavailable: boolean;
  activationLookupFailed: boolean;
  activationResetMode: boolean;
  activationLinkUser: User | null;
  requestActivationRegeneration: () => void;
  retryActivationLookup: () => void;
  firstName: string;
  setFirstName: Dispatch<SetStateAction<string>>;
  lastName: string;
  setLastName: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  status: "ACTIVE" | "INACTIVE";
  setStatus: Dispatch<SetStateAction<"ACTIVE" | "INACTIVE">>;
  canSuspendUsers: boolean;
  formError: string | null;
  setFormError: Dispatch<SetStateAction<string | null>>;
  linkResult: MainUserLinkResult | null;
  setLinkResult: Dispatch<SetStateAction<MainUserLinkResult | null>>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  resetting: boolean;
  regenerating: boolean;
  requestCreate: () => void;
  requestUpdate: () => void;
  confirmCreate: () => Promise<void>;
  confirmUpdate: () => Promise<void>;
  handleDelete: () => Promise<void>;
  confirmResetPassword: () => Promise<void>;
  confirmActivationLink: () => Promise<void>;
  copyLink: () => Promise<void>;
};

export function UserManagementDialogs(props: UserManagementDialogsProps) {
  const {
    createOpen,
    setCreateOpen,
    createConfirmOpen,
    setCreateConfirmOpen,
    editUser,
    setEditUser,
    editConfirmOpen,
    setEditConfirmOpen,
    deleteTarget,
    setDeleteTarget,
    resetTarget,
    setResetTarget,
    activationTarget,
    setActivationTarget,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    status,
    setStatus,
    canSuspendUsers,
    formError,
    setFormError,
    linkResult,
    setLinkResult,
    creating,
    updating,
    deleting,
    resetting,
    regenerating,
    requestCreate,
    requestUpdate,
    confirmCreate,
    confirmUpdate,
    handleDelete,
    confirmResetPassword,
    confirmActivationLink,
    copyLink,
    activationLinkUnavailable,
    activationLinkUser,
    requestActivationRegeneration,
    activationLookupFailed,
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
              Creates a Main Tenant SuperAdmin. Names may match other users;
              email must be unique. An activation link lets them choose a
              username, set a password, verify 2FA, and save recovery codes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <MainTenantUserFields
              idPrefix="create"
              firstName={firstName}
              lastName={lastName}
              email={email}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onEmailChange={setEmail}
              autoFocus
            />
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Role:{" "}
              <span className="font-medium text-foreground">SUPERADMIN</span>
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
              disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
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
            <Button type="button" onClick={confirmCreate} disabled={creating}>
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
            <MainTenantUserFields
              idPrefix="edit"
              firstName={firstName}
              lastName={lastName}
              email={email}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onEmailChange={setEmail}
            />
            {canSuspendUsers ? (
              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Access</Label>
                {editUser?.status === "PENDING" ? (
                  <div className="space-y-1.5">
                    <div className="flex h-9 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
                      Pending activation
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The user must complete activation before their access
                      status can be changed here.
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
            ) : null}
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
            <Button type="button" onClick={confirmUpdate} disabled={updating}>
              {updating ? "Saving…" : "Yes, save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainTenantUserDeleteDialog
        user={deleteTarget}
        error={formError}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDelete()}
      />

      <MainUserSecurityDialogs
        activationTarget={activationTarget}
        setActivationTarget={setActivationTarget}
        activationLinkUnavailable={activationLinkUnavailable}
        activationLookupFailed={activationLookupFailed}
        activationResetMode={activationResetMode}
        activationLinkUser={activationLinkUser}
        requestActivationRegeneration={requestActivationRegeneration}
        retryActivationLookup={retryActivationLookup}
        resetTarget={resetTarget}
        setResetTarget={setResetTarget}
        linkResult={linkResult}
        setLinkResult={setLinkResult}
        formError={formError}
        setFormError={setFormError}
        resetting={resetting}
        regenerating={regenerating}
        confirmActivationLink={confirmActivationLink}
        confirmResetPassword={confirmResetPassword}
        copyLink={copyLink}
      />
    </>
  );
}
