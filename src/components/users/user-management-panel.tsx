"use client";

import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import {
  CREATE_MAIN_TENANT_USER,
  CURRENT_USER_QUERY,
  DELETE_MAIN_TENANT_USER,
  GENERATE_MAIN_TENANT_USER_ACTIVATION,
  MAIN_TENANT_USER_ACTIVATION_LINK,
  GENERATE_MAIN_TENANT_USER_PASSWORD_RESET,
  MAIN_TENANT_USERS_QUERY,
  UPDATE_MAIN_TENANT_USER,
} from "@/lib/apollo/operations";
import type {
  CreateMainTenantUserMutation,
  CreateMainTenantUserMutationVariables,
  CurrentUserQuery,
  GenerateMainTenantUserActivationLinkMutation,
  GenerateMainTenantUserActivationLinkMutationVariables,
  GenerateMainTenantUserPasswordResetLinkMutation,
  GenerateMainTenantUserPasswordResetLinkMutationVariables,
  MainTenantUserRow,
  MainTenantUserActivationLinkQuery,
  MainTenantUserActivationLinkQueryVariables,
  MainTenantUsersQuery,
} from "@/lib/apollo/types";
import { EmptyState } from "@/components/dashboard/empty-state";
import { UserManagementDialogs } from "@/components/users/user-management-dialogs";
import { UserManagementTable } from "@/components/users/user-management-table";
import { UserListToolbar } from "@/components/users/user-list-toolbar";
import { useMainUserDialogState } from "@/components/users/use-main-user-dialog-state";
import { useMainConsoleUserPermissions } from "@/hooks/use-main-console-user-permissions";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";

type MainUserRow = MainTenantUserRow;

export function UserManagementPanel() {
  const { searchInput, setSearchInput, search, page, setPage, applySearch } = usePaginatedSearch();
  const pageSize = 10;

  const { data, loading, error, refetch } = useQuery<MainTenantUsersQuery>(
    MAIN_TENANT_USERS_QUERY,
    {
      variables: { search: search || null, page, pageSize },
      fetchPolicy: "cache-and-network",
    },
  );
  const { data: meData } = useQuery<CurrentUserQuery>(CURRENT_USER_QUERY);
  const { canSuspendUsers } = useMainConsoleUserPermissions();
  const currentUserId = meData?.me?.id ?? null;

  const [createUser, { loading: creating }] = useMutation<
    CreateMainTenantUserMutation,
    CreateMainTenantUserMutationVariables
  >(CREATE_MAIN_TENANT_USER);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_MAIN_TENANT_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_MAIN_TENANT_USER);
  const [generateReset, { loading: resetting }] = useMutation<
    GenerateMainTenantUserPasswordResetLinkMutation,
    GenerateMainTenantUserPasswordResetLinkMutationVariables
  >(GENERATE_MAIN_TENANT_USER_PASSWORD_RESET);
  const [generateActivation, { loading: regenerating }] = useMutation<
    GenerateMainTenantUserActivationLinkMutation,
    GenerateMainTenantUserActivationLinkMutationVariables
  >(GENERATE_MAIN_TENANT_USER_ACTIVATION);
  const [loadActivationLink, { loading: loadingActivationLink }] = useLazyQuery<
    MainTenantUserActivationLinkQuery,
    MainTenantUserActivationLinkQueryVariables
  >(MAIN_TENANT_USER_ACTIVATION_LINK, { fetchPolicy: "no-cache" });

  const { createOpen, setCreateOpen, createConfirmOpen, setCreateConfirmOpen, editUser, setEditUser, editConfirmOpen, setEditConfirmOpen, deleteTarget, setDeleteTarget, resetTarget, setResetTarget, activationTarget, setActivationTarget, activationResetMode, setActivationResetMode, activationLinkUser, setActivationLinkUser, activationLinkUnavailable, setActivationLinkUnavailable, activationLookupFailed, setActivationLookupFailed, firstName, setFirstName, lastName, setLastName, email, setEmail, status, setStatus, formError, setFormError, linkResult, setLinkResult, busyUserId, setBusyUserId, openCreate, openEdit, requestCreate, requestUpdate } = useMainUserDialogState();

  const pageData = data?.mainTenantUsers;
  const users = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const canPrev = page > 1;
  const canNext = page < totalPages;

  async function confirmCreate() {
    setFormError(null);
    try {
      const result = await createUser({
        variables: { firstName, lastName, email },
      });
      const payload = result.data?.createMainTenantUser;
      setCreateConfirmOpen(false);
      if (payload) {
        setActivationLinkUser(null);
        setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${payload.user.email}`,
        });
      }
      await refetch();
    } catch (err) {
      setCreateConfirmOpen(false);
      setCreateOpen(true);
      setFormError(err instanceof Error ? err.message : "Could not create user");
    }
  }

  async function confirmUpdate() {
    if (!editUser) return;
    setFormError(null);
    try {
      await updateUser({
        variables: {
          id: editUser.id,
          input: {
            firstName,
            lastName,
            email,
            ...(editUser.status === "PENDING" || !canSuspendUsers ||
            status === (editUser.membershipStatus === "DISABLED" ? "INACTIVE" : "ACTIVE")
              ? {}
              : { suspended: status === "INACTIVE" }),
          },
        },
      });
      setEditConfirmOpen(false);
      setEditUser(null);
      await refetch();
    } catch (err) {
      setEditConfirmOpen(false);
      setFormError(err instanceof Error ? err.message : "Could not update user");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setFormError(null);
    try {
      await deleteUser({ variables: { id: deleteTarget.id } });
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete user");
    }
  }

  async function confirmResetPassword() {
    if (!resetTarget) return;
    const user = resetTarget;
    setBusyUserId(user.id);
    setFormError(null);
    try {
      const result = await generateReset({ variables: { userId: user.id } });
      const payload = result.data?.generateMainTenantUserPasswordResetLink;
      if (!payload) {
        setFormError("Could not generate reset link");
        return;
      }
      setResetTarget(null);
      setActivationLinkUser(null);
      setLinkResult({
        url: payload.resetUrl,
        expiresAt: payload.expiresAt,
        label: `Password reset link for ${user.email}`,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not generate reset link",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function confirmActivationLink() {
    if (!activationTarget) return;
    const user = activationTarget;
    setBusyUserId(user.id);
    setFormError(null);
    try {
      const result = await generateActivation({
        variables: { userId: user.id },
      });
      const payload = result.data?.generateMainTenantUserActivationLink;
      if (!payload) {
        setFormError("Could not generate activation link");
        return;
      }
      setActivationTarget(null);
      setActivationLinkUnavailable(false);
      setActivationLinkUser(null);
      setLinkResult({
        url: payload.activationUrl,
        expiresAt: payload.expiresAt,
        label: `Activation link for ${user.email}`,
      });
      void refetch().catch(() => undefined);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not generate activation link",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function viewActivationLink(user: MainUserRow) {
    setBusyUserId(user.id);
    setFormError(null);
    setActivationResetMode(false);
    setActivationLinkUnavailable(false);
    setActivationLookupFailed(false);
    try {
      const result = await loadActivationLink({ variables: { userId: user.id } });
      const payload = result.data?.mainTenantUserActivationLink;
      if (payload) {
        setActivationLinkUser(user);
        setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${user.email}`,
        });
        return;
      }
      setActivationLinkUnavailable(true);
      setActivationTarget(user);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not load activation link");
      setActivationLookupFailed(true);
      setActivationTarget(user);
    } finally {
      setBusyUserId(null);
    }
  }

  function requestActivationRegeneration() {
    if (!activationLinkUser) return;
    setLinkResult(null);
    setActivationTarget(activationLinkUser);
    setActivationLinkUnavailable(false);
    setActivationLookupFailed(false);
    setActivationResetMode(false);
    setFormError(null);
  }

  function retryActivationLookup() {
    if (!activationTarget) return;
    const user = activationTarget;
    setActivationTarget(null);
    void viewActivationLink(user);
  }

  function requestUserReactivation(user: MainUserRow) {
    setFormError(null);
    setActivationResetMode(true);
    setActivationLinkUnavailable(false);
    setActivationLookupFailed(false);
    setActivationTarget(user);
  }

  async function copyLink() {
    if (!linkResult?.url) return;
    await navigator.clipboard.writeText(linkResult.url);
  }

  return (
    <div className="space-y-4">
      <UserListToolbar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={applySearch}
        onCreate={openCreate}
      />

      {loading && !pageData ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          Unable to load users. SuperAdmin access is required.
        </p>
      ) : null}

      {!loading && !error && users.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            search
              ? "No users match your search."
              : "Create the first additional SuperAdmin user for the Main Console."
          }
        />
      ) : null}

      {users.length > 0 ? (
        <UserManagementTable
          users={users}
          currentUserId={currentUserId}
          busyUserId={busyUserId}
          regenerating={regenerating || loadingActivationLink}
          resetting={resetting}
          page={page}
          totalPages={totalPages}
          total={total}
          canPrev={canPrev}
          canNext={canNext}
          onEdit={openEdit}
          onGenerateActivation={viewActivationLink}
          onReactivate={requestUserReactivation}
          onResetPassword={(user) => {
            setFormError(null);
            setResetTarget(user);
          }}
          onDelete={(user) => {
            setFormError(null);
            setDeleteTarget(user);
          }}
          onPageChange={setPage}
        />
      ) : null}

      <UserManagementDialogs
        {...{
          createOpen, setCreateOpen, createConfirmOpen, setCreateConfirmOpen,
          editUser, setEditUser, editConfirmOpen, setEditConfirmOpen,
          deleteTarget, setDeleteTarget, resetTarget, setResetTarget,
          activationTarget, setActivationTarget, firstName, setFirstName,
          lastName, setLastName, email, setEmail, status, setStatus,
          formError, setFormError, linkResult, setLinkResult, creating, updating,
          deleting, resetting, regenerating, requestCreate, requestUpdate,
          confirmCreate, confirmUpdate, handleDelete, confirmResetPassword,
          confirmActivationLink, copyLink,
          activationLinkUnavailable, activationLinkUser, requestActivationRegeneration,
          activationLookupFailed, retryActivationLookup,
          activationResetMode,
          canSuspendUsers,
        }}
      />

    </div>
  );
}
