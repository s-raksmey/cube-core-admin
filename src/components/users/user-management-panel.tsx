"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Copy, Pencil, Plus, Search, Trash2, KeyRound, Link2 } from "lucide-react";
import {
  CREATE_MAIN_TENANT_USER,
  CURRENT_USER_QUERY,
  DELETE_MAIN_TENANT_USER,
  GENERATE_MAIN_TENANT_USER_ACTIVATION,
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
  MainTenantUsersQuery,
  UserStatus,
} from "@/lib/apollo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/empty-state";

type MainUserRow = MainTenantUserRow;

type LinkResult = {
  url: string;
  expiresAt: string;
  label: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function UserManagementPanel() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, loading, error, refetch } = useQuery<MainTenantUsersQuery>(
    MAIN_TENANT_USERS_QUERY,
    {
      variables: { search: search || null, page, pageSize },
      fetchPolicy: "cache-and-network",
    },
  );
  const { data: meData } = useQuery<CurrentUserQuery>(CURRENT_USER_QUERY);
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

  const [createOpen, setCreateOpen] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [editUser, setEditUser] = useState<MainUserRow | null>(null);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MainUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<MainUserRow | null>(null);
  const [activationTarget, setActivationTarget] = useState<MainUserRow | null>(
    null,
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const pageData = data?.mainTenantUsers;
  const users = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const emptyDescription = useMemo(
    () =>
      search
        ? "No users match your search."
        : "Create the first additional SuperAdmin user for the Main Console.",
    [search],
  );

  function openCreate() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setFormError(null);
    setCreateConfirmOpen(false);
    setCreateOpen(true);
  }

  function openEdit(user: MainUserRow) {
    setEditUser(user);
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEmail(user.email);
    setStatus(user.status ?? "ACTIVE");
    setFormError(null);
    setEditConfirmOpen(false);
  }

  function requestCreate() {
    setFormError(null);
    setCreateOpen(false);
    setCreateConfirmOpen(true);
  }

  function requestUpdate() {
    setFormError(null);
    setEditConfirmOpen(true);
  }

  async function confirmCreate() {
    setFormError(null);
    try {
      const result = await createUser({
        variables: { firstName, lastName, email },
      });
      const payload = result.data?.createMainTenantUser;
      setCreateConfirmOpen(false);
      if (payload) {
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
          input: { firstName, lastName, email, status },
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
    setActionError(null);
    setFormError(null);
    try {
      const result = await generateReset({ variables: { userId: user.id } });
      const payload = result.data?.generateMainTenantUserPasswordResetLink;
      if (!payload) {
        setFormError("Could not generate reset link");
        return;
      }
      setResetTarget(null);
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
    setActionError(null);
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
      setLinkResult({
        url: payload.activationUrl,
        expiresAt: payload.expiresAt,
        label: `Activation link for ${user.email}`,
      });
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

  async function copyLink() {
    if (!linkResult?.url) return;
    await navigator.clipboard.writeText(linkResult.url);
  }

  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Search by name, username, or email"
              className="pl-9"
            />
          </div>
          <Button type="button" variant="outline" onClick={applySearch}>
            Search
          </Button>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Create User
        </Button>
      </div>

      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}

      {loading && !pageData ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          Unable to load users. SuperAdmin access is required.
        </p>
      ) : null}

      {!loading && !error && users.length === 0 ? (
        <EmptyState title="No users found" description={emptyDescription} />
      ) : null}

      {users.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.username ?? "—"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">SUPERADMIN</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "ACTIVE"
                          ? "default"
                          : user.status === "PENDING"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.totpEnabled ? "On" : "Off"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(user)}
                        aria-label={`Edit ${user.firstName} ${user.lastName}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {user.status === "PENDING" || !user.totpEnabled ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={
                            busyUserId === user.id || regenerating
                          }
                          onClick={() => {
                            setFormError(null);
                            setActivationTarget(user);
                          }}
                          aria-label={`Regenerate activation link for ${user.firstName} ${user.lastName}`}
                        >
                          <Link2 className="size-4" />
                        </Button>
                      ) : null}
                      {currentUserId !== user.id ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={
                            busyUserId === user.id ||
                            resetting ||
                            user.status !== "ACTIVE"
                          }
                          onClick={() => {
                            setFormError(null);
                            setResetTarget(user);
                          }}
                          aria-label={`Reset password for ${user.firstName} ${user.lastName}`}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFormError(null);
                          setDeleteTarget(user);
                        }}
                        aria-label={`Delete ${user.firstName} ${user.lastName}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {total} user{total === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setFormError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Creates a Main Tenant SuperAdmin. Names may match other users; email
              must be unique. An activation link lets them choose a username, set
              a password, verify 2FA, and save recovery codes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-first-name">First name</Label>
                <Input
                  id="create-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-last-name">Last name</Label>
                <Input
                  id="create-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">SUPERADMIN</span>
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={requestCreate}
              disabled={
                !firstName.trim() || !lastName.trim() || !email.trim()
              }
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateConfirmOpen(false);
            setCreateOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create this user?</DialogTitle>
            <DialogDescription>
              Create SuperAdmin{" "}
              <span className="font-medium text-foreground">
                {firstName.trim()} {lastName.trim()}
              </span>{" "}
              ({email.trim()}) and generate a single-use activation link?
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateConfirmOpen(false);
                setCreateOpen(true);
              }}
              disabled={creating}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={confirmCreate}
              disabled={creating}
            >
              {creating ? "Creating…" : "Yes, create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editUser && !editConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditUser(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Role stays SUPERADMIN. Tenant stays the Main Tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-first-name">First name</Label>
                <Input
                  id="edit-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-last-name">Last name</Label>
                <Input
                  id="edit-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
              >
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={requestUpdate}
              disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editConfirmOpen && !!editUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditConfirmOpen(false);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save these changes?</DialogTitle>
            <DialogDescription>
              Update{" "}
              <span className="font-medium text-foreground">
                {editUser?.firstName} {editUser?.lastName}
              </span>{" "}
              to {firstName.trim()} {lastName.trim()} ({email.trim()}), status{" "}
              {status}?
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditConfirmOpen(false);
                setFormError(null);
              }}
              disabled={updating}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={confirmUpdate}
              disabled={updating}
            >
              {updating ? "Saving…" : "Yes, save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This disables{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </span>{" "}
              ({deleteTarget?.email}), revokes their sessions, and invalidates
              outstanding reset links. The last active SuperAdmin cannot be
              removed.
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!activationTarget}
        onOpenChange={(open) => {
          if (!open) {
            setActivationTarget(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate activation link?</DialogTitle>
            <DialogDescription>
              Generate a new single-use activation link for{" "}
              <span className="font-medium text-foreground">
                {activationTarget?.firstName} {activationTarget?.lastName}
              </span>{" "}
              ({activationTarget?.email})? Any previous unused activation link
              for this user will be invalidated.
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActivationTarget(null);
                setFormError(null);
              }}
              disabled={regenerating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmActivationLink}
              disabled={regenerating}
            >
              {regenerating ? "Generating…" : "Yes, generate link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password?</DialogTitle>
            <DialogDescription>
              Generate a single-use password reset link for{" "}
              <span className="font-medium text-foreground">
                {resetTarget?.firstName} {resetTarget?.lastName}
              </span>{" "}
              ({resetTarget?.email})? Their current password will stop working
              after they set a new one. 2FA stays enabled.
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetTarget(null);
                setFormError(null);
              }}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmResetPassword}
              disabled={resetting}
            >
              {resetting ? "Generating…" : "Yes, reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!linkResult}
        onOpenChange={(open) => {
          if (!open) setLinkResult(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkResult?.label ?? "Secure link"}</DialogTitle>
            <DialogDescription>
              Expires {formatDateTime(linkResult?.expiresAt)}. Copy and deliver
              through an approved channel. The link is single-use.
            </DialogDescription>
          </DialogHeader>
          <p className="break-all rounded-md bg-muted p-3 text-sm">
            {linkResult?.url}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkResult(null)}
            >
              Close
            </Button>
            <Button type="button" onClick={copyLink}>
              <Copy className="size-4" />
              Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
