import type { ManagedTenantUser } from "@/types/tenant-management.types";
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

type ManagedTenantUserEditorDialogProps = {
  open: boolean;
  editor: ManagedTenantUser | null;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  suspended: boolean;
  canEdit: boolean;
  canChangeRoles: boolean;
  canSuspend: boolean;
  saving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: "ADMIN" | "EDITOR") => void;
  onSuspendedChange: (value: boolean) => void;
  onSave: () => void;
};

/** Create and edit form used by the Main Tenant managed sub-tenant user screen. */
export function ManagedTenantUserEditorDialog({
  open,
  editor,
  firstName,
  lastName,
  email,
  role,
  suspended,
  canEdit,
  canChangeRoles,
  canSuspend,
  saving,
  error,
  onOpenChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onRoleChange,
  onSuspendedChange,
  onSave,
}: ManagedTenantUserEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editor ? "Edit User" : "Create User"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {editor
              ? "Update this sub-tenant user."
              : "Creates a pending user and a secure activation link."}
          </p>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="managed-first">First name</Label>
              <Input
                id="managed-first"
                value={firstName}
                disabled={Boolean(editor) && !canEdit}
                onChange={(event) => onFirstNameChange(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="managed-last">Last name</Label>
              <Input
                id="managed-last"
                value={lastName}
                disabled={Boolean(editor) && !canEdit}
                onChange={(event) => onLastNameChange(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="managed-email">Email</Label>
            <Input
              id="managed-email"
              type="email"
              value={email}
              disabled={Boolean(editor) && !canEdit}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </div>
          {canChangeRoles ? (
            <div className="space-y-1.5">
              <Label htmlFor="managed-role">Role</Label>
              <select
                id="managed-role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={role}
                onChange={(event) =>
                  onRoleChange(event.target.value as "ADMIN" | "EDITOR")
                }
              >
                <option value="ADMIN">ADMIN</option>
                <option value="EDITOR">EDITOR</option>
              </select>
            </div>
          ) : null}
          {editor && canSuspend && editor.accountStatus !== "PENDING" ? (
            <div className="space-y-1.5">
              <Label htmlFor="managed-access">Tenant access</Label>
              <select
                id="managed-access"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={suspended ? "SUSPENDED" : "ACTIVE"}
                onChange={(event) =>
                  onSuspendedChange(event.target.value === "SUSPENDED")
                }
              >
                <option value="ACTIVE">Unsuspend</option>
                <option value="SUSPENDED">Suspend</option>
              </select>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              saving || !firstName.trim() || !lastName.trim() || !email.trim()
            }
            onClick={onSave}
          >
            {saving ? "Saving…" : editor ? "Save changes" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
