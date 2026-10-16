"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PermissionMatrix } from "@/components/roles/permission-matrix";
import { RolePermissionDialogs } from "@/components/roles/role-permission-dialogs";
import { useMainRolePermissions } from "@/hooks/use-main-role-permissions";
import {
  EDITOR_ALLOWED_PERMISSIONS,
  MAIN_ANALYTICS_PERMISSION_ROWS,
  MAIN_ARTICLE_PERMISSION_ROWS,
  MAIN_CATEGORY_PERMISSION_ROWS,
  MAIN_PERMISSION_ROLES,
  MAIN_SETTINGS_PERMISSION_ROWS,
  MAIN_USER_PERMISSION_ROWS,
  emptyMainTenantPermissions,
  mainTenantRoleLabel,
  type MainTenantPermission,
  type MainTenantPermissionState,
  type MainTenantRole,
  type PendingMainTenantPermissionToggle,
} from "@/types/role-permission.types";

export function RoleManagementPanel() {
  const { data, loading, error, refetch, updatePermissions, saving } =
    useMainRolePermissions();

  const [pendingToggle, setPendingToggle] =
    useState<PendingMainTenantPermissionToggle | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const [blockedEditorPermission, setBlockedEditorPermission] = useState<
    string | null
  >(null);

  const selected = useMemo<MainTenantPermissionState>(() => {
    const next = emptyMainTenantPermissions();

    if (!data?.tenantRolePermissions) {
      return next;
    }

    for (const role of data.tenantRolePermissions) {
      if (
        role.role === "SUPERADMIN" ||
        role.role === "ADMIN" ||
        role.role === "EDITOR"
      ) {
        next[role.role] = new Set(role.permissions as MainTenantPermission[]);
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
      if (permission.startsWith("TAG_") && permission !== "TAG_VIEW")
        nextPermissions.add("TAG_VIEW");
      if (permission.startsWith("ARTICLE_") && permission !== "ARTICLE_VIEW")
        nextPermissions.add("ARTICLE_VIEW");
      if (
        permission.startsWith("CATEGORY_") &&
        permission !== "CATEGORY_VIEW"
      ) {
        nextPermissions.add("CATEGORY_VIEW");
      }
      if (
        permission.endsWith("SUBCATEGORY") &&
        permission !== "CATEGORY_VIEW_SUBCATEGORY"
      ) {
        nextPermissions.add("CATEGORY_VIEW_SUBCATEGORY");
      }
    } else {
      if (permission === "USERS_VIEW") {
        for (const userPermission of MAIN_USER_PERMISSION_ROWS) {
          nextPermissions.delete(userPermission[0]);
        }
      } else if (permission === "TAG_VIEW") {
        for (const [code] of MAIN_CATEGORY_PERMISSION_ROWS)
          if (code.startsWith("TAG_")) nextPermissions.delete(code);
      } else if (permission === "ARTICLE_VIEW") {
        for (const [code] of MAIN_ARTICLE_PERMISSION_ROWS)
          nextPermissions.delete(code);
      } else if (permission === "CATEGORY_VIEW") {
        for (const [categoryPermission] of MAIN_CATEGORY_PERMISSION_ROWS) {
          if (
            categoryPermission.startsWith("CATEGORY_") &&
            !categoryPermission.endsWith("SUBCATEGORY")
          )
            nextPermissions.delete(categoryPermission);
        }
      } else if (permission === "CATEGORY_VIEW_SUBCATEGORY") {
        for (const [categoryPermission] of MAIN_CATEGORY_PERMISSION_ROWS) {
          if (categoryPermission.endsWith("SUBCATEGORY"))
            nextPermissions.delete(categoryPermission);
        }
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

      await refetch();
    } catch (reason) {
      setSaveError(
        reason instanceof Error
          ? reason.message
          : "Could not save role permissions",
      );
    }
  }

  function handleToggle(
    roleValue: string,
    permissionValue: string,
    label: string,
    enabled: boolean,
  ) {
    const role = roleValue as MainTenantRole;
    const permission = permissionValue as MainTenantPermission;

    if (role === "EDITOR" && !EDITOR_ALLOWED_PERMISSIONS.has(permission)) {
      setBlockedEditorPermission(label);
      return;
    }

    setPendingToggle({
      role,
      permission,
      label,

      enabled: !enabled,
    });
  }

  const userColumns = MAIN_PERMISSION_ROLES.map((role) => ({
    key: role,
    label: mainTenantRoleLabel(role),
  }));

  const userRows = MAIN_USER_PERMISSION_ROWS.map(([key, label]) => ({
    key,
    label,
  }));

  const settingsColumns = [
    {
      key: "ADMIN",
      label: "Admin",
    },
    {
      key: "EDITOR",
      label: "Editor",
    },
  ] as const;

  const settingsRows = MAIN_SETTINGS_PERMISSION_ROWS.map(([key, label]) => ({
    key,
    label,
  }));
  const categoryRows = MAIN_CATEGORY_PERMISSION_ROWS.map(([key, label]) => ({
    key,
    label,
  }));
  const articleRows = MAIN_ARTICLE_PERMISSION_ROWS.map(([key, label]) => ({
    key,
    label,
  }));
  const analyticsRows = MAIN_ANALYTICS_PERMISSION_ROWS.map(([key, label]) => ({
    key,
    label,
  }));

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
        <p className="text-sm text-muted-foreground" role="status">
          Loading permissions…
        </p>
      ) : null}

      {error && !data ? (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-destructive">
            Unable to load role permissions.
          </p>
        </div>
      ) : null}

      {saveError ? (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-destructive">{saveError}</p>
        </div>
      ) : null}

      {data ? (
        <>
          <PermissionMatrix
            title="User Management"
            description="Control user-management actions for each role."
            columns={userColumns}
            rows={userRows}
            saving={saving}
            isEnabled={(role, permission) =>
              selected[role as MainTenantRole].has(
                permission as MainTenantPermission,
              )
            }
            onToggle={handleToggle}
          />

          <PermissionMatrix
            title="Sub-tenant Settings"
            description="Control who can view or edit branding and SEO settings. Editors can view settings but cannot edit them."
            columns={settingsColumns}
            rows={settingsRows}
            saving={saving}
            isEnabled={(role, permission) =>
              selected[role as MainTenantRole].has(
                permission as MainTenantPermission,
              )
            }
            onToggle={handleToggle}
          />

          <PermissionMatrix
            title="Categories & Tags"
            description="Control category and sub category actions for each role. Editors can only view categories."
            columns={settingsColumns}
            rows={categoryRows}
            saving={saving}
            isEnabled={(role, permission) =>
              selected[role as MainTenantRole].has(
                permission as MainTenantPermission,
              )
            }
            onToggle={handleToggle}
          />
          <PermissionMatrix
            title="Articles"
            description="Control writing, review, publishing, scheduling, and presentation actions."
            columns={settingsColumns}
            rows={articleRows}
            saving={saving}
            isEnabled={(role, permission) =>
              selected[role as MainTenantRole].has(
                permission as MainTenantPermission,
              )
            }
            onToggle={handleToggle}
          />
          <PermissionMatrix
            title="Analytics"
            description="Tenant-wide access takes precedence when granted. Editors may be granted own-content access."
            columns={settingsColumns}
            rows={analyticsRows}
            saving={saving}
            isEnabled={(role, permission) =>
              selected[role as MainTenantRole].has(
                permission as MainTenantPermission,
              )
            }
            onToggle={handleToggle}
          />
        </>
      ) : null}

      <RolePermissionDialogs
        blockedPermission={blockedEditorPermission}
        pendingToggle={pendingToggle}
        saving={saving}
        onCloseBlocked={() => setBlockedEditorPermission(null)}
        onClosePending={() => setPendingToggle(null)}
        onConfirm={() => void confirmToggle()}
      />
    </div>
  );
}
