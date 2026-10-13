"use client";

import {
  CREATE_ADMIN_USER,
  DELETE_MANAGED_SUB_TENANT_USER,
  GENERATE_MANAGED_SUB_TENANT_USER_PASSWORD_RESET,
  REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  SUB_TENANT_USER_ACTIVATION_LINK_QUERY,
  SUB_TENANT_USER_PASSWORD_RESET_LINK_QUERY,
  UPDATE_MANAGED_SUB_TENANT_USER,
} from "@/lib/apollo/operations";
import type {
  RegenerateSubTenantUserActivationLinkMutation,
  SubTenantUserActivationLinkQuery,
} from "@/lib/apollo/types";
import type {
  ManagedTenantUser,
  ManagedTenantUserLinkResult,
} from "@/types/tenant-management.types";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { useState } from "react";

type UserPermissions = {
  canEditUsers: boolean;
  canChangeRoles: boolean;
  canSuspendUsers: boolean;
};

function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to complete the request.";
}

export function useManagedTenantUserActions({
  tenantId,
  users,
  page,
  setPage,
  refetch,
  permissions,
}: {
  tenantId: string;
  users: ManagedTenantUser[];
  page: number;
  setPage: (page: number) => void;
  refetch: () => Promise<unknown>;
  permissions: UserPermissions;
}) {
  const [confirmUser, setConfirmUser] = useState<ManagedTenantUser | null>(
    null,
  );
  const [linkResult, setLinkResult] =
    useState<ManagedTenantUserLinkResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editor, setEditor] = useState<ManagedTenantUser | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR">("EDITOR");
  const [suspended, setSuspended] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedTenantUser | null>(
    null,
  );
  const [resetTarget, setResetTarget] = useState<ManagedTenantUser | null>(
    null,
  );

  const [regenerate, { loading: regenerating }] = useMutation(
    REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  );
  const [createUser, { loading: creating }] = useMutation(CREATE_ADMIN_USER);
  const [updateUser, { loading: updating }] = useMutation(
    UPDATE_MANAGED_SUB_TENANT_USER,
  );
  const [generateReset, { loading: generatingReset }] = useMutation(
    GENERATE_MANAGED_SUB_TENANT_USER_PASSWORD_RESET,
  );
  const [deleteUser, { loading: deleting }] = useMutation(
    DELETE_MANAGED_SUB_TENANT_USER,
  );
  const [loadActivationLink, { loading: loadingLink }] = useLazyQuery(
    SUB_TENANT_USER_ACTIVATION_LINK_QUERY,
    { fetchPolicy: "no-cache" },
  );
  const [loadResetLink, { loading: loadingResetLink }] = useLazyQuery(
    SUB_TENANT_USER_PASSWORD_RESET_LINK_QUERY,
    { fetchPolicy: "no-cache" },
  );

  async function requestPasswordReset(user: ManagedTenantUser) {
    setActionError(null);
    try {
      const response = await loadResetLink({
        variables: { tenantId, userId: user.id },
      });
      const link = response.data?.subTenantUserPasswordResetLink;
      if (link) {
        setLinkResult({
          user,
          url: link.resetUrl,
          expiresAt: link.expiresAt,
          isNew: false,
          kind: "password-reset",
        });
      } else {
        setResetTarget(user);
      }
    } catch (error) {
      setActionError(errorText(error));
    }
  }

  function openCreate() {
    setEditor(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole(permissions.canChangeRoles ? "ADMIN" : "EDITOR");
    setSuspended(false);
    setActionError(null);
    setEditorOpen(true);
  }

  function openEdit(user: ManagedTenantUser) {
    setEditor(user);
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEmail(user.email);
    setRole(user.role as "ADMIN" | "EDITOR");
    setSuspended(user.membershipStatus === "DISABLED");
    setActionError(null);
    setEditorOpen(true);
  }

  async function confirmRegeneration() {
    if (!confirmUser) return;
    setActionError(null);
    try {
      const response = await regenerate({
        variables: { tenantId, userId: confirmUser.id },
      });
      const payload = (
        response.data as RegenerateSubTenantUserActivationLinkMutation | null
      )?.regenerateSubTenantUserActivationLink;
      if (!payload?.activationUrl) {
        throw new Error("The new activation link was not returned.");
      }
      setLinkResult({
        user: confirmUser,
        url: payload.activationUrl,
        expiresAt: payload.expiresAt,
        isNew: true,
        kind: "activation",
      });
      // The link dialog should not wait for the list refresh.
      void refetch();
    } catch (error) {
      setActionError(errorText(error));
    }
  }

  async function viewCurrentLink(user: ManagedTenantUser) {
    setActionError(null);
    setCopied(false);
    try {
      const response = await loadActivationLink({
        variables: { tenantId, userId: user.id },
      });
      const payload = (
        response.data as SubTenantUserActivationLinkQuery | undefined
      )?.subTenantUserActivationLink;
      setLinkResult({
        user,
        url: payload?.activationUrl ?? null,
        expiresAt: payload?.expiresAt ?? user.activationLinkExpiresAt ?? "",
        isNew: false,
        kind: "activation",
      });
    } catch (error) {
      setActionError(errorText(error));
      setLinkResult({
        user,
        url: null,
        expiresAt: user.activationLinkExpiresAt ?? "",
        isNew: false,
        kind: "activation",
      });
    }
  }

  async function copyLink() {
    if (!linkResult?.url) return;
    try {
      await navigator.clipboard.writeText(linkResult.url);
      setCopied(true);
    } catch {
      setActionError("Could not copy the link. Select and copy it manually.");
    }
  }

  async function saveUser() {
    setActionError(null);
    try {
      if (editor) {
        await updateUser({
          variables: {
            tenantId,
            userId: editor.id,
            input: {
              ...(permissions.canEditUsers
                ? { firstName, lastName, email }
                : {}),
              ...(permissions.canChangeRoles && role !== editor.role
                ? { role }
                : {}),
              ...(permissions.canSuspendUsers &&
              suspended !== (editor.membershipStatus === "DISABLED")
                ? { suspended }
                : {}),
            },
          },
        });
      } else {
        const response = await createUser({
          variables: { tenantId, firstName, lastName, email, role },
        });
        const payload = response.data?.createAdminUser;
        if (payload) {
          setLinkResult({
            user: {
              id: payload.user.id,
              fullName: payload.user.fullName,
              email: payload.user.email,
            } as ManagedTenantUser,
            url: payload.activationUrl,
            expiresAt: payload.expiresAt,
            isNew: true,
            kind: "activation",
          });
        }
      }
      setEditorOpen(false);
      await refetch();
    } catch (error) {
      setActionError(errorText(error));
    }
  }

  async function resetPassword() {
    if (!resetTarget) return;
    setActionError(null);
    try {
      const response = await generateReset({
        variables: { tenantId, userId: resetTarget.id },
      });
      const payload =
        response.data?.generateManagedSubTenantUserPasswordResetLink;
      if (!payload)
        throw new Error("The password reset link was not returned.");
      setLinkResult({
        user: resetTarget,
        url: payload.resetUrl,
        expiresAt: payload.expiresAt,
        isNew: true,
        kind: "password-reset",
      });
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      setResetTarget(null);
    }
  }

  async function removeUser() {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await deleteUser({ variables: { tenantId, userId: deleteTarget.id } });
      setDeleteTarget(null);
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
        return;
      }
      await refetch();
    } catch (error) {
      setActionError(errorText(error));
    }
  }

  return {
    actionError,
    copied,
    confirmUser,
    linkResult,
    editor,
    editorOpen,
    firstName,
    lastName,
    email,
    role,
    suspended,
    deleteTarget,
    resetTarget,
    regenerating,
    creating,
    updating,
    generatingReset,
    deleting,
    loadingLink,
    loadingResetLink,
    openCreate,
    openEdit,
    confirmRegeneration,
    viewCurrentLink,
    copyLink,
    saveUser,
    resetPassword,
    requestPasswordReset,
    removeUser,
    setActionError,
    setCopied,
    setConfirmUser,
    setLinkResult,
    setEditorOpen,
    setFirstName,
    setLastName,
    setEmail,
    setRole,
    setSuspended,
    setDeleteTarget,
    setResetTarget,
  };
}
