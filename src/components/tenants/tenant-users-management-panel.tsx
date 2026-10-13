"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchToolbar } from "@/components/dashboard/search-toolbar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ManagedTenantUsersTable, type ManagedTenantUser } from "@/components/tenants/managed-tenant-users-table";
import { ManagedTenantUserEditorDialog } from "@/components/tenants/managed-tenant-user-editor-dialog";
import {
  DeleteManagedTenantUserDialog,
  ManagedTenantActivationLinkDialog,
  RegenerateActivationLinkDialog,
  type ManagedTenantUserLinkResult,
} from "@/components/tenants/managed-tenant-user-confirm-dialogs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MANAGED_SUB_TENANT_USERS_QUERY,
  CREATE_ADMIN_USER,
  DELETE_MANAGED_SUB_TENANT_USER,
  GENERATE_MANAGED_SUB_TENANT_USER_PASSWORD_RESET,
  REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  SUB_TENANT_USER_ACTIVATION_LINK_QUERY,
  UPDATE_MANAGED_SUB_TENANT_USER,
} from "@/lib/apollo/operations";
import type {
  RegenerateSubTenantUserActivationLinkMutation,
  SubTenantUserActivationLinkQuery,
} from "@/lib/apollo/types";
import { useMainConsoleUserPermissions } from "@/hooks/use-main-console-user-permissions";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";

const PAGE_SIZE = 10;
type ManagedUser = ManagedTenantUser;

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete the request.";
}

export function TenantUsersManagementPanel({ tenantId }: { tenantId: string }) {
  const { searchInput, setSearchInput, search, page, setPage, applySearch } = usePaginatedSearch();
  const [confirmUser, setConfirmUser] = useState<ManagedUser | null>(null);
  const [linkResult, setLinkResult] = useState<ManagedTenantUserLinkResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editor, setEditor] = useState<ManagedUser | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR">("EDITOR");
  const [suspended, setSuspended] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const { loading: permissionsLoading, error: permissionsError, canViewUsers, canActivateUsers, canCreateUsers, canEditUsers, canChangeRoles, canSuspendUsers, canResetPasswords, canDeleteUsers } = useMainConsoleUserPermissions();
  const hasActions = canEditUsers || canChangeRoles || canSuspendUsers || canActivateUsers || canResetPasswords || canDeleteUsers;

  const { data, loading, error, refetch } = useQuery(MANAGED_SUB_TENANT_USERS_QUERY, {
    variables: { tenantId, search: search || null, page, pageSize: PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
    skip: !canViewUsers,
  });
  const [regenerate, { loading: regenerating }] = useMutation(
    REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  );
  const [createUser, { loading: creating }] = useMutation(CREATE_ADMIN_USER);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_MANAGED_SUB_TENANT_USER);
  const [generateReset, { loading: generatingReset }] = useMutation(GENERATE_MANAGED_SUB_TENANT_USER_PASSWORD_RESET);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_MANAGED_SUB_TENANT_USER);
  const [loadActivationLink, { loading: loadingLink }] = useLazyQuery(
    SUB_TENANT_USER_ACTIVATION_LINK_QUERY,
    { fetchPolicy: "no-cache" },
  );
  const result = data?.subTenantUsers;
  const users = useMemo(() => result?.items ?? [], [result?.items]);
  const total = result?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const nextExpiry = users
      .map((user) => user.activationLinkExpiresAt ? Date.parse(user.activationLinkExpiresAt) : NaN)
      .filter((expiresAt) => Number.isFinite(expiresAt) && expiresAt > Date.now())
      .sort((left, right) => left - right)[0];
    if (!nextExpiry) return;
    const timeout = window.setTimeout(() => { void refetch(); }, Math.max(0, nextExpiry - Date.now() + 25));
    return () => window.clearTimeout(timeout);
  }, [users, refetch]);

  async function confirmRegeneration() {
    if (!confirmUser) return;
    setActionError(null);
    try {
      const response = await regenerate({
        variables: { tenantId, userId: confirmUser.id },
      });
      const payload = (response.data as RegenerateSubTenantUserActivationLinkMutation | null)
        ?.regenerateSubTenantUserActivationLink;
      if (!payload?.activationUrl) throw new Error("The new activation link was not returned.");
      setLinkResult({ user: confirmUser, url: payload.activationUrl, expiresAt: payload.expiresAt, isNew: true });
      setConfirmUser(null);
      await refetch();
    } catch (mutationError) {
      setActionError(errorText(mutationError));
    }
  }

  async function viewCurrentLink(user: ManagedUser) {
    setActionError(null);
    setCopied(false);
    setLinkResult({
      user,
      url: null,
      expiresAt: user.activationLinkExpiresAt ?? "",
      isNew: false,
    });
    try {
      const response = await loadActivationLink({ variables: { tenantId, userId: user.id } });
      const payload = (response.data as SubTenantUserActivationLinkQuery | undefined)
        ?.subTenantUserActivationLink;
      setLinkResult({
        user,
        url: payload?.activationUrl ?? null,
        expiresAt: payload?.expiresAt ?? user.activationLinkExpiresAt ?? "",
        isNew: false,
      });
    } catch (queryError) {
      setActionError(errorText(queryError));
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

  function openCreate() {
    setEditor(null); setFirstName(""); setLastName(""); setEmail(""); setRole(canChangeRoles ? "ADMIN" : "EDITOR"); setSuspended(false); setActionError(null); setEditorOpen(true);
  }

  function openEdit(user: ManagedUser) {
    setEditor(user); setFirstName(user.firstName ?? ""); setLastName(user.lastName ?? ""); setEmail(user.email); setRole(user.role as "ADMIN" | "EDITOR"); setSuspended(user.membershipStatus === "DISABLED"); setActionError(null); setEditorOpen(true);
  }

  async function saveUser() {
    setActionError(null);
    try {
      if (editor) {
        await updateUser({ variables: { tenantId, userId: editor.id, input: {
          ...(canEditUsers ? { firstName, lastName, email } : {}),
          ...(canChangeRoles && role !== editor.role ? { role } : {}),
          ...(canSuspendUsers && suspended !== (editor.membershipStatus === "DISABLED") ? { suspended } : {}),
        } } });
      } else {
        const response = await createUser({ variables: { tenantId, firstName, lastName, email, role } });
        const payload = response.data?.createAdminUser;
        if (payload) setLinkResult({ user: { id: payload.user.id, fullName: payload.user.fullName, email: payload.user.email } as ManagedUser, url: payload.activationUrl, expiresAt: payload.expiresAt, isNew: true });
      }
      setEditorOpen(false); await refetch();
    } catch (reason) { setActionError(errorText(reason)); }
  }

  async function resetPassword(user: ManagedUser) {
    setActionError(null);
    try {
      const response = await generateReset({ variables: { tenantId, userId: user.id } });
      const payload = response.data?.generateManagedSubTenantUserPasswordResetLink;
      if (!payload) throw new Error("The password reset link was not returned.");
      setLinkResult({ user, url: payload.resetUrl, expiresAt: payload.expiresAt, isNew: true });
    } catch (reason) { setActionError(errorText(reason)); }
  }

  async function removeUser() {
    if (!deleteTarget) return;
    setActionError(null);
    try { await deleteUser({ variables: { tenantId, userId: deleteTarget.id } }); setDeleteTarget(null); await refetch(); }
    catch (reason) { setActionError(errorText(reason)); }
  }

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
        actions={<div className="flex gap-2">{canCreateUsers ? <Button onClick={openCreate}><Plus /> Create user</Button> : null}<Button asChild variant="outline"><Link href="/tenants"><ArrowLeft /> Back to tenants</Link></Button></div>}
      />

      {canViewUsers ? <SearchToolbar label="Search tenant users" placeholder="Search by name or email" value={searchInput} onValueChange={setSearchInput} onSearch={applySearch} /> : null}

      {permissionsError ? <p className="text-sm text-destructive" role="alert">{permissionsError.message}</p> : null}
      {!permissionsLoading && !permissionsError && !canViewUsers ? (
        <EmptyState
          title="User management unavailable"
          description="Your SuperAdmin user-management permissions do not allow viewing users in this sub-tenant."
        />
      ) : null}
      {error && !data ? <p className="text-sm text-destructive" role="alert">{error.message}</p> : null}
      {canViewUsers && loading && users.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-border p-4" aria-label="Loading tenant users">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-11 w-full" />)}
        </div>
      ) : canViewUsers && users.length === 0 ? (
        <EmptyState
          title={search ? "No users found" : "No users in this tenant"}
          description={search ? "Try a different name or email." : "Create a user from the tenant list to invite someone."}
        />
      ) : (
        <ManagedTenantUsersTable
          users={users}
          page={page}
          pages={pages}
          total={total}
          loading={loading}
          regenerating={regenerating}
          loadingLink={loadingLink}
          generatingReset={generatingReset}
          hasActions={hasActions}
          permissions={{ canEdit: canEditUsers, canChangeRoles, canSuspend: canSuspendUsers, canActivate: canActivateUsers, canReset: canResetPasswords, canDelete: canDeleteUsers }}
          onEdit={openEdit}
          onActivation={(user) => {
            setActionError(null);
            if (user.accountStatus === "PENDING" && user.activationStatus === "PENDING") void viewCurrentLink(user);
            else setConfirmUser(user);
          }}
          onResetPassword={(user) => void resetPassword(user)}
          onDelete={setDeleteTarget}
          onPageChange={setPage}
        />
      )}

      <ManagedTenantUserEditorDialog
        open={editorOpen}
        editor={editor}
        firstName={firstName}
        lastName={lastName}
        email={email}
        role={role}
        suspended={suspended}
        canEdit={canEditUsers}
        canChangeRoles={canChangeRoles}
        canSuspend={canSuspendUsers}
        saving={creating || updating}
        error={actionError}
        onOpenChange={(open) => { setEditorOpen(open); if (!open) setActionError(null); }}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onEmailChange={setEmail}
        onRoleChange={setRole}
        onSuspendedChange={setSuspended}
        onSave={() => void saveUser()}
      />

      <DeleteManagedTenantUserDialog
        user={deleteTarget}
        error={actionError}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
            setActionError(null);
          }
        }}
        onConfirm={() => void removeUser()}
      />

      <RegenerateActivationLinkDialog
        user={confirmUser}
        error={actionError}
        loading={regenerating}
        onOpenChange={(open) => {
          if (!open && !regenerating) {
            setConfirmUser(null);
            setActionError(null);
          }
        }}
        onConfirm={() => void confirmRegeneration()}
      />

      <ManagedTenantActivationLinkDialog
        result={linkResult}
        error={actionError}
        loading={loadingLink}
        copied={copied}
        canRegenerate={canActivateUsers}
        onOpenChange={(open) => {
          if (!open) {
            setLinkResult(null);
            setCopied(false);
            setActionError(null);
          }
        }}
        onCopy={() => void copyLink()}
        onRegenerate={(user) => {
          setLinkResult(null);
          setCopied(false);
          setConfirmUser(user);
        }}
      />
    </div>
  );
}
