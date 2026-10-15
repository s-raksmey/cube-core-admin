"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchToolbar } from "@/components/dashboard/search-toolbar";
import {
  DeleteManagedTenantUserDialog,
  ManagedTenantActivationLinkDialog,
  RegenerateActivationLinkDialog,
  ResetManagedTenantUserPasswordDialog,
} from "@/components/tenants/managed-tenant-user-confirm-dialogs";
import { ManagedTenantUserEditorDialog } from "@/components/tenants/managed-tenant-user-editor-dialog";
import { ManagedTenantUsersTable } from "@/components/tenants/managed-tenant-users-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMainConsoleUserPermissions } from "@/hooks/use-main-console-user-permissions";
import { useManagedTenantUserActions } from "@/hooks/use-managed-tenant-user-actions";
import { useManagedTenantUsers } from "@/hooks/use-managed-tenant-users";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

function TenantUsersSkeleton() {
  return (
    <div
      className="space-y-2 rounded-xl border border-border p-4"
      aria-label="Loading tenant users"
      aria-busy="true"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function TenantUsersManagementPanel({ tenantId }: { tenantId: string }) {
  const permissions = useMainConsoleUserPermissions();
  const {
    loading: permissionsLoading,
    error: permissionsError,
    canViewUsers,
    canActivateUsers,
    canCreateUsers,
    canEditUsers,
    canChangeRoles,
    canSuspendUsers,
    canResetPasswords,
    canDeleteUsers,
  } = permissions;
  const hasActions =
    canEditUsers ||
    canChangeRoles ||
    canSuspendUsers ||
    canActivateUsers ||
    canResetPasswords ||
    canDeleteUsers;
  const userList = useManagedTenantUsers({ tenantId, canViewUsers });
  const actions = useManagedTenantUserActions({
    tenantId,
    users: userList.users,
    page: userList.page,
    setPage: userList.setPage,
    refetch: userList.refetch,
    permissions: { canEditUsers, canChangeRoles, canSuspendUsers },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Users"
        description="Review user activation and account status for this sub-tenant."
        crumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Tenants", href: "/tenants" },
          { label: "Users" },
        ]}
        actions={
          <div className="flex gap-2">
            {canCreateUsers ? (
              <Button onClick={actions.openCreate}>
                <Plus />
                Create user
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/tenants">
                <ArrowLeft />
                Back to tenants
              </Link>
            </Button>
          </div>
        }
      />

      {!permissionsLoading && !permissionsError && canViewUsers ? (
        <SearchToolbar
          label="Search tenant users"
          placeholder="Search by name or email"
          value={userList.searchInput}
          onValueChange={userList.setSearchInput}
          onSearch={userList.applySearch}
        />
      ) : null}

      {permissionsLoading ? (
        <TenantUsersSkeleton />
      ) : permissionsError ? (
        <p className="text-sm text-destructive" role="alert">
          {permissionsError.message}
        </p>
      ) : !canViewUsers ? (
        <EmptyState
          title="User management unavailable"
          description="Your SuperAdmin user-management permissions do not allow viewing users in this sub-tenant."
        />
      ) : userList.error && !userList.data ? (
        <p className="text-sm text-destructive" role="alert">
          {userList.error.message}
        </p>
      ) : userList.loading && !userList.data ? (
        <TenantUsersSkeleton />
      ) : userList.users.length === 0 ? (
        <EmptyState
          title={userList.search ? "No users found" : "No users in this tenant"}
          description={
            userList.search
              ? "Try a different name or email."
              : "Create a user from the tenant list to invite someone."
          }
        />
      ) : (
        <ManagedTenantUsersTable
          users={userList.users}
          page={userList.page}
          pages={userList.pages}
          total={userList.total}
          loading={userList.loading}
          regenerating={actions.regenerating}
          loadingLink={actions.loadingLink}
          generatingReset={actions.generatingReset || actions.loadingResetLink}
          hasActions={hasActions}
          permissions={{
            canEdit: canEditUsers,
            canChangeRoles,
            canSuspend: canSuspendUsers,
            canActivate: canActivateUsers,
            canReset: canResetPasswords,
            canDelete: canDeleteUsers,
          }}
          onEdit={actions.openEdit}
          onActivation={(user) => {
            actions.setActionError(null);
            if (
              user.accountStatus === "PENDING" &&
              user.activationStatus === "PENDING"
            )
              void actions.viewCurrentLink(user);
            else actions.setConfirmUser(user);
          }}
          onResetPassword={actions.requestPasswordReset}
          onDelete={actions.setDeleteTarget}
          onPageChange={userList.setPage}
        />
      )}

      <ManagedTenantUserEditorDialog
        open={actions.editorOpen}
        editor={actions.editor}
        firstName={actions.firstName}
        lastName={actions.lastName}
        email={actions.email}
        role={actions.role}
        suspended={actions.suspended}
        canEdit={canEditUsers}
        canChangeRoles={canChangeRoles}
        canSuspend={canSuspendUsers}
        saving={actions.creating || actions.updating}
        error={actions.actionError}
        onOpenChange={(open) => {
          actions.setEditorOpen(open);
          if (!open) actions.setActionError(null);
        }}
        onFirstNameChange={actions.setFirstName}
        onLastNameChange={actions.setLastName}
        onEmailChange={actions.setEmail}
        onRoleChange={actions.setRole}
        onSuspendedChange={actions.setSuspended}
        onSave={() => void actions.saveUser()}
      />
      <DeleteManagedTenantUserDialog
        user={actions.deleteTarget}
        error={actions.actionError}
        loading={actions.deleting}
        onOpenChange={(open) => {
          if (!open && !actions.deleting) {
            actions.setDeleteTarget(null);
            actions.setActionError(null);
          }
        }}
        onConfirm={() => void actions.removeUser()}
      />
      <RegenerateActivationLinkDialog
        user={actions.confirmUser}
        result={actions.confirmUser ? actions.linkResult : null}
        error={actions.actionError}
        loading={actions.regenerating}
        copied={actions.copied}
        onOpenChange={(open) => {
          if (!open && !actions.regenerating) {
            actions.setConfirmUser(null);
            actions.setLinkResult(null);
            actions.setCopied(false);
            actions.setActionError(null);
          }
        }}
        onConfirm={() => void actions.confirmRegeneration()}
        onCopy={() => void actions.copyLink()}
        onDone={() => {
          actions.setConfirmUser(null);
          actions.setLinkResult(null);
          actions.setCopied(false);
        }}
      />
      <ResetManagedTenantUserPasswordDialog
        user={actions.resetTarget}
        error={actions.actionError}
        loading={actions.generatingReset}
        onOpenChange={(open) => {
          if (!open && !actions.generatingReset) {
            actions.setResetTarget(null);
            actions.setActionError(null);
          }
        }}
        onConfirm={() => void actions.resetPassword()}
      />
      <ManagedTenantActivationLinkDialog
        result={actions.confirmUser ? null : actions.linkResult}
        error={actions.actionError}
        loading={actions.loadingLink}
        copied={actions.copied}
        canRegenerate={canActivateUsers}
        onOpenChange={(open) => {
          if (!open) {
            actions.setLinkResult(null);
            actions.setCopied(false);
            actions.setActionError(null);
          }
        }}
        onCopy={() => void actions.copyLink()}
        onRegenerate={(user) => {
          actions.setLinkResult(null);
          actions.setCopied(false);
          actions.setConfirmUser(user);
        }}
      />
    </div>
  );
}
