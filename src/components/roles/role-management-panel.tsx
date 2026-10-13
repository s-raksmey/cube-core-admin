"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PermissionMatrix } from "@/components/roles/permission-matrix";
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
  TENANT_ROLE_PERMISSIONS_QUERY,
  UPDATE_TENANT_ROLE_PERMISSIONS,
} from "@/lib/apollo/operations";

const userPermissions = [
  ["USERS_VIEW", "View users"],
  ["USERS_CREATE", "Create users"],
  ["USERS_EDIT", "Edit users"],
  ["USERS_CHANGE_ROLE", "Change user roles"],
  ["USERS_ACTIVATE", "Activate users"],
  ["USERS_SUSPEND", "Suspend users"],
  ["USERS_RESET_PASSWORD", "Reset password"],
  ["USERS_DELETE", "Delete users"],
] as const;

const settingsPermissions = [
  ["BRANDING_VIEW", "View settings"],
  ["BRANDING_UPDATE", "Edit settings"],
] as const;

const permissions = [...userPermissions, ...settingsPermissions] as const;

const roles = ["SUPERADMIN", "ADMIN", "EDITOR"] as const;

const allowedEditorPermissions = new Set<Permission>([
  "USERS_VIEW",
  "USERS_EDIT",
  "BRANDING_VIEW",
]);

const editorPermissionsMessage =
  "Editor can only be granted View users, Edit users, and View settings.";

type Role = (typeof roles)[number];
type Permission = (typeof permissions)[number][0];

type PermissionState = Record<Role, Set<Permission>>;

type PendingToggle = {
  role: Role;
  permission: Permission;
  label: string;
  enabled: boolean;
};

function emptyPermissions(): PermissionState {
  return {
    SUPERADMIN: new Set<Permission>(),
    ADMIN: new Set<Permission>(),
    EDITOR: new Set<Permission>(),
  };
}
export function RoleManagementPanel() {
  const { data, loading, error } = useQuery(TENANT_ROLE_PERMISSIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const [updatePermissions, { loading: saving }] = useMutation(
    UPDATE_TENANT_ROLE_PERMISSIONS,
    {
      refetchQueries: [
        {
          query: TENANT_ROLE_PERMISSIONS_QUERY,
        },
      ],
      awaitRefetchQueries: true,
    },
  );

  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );

  const [saveError, setSaveError] = useState<string | null>(null);
  const [blockedEditorPermission, setBlockedEditorPermission] = useState<
    string | null
  >(null);

  /*
   * Permissions come directly from Apollo.
   *
   * We don't copy GraphQL data into local state with useEffect because
   * selected is derived data. This also avoids the
   * react-hooks/set-state-in-effect warning.
   */
  const selected = useMemo<PermissionState>(() => {
    const next = emptyPermissions();

    if (!data?.tenantRolePermissions) {
      return next;
    }

    for (const role of data.tenantRolePermissions) {
      if (role.role === "SUPERADMIN" || role.role === "ADMIN" || role.role === "EDITOR") {
        next[role.role] = new Set(role.permissions as Permission[]);
      }
    }

    return next;
  }, [data]);

  async function confirmToggle() {
    if (!pendingToggle) return;

    const { role, permission, enabled } = pendingToggle;

    const nextPermissions = new Set(selected[role]);

    if (enabled) {
      nextPermissions.add(permission);
      if (permission.startsWith("USERS_") && permission !== "USERS_VIEW") {
        nextPermissions.add("USERS_VIEW");
      }
    } else {
      if (permission === "USERS_VIEW") {
        nextPermissions.clear();
      } else {
        nextPermissions.delete(permission);
      }
    }

    setSaveError(null);

    try {
      await updatePermissions({
        variables: {
          input: {
            role,
            permissions: [...nextPermissions],
          },
        },
      });

      setPendingToggle(null);
    } catch (reason) {
      setSaveError(
        reason instanceof Error
          ? reason.message
          : "Could not save role permissions",
      );
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & Permissions"
        description="Configure permissions for Admin and Editor users across every sub-tenant."
        crumbs={[
          {
            label: "Console",
            href: "/dashboard",
          },
          {
            label: "Roles & Permissions",
          },
        ]}
      />

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">
            Unable to load role permissions.
          </p>
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{saveError}</p>
        </div>
      ) : null}

      <PermissionMatrix
        title="User Management"
        description="Control user-management actions for each role."
        columns={roles.map((role) => ({ key: role, label: role === "SUPERADMIN" ? "SuperAdmin" : role === "ADMIN" ? "Admin" : "Editor" }))}
        rows={permissions.map(([key, label]) => ({ key, label }))}
        saving={saving}
        isEnabled={(role, permission) => selected[role as Role].has(permission as Permission)}
        onToggle={(role, permission, label, enabled) => {
          if (role === "EDITOR" && !allowedEditorPermissions.has(permission as Permission)) {
            setBlockedEditorPermission(label);
            return;
          }
          setPendingToggle({ role: role as Role, permission: permission as Permission, label, enabled: !enabled });
        }}
      />

      <PermissionMatrix
        title="Sub-tenant Settings"
        description="Control who can view or edit branding and SEO settings. Editors can view settings but cannot edit them."
        columns={[{ key: "ADMIN", label: "Admin" }, { key: "EDITOR", label: "Editor" }]}
        rows={settingsPermissions.map(([key, label]) => ({ key, label }))}
        saving={saving}
        isEnabled={(role, permission) => selected[role as Role].has(permission as Permission)}
        onToggle={(role, permission, label, enabled) => {
          if (role === "EDITOR" && !allowedEditorPermissions.has(permission as Permission)) {
            setBlockedEditorPermission(label);
            return;
          }
          setPendingToggle({ role: role as Role, permission: permission as Permission, label, enabled: !enabled });
        }}
      />

      <Dialog
        open={blockedEditorPermission !== null}
        onOpenChange={(open) => {
          if (!open) setBlockedEditorPermission(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editor permission unavailable</DialogTitle>
            <DialogDescription className="leading-6">
              {blockedEditorPermission} cannot be enabled for Editor. {editorPermissionsMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setBlockedEditorPermission(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingToggle !== null}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setPendingToggle(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingToggle?.enabled
                ? "Enable permission?"
                : "Disable permission?"}
            </DialogTitle>

            <DialogDescription className="leading-6">
              {pendingToggle ? (
                <>
                  {pendingToggle.enabled ? "Enable" : "Disable"}{" "}
                  <span className="font-medium text-foreground">
                    {pendingToggle.label}
                  </span>{" "}
                  for the{" "}
                  <span className="font-medium text-foreground">
                    {pendingToggle.role === "SUPERADMIN" ? "SuperAdmin" : pendingToggle.role === "ADMIN" ? "Admin" : "Editor"}
                  </span>{" "}
                  role? This change takes effect immediately for current and
                  future sessions with this role.
                  {pendingToggle.enabled && pendingToggle.permission.startsWith("USERS_") && pendingToggle.permission !== "USERS_VIEW"
                    ? " View users will also be enabled so this role can open the Users page."
                    : null}
                  {!pendingToggle.enabled && pendingToggle.permission === "USERS_VIEW"
                    ? " Disabling View users also removes every other user-management permission for this role."
                    : null}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setPendingToggle(null)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={() => void confirmToggle()}
            >
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
