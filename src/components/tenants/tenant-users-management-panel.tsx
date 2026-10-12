"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeft, Check, Copy, KeyRound, Pencil, Plus, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MANAGED_SUB_TENANT_USERS_QUERY,
  CREATE_ADMIN_USER,
  DELETE_MANAGED_SUB_TENANT_USER,
  GENERATE_MANAGED_SUB_TENANT_USER_PASSWORD_RESET,
  MAIN_CONSOLE_USER_PERMISSIONS_QUERY,
  REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  SUB_TENANT_USER_ACTIVATION_LINK_QUERY,
  UPDATE_MANAGED_SUB_TENANT_USER,
} from "@/lib/apollo/operations";
import type {
  ManagedSubTenantUsersQuery,
  MainConsoleUserPermissionsQuery,
  RegenerateSubTenantUserActivationLinkMutation,
  SubTenantUserActivationLinkQuery,
} from "@/lib/apollo/types";

const PAGE_SIZE = 10;
type ManagedUser = ManagedSubTenantUsersQuery["subTenantUsers"]["items"][number];

function dateLabel(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete the request.";
}

export function TenantUsersManagementPanel({ tenantId }: { tenantId: string }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmUser, setConfirmUser] = useState<ManagedUser | null>(null);
  const [linkResult, setLinkResult] = useState<{
    user: ManagedUser;
    url: string | null;
    expiresAt: string;
    isNew: boolean;
  } | null>(null);
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

  const { data: permissionsData, loading: permissionsLoading, error: permissionsError } = useQuery(
    MAIN_CONSOLE_USER_PERMISSIONS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const permissions = (permissionsData as MainConsoleUserPermissionsQuery | undefined)
    ?.tenantUserPermissions ?? [];
  const canViewUsers = permissions.includes("USERS_VIEW");
  const canActivateUsers = permissions.includes("USERS_ACTIVATE");
  const canCreateUsers = permissions.includes("USERS_CREATE");
  const canEditUsers = permissions.includes("USERS_EDIT");
  const canChangeRoles = permissions.includes("USERS_CHANGE_ROLE");
  const canSuspendUsers = permissions.includes("USERS_SUSPEND");
  const canResetPasswords = permissions.includes("USERS_RESET_PASSWORD");
  const canDeleteUsers = permissions.includes("USERS_DELETE");
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

  function applySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
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

      {canViewUsers ? <form className="flex w-full gap-2 sm:max-w-xl" onSubmit={applySearch}>
        <Input
          aria-label="Search tenant users"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <Button type="submit" variant="outline">Search</Button>
      </form> : null}

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
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account status</TableHead>
                  <TableHead>Activation</TableHead>
                  <TableHead>Link generated</TableHead>
                  <TableHead>Link expiry</TableHead>
                  {hasActions ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const eligible = (user.accountStatus === "PENDING" &&
                    (user.activationStatus === "PENDING" || user.activationStatus === "EXPIRED")) || user.accountStatus === "ACTIVE";
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell><StatusBadge status={user.membershipStatus === "DISABLED" ? "SUSPENDED" : user.accountStatus} /></TableCell>
                      <TableCell><StatusBadge status={user.activationStatus} /></TableCell>
                      <TableCell>{dateLabel(user.activationLinkCreatedAt)}</TableCell>
                      <TableCell>{dateLabel(user.activationLinkExpiresAt)}</TableCell>
                      {hasActions ? <TableCell className="text-right"><div className="flex justify-end gap-1">
                        {canEditUsers || canChangeRoles || canSuspendUsers ? <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Edit user"><Pencil /></Button> : null}
                        {canActivateUsers ?
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!eligible || regenerating || loadingLink}
                          onClick={() => {
                            setActionError(null);
                            if (user.accountStatus === "PENDING" && user.activationStatus === "PENDING") void viewCurrentLink(user);
                            else setConfirmUser(user);
                          }}
                          title={user.accountStatus === "ACTIVE" ? "Reactivate account and reset 2FA" : eligible ? "Regenerate activation link" : "Only pending or active accounts can receive an activation link"}
                        >
                          {user.accountStatus === "ACTIVE" ? <RotateCcw /> : <RotateCw />}
                        </Button> : null}
                        {canResetPasswords ? <Button variant="ghost" size="icon" disabled={generatingReset || user.accountStatus !== "ACTIVE"} onClick={() => void resetPassword(user)} title="Reset password"><KeyRound /></Button> : null}
                        {canDeleteUsers ? <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(user)} title="Delete tenant user"><Trash2 className="text-destructive" /></Button> : null}
                      </div></TableCell> : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Page {page} of {pages} · {total} users</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) setActionError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editor ? "Edit User" : "Create User"}</DialogTitle>
            <p className="text-sm text-muted-foreground">{editor ? "Update this sub-tenant user." : "Creates a pending user and a secure activation link."}</p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="managed-first">First name</Label><Input id="managed-first" value={firstName} disabled={Boolean(editor) && !canEditUsers} onChange={(event) => setFirstName(event.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="managed-last">Last name</Label><Input id="managed-last" value={lastName} disabled={Boolean(editor) && !canEditUsers} onChange={(event) => setLastName(event.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="managed-email">Email</Label><Input id="managed-email" type="email" value={email} disabled={Boolean(editor) && !canEditUsers} onChange={(event) => setEmail(event.target.value)} /></div>
            {canChangeRoles ? <div className="space-y-1.5"><Label htmlFor="managed-role">Role</Label><select id="managed-role" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value as "ADMIN" | "EDITOR")}><option value="ADMIN">ADMIN</option><option value="EDITOR">EDITOR</option></select></div> : null}
            {editor && canSuspendUsers && editor.accountStatus !== "PENDING" ? <div className="space-y-1.5"><Label htmlFor="managed-access">Tenant access</Label><select id="managed-access" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={suspended ? "SUSPENDED" : "ACTIVE"} onChange={(event) => setSuspended(event.target.value === "SUSPENDED")}><option value="ACTIVE">Unsuspend</option><option value="SUSPENDED">Suspend</option></select></div> : null}
            {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button disabled={creating || updating || !firstName.trim() || !lastName.trim() || !email.trim()} onClick={() => void saveUser()}>{creating || updating ? "Saving…" : editor ? "Save changes" : "Create user"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleting) { setDeleteTarget(null); setActionError(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete tenant user?</DialogTitle><p className="text-sm text-muted-foreground">Suspend this user first. Once suspended, deleting permanently removes their access to this sub-tenant and ends its tenant sessions.</p></DialogHeader>
          {deleteTarget ? <p className="rounded-md border p-3 text-sm">{deleteTarget.fullName} · {deleteTarget.email}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter><Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" disabled={deleting} onClick={() => void removeUser()}>{deleting ? "Deleting…" : "Delete user"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmUser)} onOpenChange={(open) => { if (!open && !regenerating) { setConfirmUser(null); setActionError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate activation link?</DialogTitle>
            <p className="text-sm text-muted-foreground">
              The existing activation link for {confirmUser?.fullName} will be revoked. Only the new link will work.
            </p>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive" role="alert">{actionError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)} disabled={regenerating}>Cancel</Button>
            <Button onClick={() => void confirmRegeneration()} disabled={regenerating}>
              {regenerating ? "Regenerating…" : "Regenerate link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(linkResult)} onOpenChange={(open) => { if (!open) { setLinkResult(null); setCopied(false); setActionError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkResult?.isNew ? "New activation link" : "Current activation link"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {linkResult?.isNew
                ? `Share this link securely with ${linkResult.user.fullName}. It is single-use and expires ${dateLabel(linkResult.expiresAt)}.`
                : `This existing link for ${linkResult?.user.fullName} expires ${dateLabel(linkResult?.expiresAt)}.`}
            </p>
          </DialogHeader>
          {linkResult?.url ? (
            <div className="flex gap-2">
              <Input value={linkResult.url} readOnly aria-label="New activation link" />
              <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} aria-label="Copy activation link">
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          ) : loadingLink ? (
            <p className="text-sm text-muted-foreground" role="status">Loading current activation link…</p>
          ) : linkResult && !linkResult.isNew && !actionError ? (
            <p className="text-sm text-muted-foreground" role="status">
              {linkResult.expiresAt
                ? "This link was created before secure link viewing was enabled, so its original URL cannot be recovered. Regenerate it to create a new link."
                : "There is no current activation link available to recover. Regenerate to create a new link."}
            </p>
          ) : null}
          {copied ? <p className="text-sm text-muted-foreground" role="status">Link copied.</p> : null}
          {actionError ? <p className="text-sm text-destructive" role="alert">{actionError}</p> : null}
          <DialogFooter>
            {!linkResult?.isNew && canActivateUsers ? (
              <Button
                variant="outline"
                onClick={() => {
                  const user = linkResult?.user;
                  setLinkResult(null);
                  setCopied(false);
                  if (user) setConfirmUser(user);
                }}
              >
                Regenerate link
              </Button>
            ) : null}
            <Button onClick={() => { setLinkResult(null); setCopied(false); setActionError(null); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
