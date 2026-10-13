import { MAIN_CONSOLE_USER_PERMISSIONS_QUERY } from "@/lib/apollo/operations";
import type { MainConsoleUserPermissionsQuery } from "@/lib/apollo/types";
import { useQuery } from "@apollo/client/react";

/** Loads Main Console user permissions and exposes them as named capabilities. */
export function useMainConsoleUserPermissions() {
  const query = useQuery<MainConsoleUserPermissionsQuery>(
    MAIN_CONSOLE_USER_PERMISSIONS_QUERY,
  );
  const permissions = new Set(query.data?.tenantUserPermissions ?? []);
  return {
    ...query,
    canViewUsers: permissions.has("USERS_VIEW"),
    canCreateUsers: permissions.has("USERS_CREATE"),
    canEditUsers: permissions.has("USERS_EDIT"),
    canChangeRoles: permissions.has("USERS_CHANGE_ROLE"),
    canActivateUsers: permissions.has("USERS_ACTIVATE"),
    canResetPasswords: permissions.has("USERS_RESET_PASSWORD"),
    canSuspendUsers: permissions.has("USERS_SUSPEND"),
    canDeleteUsers: permissions.has("USERS_DELETE"),
  };
}
