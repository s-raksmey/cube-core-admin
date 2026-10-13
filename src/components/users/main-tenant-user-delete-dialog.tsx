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
import type { MainTenantUserRow } from "@/lib/apollo/types";

export function MainTenantUserDeleteDialog({
  user,
  error,
  loading,
  onOpenChange,
  onConfirm,
}: {
  user: MainTenantUserRow | null;
  error: string | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            Suspend{" "}
            <span className="font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </span>{" "}
            ({user?.email}) first. Once suspended, deleting permanently removes
            their Main Tenant account and all sessions. The last active
            SuperAdmin cannot be suspended.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
