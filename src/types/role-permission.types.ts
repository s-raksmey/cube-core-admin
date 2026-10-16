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
  ["SETTINGS_VIEW", "View site settings"],
  ["SETTINGS_UPDATE", "Edit site settings"],
] as const;

export const MAIN_ANALYTICS_PERMISSION_ROWS = [
  ["ANALYTICS_VIEW_TENANT", "View tenant analytics"],
  ["ANALYTICS_VIEW_OWN", "View own analytics"],
] as const;

export const MAIN_CATEGORY_PERMISSION_ROWS = [
  ["CATEGORY_VIEW", "View category"],
  ["CATEGORY_VIEW_SUBCATEGORY", "View sub category"],
  ["CATEGORY_CREATE", "Create category"],
  ["CATEGORY_CREATE_SUBCATEGORY", "Create sub category"],
  ["CATEGORY_EDIT", "Edit category"],
  ["CATEGORY_EDIT_SUBCATEGORY", "Edit sub category"],
  ["CATEGORY_DELETE", "Delete category"],
  ["CATEGORY_DELETE_SUBCATEGORY", "Delete sub category"],
  ["TAG_VIEW", "View tags"],
  ["TAG_CREATE", "Create tags"],
  ["TAG_EDIT", "Edit tags"],
  ["TAG_DELETE", "Delete tags"],
] as const;

export const MAIN_ARTICLE_PERMISSION_ROWS = [
  ["ARTICLE_VIEW", "View articles"],
  ["ARTICLE_CREATE", "Create articles"],
  ["ARTICLE_UPDATE_OWN", "Edit own articles"],
  ["ARTICLE_UPDATE_ANY", "Edit any article"],
  ["ARTICLE_DELETE_OWN", "Delete own drafts"],
  ["ARTICLE_DELETE_ANY", "Delete any draft"],
  ["ARTICLE_DELETE_ARCHIVED", "Permanently delete archived articles"],
  ["ARTICLE_SUBMIT", "Submit for review"],
  ["ARTICLE_REVIEW", "Review articles"],
  ["ARTICLE_REQUEST_CHANGES", "Request article changes"],
  ["ARTICLE_PUBLISH", "Publish articles"],
  ["ARTICLE_UNPUBLISH", "Unpublish articles"],
  ["ARTICLE_SCHEDULE", "Schedule articles"],
  ["ARTICLE_ARCHIVE", "Archive articles"],
  ["ARTICLE_RESTORE", "Restore articles"],
  ["ARTICLE_SET_BREAKING", "Set breaking news"],
  ["ARTICLE_SET_FEATURED", "Set featured articles"],
] as const;

export const MAIN_PERMISSION_ROLES = ["SUPERADMIN", "ADMIN", "EDITOR"] as const;

export type MainTenantRole = (typeof MAIN_PERMISSION_ROLES)[number];
export type MainTenantUserPermission =
  (typeof MAIN_USER_PERMISSION_ROWS)[number][0];
export type MainTenantSettingsPermission =
  (typeof MAIN_SETTINGS_PERMISSION_ROWS)[number][0];
export type MainTenantPermission =
  | MainTenantUserPermission
  | MainTenantSettingsPermission
  | (typeof MAIN_ANALYTICS_PERMISSION_ROWS)[number][0]
  | (typeof MAIN_CATEGORY_PERMISSION_ROWS)[number][0]
  | (typeof MAIN_ARTICLE_PERMISSION_ROWS)[number][0];
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
  "SETTINGS_VIEW",
  "CATEGORY_VIEW",
  "CATEGORY_VIEW_SUBCATEGORY",
  "TAG_VIEW",
  "ANALYTICS_VIEW_OWN",
  ...MAIN_ARTICLE_PERMISSION_ROWS.map(([code]) => code),
]);

export const EDITOR_PERMISSIONS_MESSAGE =
  "Editor can be granted article permissions. User and settings permissions remain limited.";

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
