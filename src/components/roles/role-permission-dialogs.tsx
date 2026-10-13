import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EDITOR_PERMISSIONS_MESSAGE,
  mainTenantRoleLabel,
  type PendingMainTenantPermissionToggle,
} from "@/types/role-permission.types";

export function RolePermissionDialogs({
  blockedPermission,
  pendingToggle,
  saving,
  onCloseBlocked,
  onClosePending,
  onConfirm,
}: {
  blockedPermission: string | null;
  pendingToggle: PendingMainTenantPermissionToggle | null;
  saving: boolean;
  onCloseBlocked: () => void;
  onClosePending: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <Dialog open={blockedPermission !== null} onOpenChange={(open) => !open && onCloseBlocked()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editor permission unavailable</DialogTitle>
            <DialogDescription className="leading-6">
              {blockedPermission} cannot be enabled for Editor. {EDITOR_PERMISSIONS_MESSAGE}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter><Button type="button" onClick={onCloseBlocked}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={pendingToggle !== null} onOpenChange={(open) => !open && !saving && onClosePending()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingToggle?.enabled ? "Enable permission?" : "Disable permission?"}</DialogTitle>
            <DialogDescription className="leading-6">
              {pendingToggle ? <>
                {pendingToggle.enabled ? "Enable" : "Disable"} <span className="font-medium text-foreground">{pendingToggle.label}</span> for the <span className="font-medium text-foreground">{mainTenantRoleLabel(pendingToggle.role)}</span> role? This change takes effect immediately for current and future sessions with this role.
                {pendingToggle.enabled && pendingToggle.permission.startsWith("USERS_") && pendingToggle.permission !== "USERS_VIEW" ? " View users will also be enabled so this role can open the Users page." : null}
                {!pendingToggle.enabled && pendingToggle.permission === "USERS_VIEW" ? " Disabling View users also removes every other user-management permission for this role." : null}
              </> : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClosePending}>Cancel</Button>
            <Button type="button" disabled={saving} onClick={onConfirm}>{saving ? "Saving…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
