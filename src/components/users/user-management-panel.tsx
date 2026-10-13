"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { useConsoleUser } from "@/components/providers/console-user-provider";
import { UserListToolbar } from "@/components/users/user-list-toolbar";
import { UserManagementDialogs } from "@/components/users/user-management-dialogs";
import { UserManagementTable } from "@/components/users/user-management-table";
import { useMainConsoleUserPermissions } from "@/hooks/use-main-console-user-permissions";
import { useMainTenantUserActions } from "@/hooks/use-main-tenant-user-actions";
import { useMainTenantUsers } from "@/hooks/use-main-tenant-users";
import { useMainUserDialogState } from "@/hooks/use-main-user-dialog-state";

/** Coordinates Main Tenant user-management UI, state, list data, and actions. */
export function UserManagementPanel() {
  const currentUser = useConsoleUser();
  const permissions = useMainConsoleUserPermissions();
  const list = useMainTenantUsers({ canViewUsers: permissions.canViewUsers });
  const dialogs = useMainUserDialogState();
  const actions = useMainTenantUserActions({
    canSuspendUsers: permissions.canSuspendUsers,
    dialogs,
    list,
  });

  const initialLoading =
    permissions.loading || (permissions.canViewUsers && list.initialLoading);
  const blockingError =
    (!permissions.loading && !permissions.canViewUsers) || list.blockingError;

  return (
    <div className="space-y-4">
      <UserListToolbar
        searchInput={list.searchInput}
        onSearchInputChange={list.setSearchInput}
        onSearch={list.applySearch}
        onCreate={dialogs.openCreate}
      />

      {initialLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}

      {blockingError ? (
        <p className="text-sm text-destructive">
          Unable to load users. SuperAdmin access is required.
        </p>
      ) : null}

      {list.refreshError ? (
        <p className="text-sm text-destructive" role="status">
          Could not refresh the user list. Showing the most recent data.
        </p>
      ) : null}

      {!initialLoading && !blockingError && list.users.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            list.search
              ? "No users match your search."
              : "Create the first additional SuperAdmin user for the Main Console."
          }
        />
      ) : null}

      {list.users.length > 0 ? (
        <UserManagementTable
          users={list.users}
          currentUserId={currentUser.id}
          busyUserId={dialogs.busyUserId}
          regenerating={actions.regenerating || actions.loadingActivationLink}
          resetting={actions.resetting}
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          canPrev={list.canPrev}
          canNext={list.canNext}
          onEdit={dialogs.openEdit}
          onGenerateActivation={actions.viewActivationLink}
          onReactivate={actions.requestUserReactivation}
          onResetPassword={(user) => {
            dialogs.setFormError(null);
            dialogs.setResetTarget(user);
          }}
          onDelete={(user) => {
            dialogs.setFormError(null);
            dialogs.setDeleteTarget(user);
          }}
          onPageChange={list.setPage}
        />
      ) : null}

      <UserManagementDialogs
        {...dialogs}
        {...actions}
        canSuspendUsers={permissions.canSuspendUsers}
        handleDelete={actions.deleteSelectedUser}
      />
    </div>
  );
}
