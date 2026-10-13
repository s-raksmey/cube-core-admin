"use client";

import type { MainTenantUsersList } from "@/hooks/use-main-tenant-users";
import type { MainUserDialogState } from "@/hooks/use-main-user-dialog-state";
import {
  CREATE_MAIN_TENANT_USER,
  DELETE_MAIN_TENANT_USER,
  GENERATE_MAIN_TENANT_USER_ACTIVATION,
  GENERATE_MAIN_TENANT_USER_PASSWORD_RESET,
  MAIN_TENANT_USER_ACTIVATION_LINK,
  UPDATE_MAIN_TENANT_USER,
} from "@/lib/apollo/operations";
import type {
  CreateMainTenantUserMutation,
  CreateMainTenantUserMutationVariables,
  GenerateMainTenantUserActivationLinkMutation,
  GenerateMainTenantUserActivationLinkMutationVariables,
  GenerateMainTenantUserPasswordResetLinkMutation,
  GenerateMainTenantUserPasswordResetLinkMutationVariables,
  MainTenantUserActivationLinkQuery,
  MainTenantUserActivationLinkQueryVariables,
  MainTenantUserRow,
} from "@/lib/apollo/types";
import { useLazyQuery, useMutation } from "@apollo/client/react";

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** Owns the Main Tenant user-management mutations and secure-link workflows. */
export function useMainTenantUserActions({
  canSuspendUsers,
  dialogs,
  list,
}: {
  canSuspendUsers: boolean;
  dialogs: MainUserDialogState;
  list: MainTenantUsersList;
}) {
  const [createUser, { loading: creating }] = useMutation<
    CreateMainTenantUserMutation,
    CreateMainTenantUserMutationVariables
  >(CREATE_MAIN_TENANT_USER);
  const [updateUser, { loading: updating }] = useMutation(
    UPDATE_MAIN_TENANT_USER,
  );
  const [deleteUser, { loading: deleting }] = useMutation(
    DELETE_MAIN_TENANT_USER,
  );
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

  async function confirmCreate() {
    dialogs.setFormError(null);
    try {
      const result = await createUser({
        variables: {
          firstName: dialogs.firstName,
          lastName: dialogs.lastName,
          email: dialogs.email,
        },
      });
      const payload = result.data?.createMainTenantUser;
      dialogs.setCreateConfirmOpen(false);
      if (payload) {
        dialogs.setActivationLinkUser(null);
        dialogs.setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${payload.user.email}`,
        });
      }
      await list.refetch();
    } catch (error) {
      dialogs.setCreateConfirmOpen(false);
      dialogs.setCreateOpen(true);
      dialogs.setFormError(messageFor(error, "Could not create user"));
    }
  }

  async function confirmUpdate() {
    if (!dialogs.editUser) return;
    dialogs.setFormError(null);
    try {
      await updateUser({
        variables: {
          id: dialogs.editUser.id,
          input: {
            firstName: dialogs.firstName,
            lastName: dialogs.lastName,
            email: dialogs.email,
            ...(dialogs.editUser.status === "PENDING" ||
            !canSuspendUsers ||
            dialogs.status ===
              (dialogs.editUser.membershipStatus === "DISABLED"
                ? "INACTIVE"
                : "ACTIVE")
              ? {}
              : { suspended: dialogs.status === "INACTIVE" }),
          },
        },
      });
      dialogs.setEditConfirmOpen(false);
      dialogs.setEditUser(null);
      await list.refetch();
    } catch (error) {
      dialogs.setEditConfirmOpen(false);
      dialogs.setFormError(messageFor(error, "Could not update user"));
    }
  }

  async function deleteSelectedUser() {
    if (!dialogs.deleteTarget) return;
    dialogs.setFormError(null);
    try {
      await deleteUser({ variables: { id: dialogs.deleteTarget.id } });
      dialogs.setDeleteTarget(null);
      if (list.users.length === 1 && list.page > 1) {
        list.setPage(list.page - 1);
        return;
      }
      await list.refetch();
    } catch (error) {
      dialogs.setFormError(messageFor(error, "Could not delete user"));
    }
  }

  async function confirmResetPassword() {
    if (!dialogs.resetTarget) return;
    const user = dialogs.resetTarget;
    dialogs.setBusyUserId(user.id);
    dialogs.setFormError(null);
    try {
      const result = await generateReset({ variables: { userId: user.id } });
      const payload = result.data?.generateMainTenantUserPasswordResetLink;
      if (!payload) {
        dialogs.setFormError("Could not generate reset link");
        return;
      }
      dialogs.setResetTarget(null);
      dialogs.setActivationLinkUser(null);
      dialogs.setLinkResult({
        url: payload.resetUrl,
        expiresAt: payload.expiresAt,
        label: `Password reset link for ${user.email}`,
      });
    } catch (error) {
      dialogs.setFormError(messageFor(error, "Could not generate reset link"));
    } finally {
      dialogs.setBusyUserId(null);
    }
  }

  async function confirmActivationLink() {
    if (!dialogs.activationTarget) return;
    const user = dialogs.activationTarget;
    dialogs.setBusyUserId(user.id);
    dialogs.setFormError(null);
    try {
      const result = await generateActivation({
        variables: { userId: user.id },
      });
      const payload = result.data?.generateMainTenantUserActivationLink;
      if (!payload) {
        dialogs.setFormError("Could not generate activation link");
        return;
      }
      dialogs.setActivationTarget(null);
      dialogs.setActivationLinkUnavailable(false);
      dialogs.setActivationLinkUser(null);
      dialogs.setLinkResult({
        url: payload.activationUrl,
        expiresAt: payload.expiresAt,
        label: `Activation link for ${user.email}`,
      });
      await list.refetch();
    } catch (error) {
      dialogs.setFormError(
        messageFor(error, "Could not generate activation link"),
      );
    } finally {
      dialogs.setBusyUserId(null);
    }
  }

  async function viewActivationLink(user: MainTenantUserRow) {
    dialogs.setBusyUserId(user.id);
    dialogs.setFormError(null);
    dialogs.setActivationResetMode(false);
    dialogs.setActivationLinkUnavailable(false);
    dialogs.setActivationLookupFailed(false);
    try {
      const result = await loadActivationLink({
        variables: { userId: user.id },
      });
      const payload = result.data?.mainTenantUserActivationLink;
      if (payload) {
        dialogs.setActivationLinkUser(user);
        dialogs.setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${user.email}`,
        });
        return;
      }
      dialogs.setActivationLinkUnavailable(true);
      dialogs.setActivationTarget(user);
    } catch (error) {
      dialogs.setFormError(messageFor(error, "Could not load activation link"));
      dialogs.setActivationLookupFailed(true);
      dialogs.setActivationTarget(user);
    } finally {
      dialogs.setBusyUserId(null);
    }
  }

  function requestActivationRegeneration() {
    if (!dialogs.activationLinkUser) return;
    dialogs.setLinkResult(null);
    dialogs.setActivationTarget(dialogs.activationLinkUser);
    dialogs.setActivationLinkUnavailable(false);
    dialogs.setActivationLookupFailed(false);
    dialogs.setActivationResetMode(false);
    dialogs.setFormError(null);
  }

  function retryActivationLookup() {
    if (!dialogs.activationTarget) return;
    const user = dialogs.activationTarget;
    dialogs.setActivationTarget(null);
    void viewActivationLink(user);
  }

  function requestUserReactivation(user: MainTenantUserRow) {
    dialogs.setFormError(null);
    dialogs.setActivationResetMode(true);
    dialogs.setActivationLinkUnavailable(false);
    dialogs.setActivationLookupFailed(false);
    dialogs.setActivationTarget(user);
  }

  async function copyLink() {
    if (dialogs.linkResult?.url) {
      await navigator.clipboard.writeText(dialogs.linkResult.url);
    }
  }

  return {
    creating,
    updating,
    deleting,
    resetting,
    regenerating,
    loadingActivationLink,
    confirmCreate,
    confirmUpdate,
    deleteSelectedUser,
    confirmResetPassword,
    confirmActivationLink,
    viewActivationLink,
    requestActivationRegeneration,
    retryActivationLookup,
    requestUserReactivation,
    copyLink,
  };
}
