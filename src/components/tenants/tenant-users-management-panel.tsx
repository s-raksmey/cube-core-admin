"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeft, Check, Copy, RotateCw } from "lucide-react";
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
  REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  SUB_TENANT_USER_ACTIVATION_LINK_QUERY,
} from "@/lib/apollo/operations";
import type {
  ManagedSubTenantUsersQuery,
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

  const { data, loading, error, refetch } = useQuery(MANAGED_SUB_TENANT_USERS_QUERY, {
    variables: { tenantId, search: search || null, page, pageSize: PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
  });
  const [regenerate, { loading: regenerating }] = useMutation(
    REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  );
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
        actions={<Button asChild variant="outline"><Link href="/tenants"><ArrowLeft /> Back to tenants</Link></Button>}
      />

      <form className="flex w-full gap-2 sm:max-w-xl" onSubmit={applySearch}>
        <Input
          aria-label="Search tenant users"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {error && !data ? <p className="text-sm text-destructive" role="alert">{error.message}</p> : null}
      {loading && users.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-border p-4" aria-label="Loading tenant users">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-11 w-full" />)}
        </div>
      ) : users.length === 0 ? (
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const eligible = user.accountStatus === "PENDING" &&
                    (user.activationStatus === "PENDING" || user.activationStatus === "EXPIRED");
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell><StatusBadge status={user.accountStatus} /></TableCell>
                      <TableCell><StatusBadge status={user.activationStatus} /></TableCell>
                      <TableCell>{dateLabel(user.activationLinkCreatedAt)}</TableCell>
                      <TableCell>{dateLabel(user.activationLinkExpiresAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!eligible || regenerating || loadingLink}
                          onClick={() => {
                            setActionError(null);
                            if (user.activationStatus === "PENDING") void viewCurrentLink(user);
                            else setConfirmUser(user);
                          }}
                          title={eligible ? "Regenerate activation link" : "Only pending accounts can receive an activation link"}
                        >
                          <RotateCw /> Regenerate link
                        </Button>
                      </TableCell>
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
            {!linkResult?.isNew ? (
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
