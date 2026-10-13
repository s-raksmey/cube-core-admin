export const MAIN_USER_PERMISSION_ROWS = [
  ["USERS_VIEW", "View users"],
  ["USERS_CREATE", "Create users"],
  ["USERS_EDIT", "Edit users"],
  ["USERS_CHANGE_ROLE", "Change user roles"],
  ["USERS_ACTIVATE", "Activate users"],
  ["USERS_SUSPEND", "Suspend users"],
  ["USERS_RESET_PASSWORD", "Reset password"],
  ["USERS_DELETE", "Delete users"],
] as const;

export const MAIN_SETTINGS_PERMISSION_ROWS = [
  ["BRANDING_VIEW", "View settings"],
  ["BRANDING_UPDATE", "Edit settings"],
] as const;

export const MAIN_PERMISSION_ROLES = ["SUPERADMIN", "ADMIN", "EDITOR"] as const;

export type MainTenantRole = (typeof MAIN_PERMISSION_ROLES)[number];
export type MainTenantUserPermission =
  (typeof MAIN_USER_PERMISSION_ROWS)[number][0];
export type MainTenantSettingsPermission =
  (typeof MAIN_SETTINGS_PERMISSION_ROWS)[number][0];
export type MainTenantPermission =
  | MainTenantUserPermission
  | MainTenantSettingsPermission;
export type MainTenantPermissionState = Record<
  MainTenantRole,
  Set<MainTenantPermission>
>;

export type PendingMainTenantPermissionToggle = {
  role: MainTenantRole;
  permission: MainTenantPermission;
  label: string;
  enabled: boolean;
};

export const EDITOR_ALLOWED_PERMISSIONS = new Set<MainTenantPermission>([
  "USERS_VIEW",
  "USERS_EDIT",
  "BRANDING_VIEW",
]);

export const EDITOR_PERMISSIONS_MESSAGE =
  "Editor can only be granted View users, Edit users, and View settings.";

export function emptyMainTenantPermissions(): MainTenantPermissionState {
  return {
    SUPERADMIN: new Set<MainTenantPermission>(),
    ADMIN: new Set<MainTenantPermission>(),
    EDITOR: new Set<MainTenantPermission>(),
  };
}

export function mainTenantRoleLabel(role: MainTenantRole) {
  return role === "SUPERADMIN"
    ? "SuperAdmin"
    : role === "ADMIN"
      ? "Admin"
      : "Editor";
}
