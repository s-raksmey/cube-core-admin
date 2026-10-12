"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Check,
  Copy,
  Eye,
  Pencil,
  Plus,
  Power,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
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
  CREATE_SUB_TENANT,
  SET_SUB_TENANT_STATUS,
  SUB_TENANTS_QUERY,
  UPDATE_SUB_TENANT,
} from "@/lib/apollo/operations";
import type { SubTenantRow } from "@/lib/apollo/types";
import {
  TenantFormDialog,
  type TenantFormValues,
} from "@/components/tenants/tenant-form-dialog";
import { TenantDetailsDialog } from "@/components/tenants/tenant-details-dialog";
import { TenantDomainSetupDialog } from "@/components/tenants/tenant-domain-setup-dialog";
import type { TenantDomainPurpose } from "@/lib/apollo/generated/graphql";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function TenantManagementPanel() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<
    { mode: "create"; tenant: null } | { mode: "edit"; tenant: SubTenantRow } | null
  >(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTenant, setDetailTenant] = useState<SubTenantRow | null>(null);
  const [domainTarget, setDomainTarget] = useState<{ tenant: SubTenantRow; purpose: TenantDomainPurpose } | null>(null);
  const [statusTarget, setStatusTarget] = useState<SubTenantRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(SUB_TENANTS_QUERY, {
    variables: { search: search || null, page, pageSize: PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
  });
  const [createTenant, { loading: creating }] = useMutation(CREATE_SUB_TENANT);
  const [updateTenant, { loading: updating }] = useMutation(UPDATE_SUB_TENANT);
  const [setTenantStatus, { loading: updatingStatus }] = useMutation(SET_SUB_TENANT_STATUS);
  const result = data?.subTenants;
  const tenants = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const editing = formTarget?.mode === "edit" ? formTarget.tenant : null;

  async function submitTenant(values: TenantFormValues) {
    setFormError(null);
    try {
      const domains = {
        managementDomain: values.managementDomain.trim() || null,
        websiteDomain: values.websiteDomain.trim() || null,
      };
      if (editing) {
        await updateTenant({
          variables: {
            tenantId: editing.id,
            input: {
              name: values.name,
              slug: values.slug,
              ...domains,
              localDevelopmentHostname:
                values.localDevelopmentHostname.trim() || null,
            },
          },
        });
        setNotice("Tenant updated.");
      } else {
        await createTenant({
          variables: { name: values.name, slug: values.slug, ...domains },
        });
        setPage(1);
        setSearch("");
        setSearchInput("");
        setNotice("Tenant created.");
      }
      setFormTarget(null);
      await refetch({
        search: editing ? search || null : null,
        page: editing ? page : 1,
        pageSize: PAGE_SIZE,
      });
    } catch (mutationError) {
      setFormError(getErrorMessage(mutationError, "Unable to save tenant."));
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    setStatusError(null);
    try {
      const status = statusTarget.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await setTenantStatus({ variables: { tenantId: statusTarget.id, status } });
      setNotice(status === "ACTIVE" ? "Tenant enabled." : "Tenant disabled.");
      setStatusTarget(null);
      await refetch();
    } catch (mutationError) {
      setStatusError(getErrorMessage(mutationError, "Unable to update tenant status."));
    }
  }

  async function copyTenantId(tenant: SubTenantRow) {
    try {
      await navigator.clipboard.writeText(tenant.id);
      setCopiedTenantId(tenant.id);
      setNotice("Tenant UUID copied.");
    } catch {
      setNotice("Could not copy the tenant UUID. Select it from tenant details.");
    }
  }

  function applySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const pageError = error && !data ? getErrorMessage(error, "Unable to load tenants.") : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Management"
        description="Create and manage sub-tenants, their domains, and tenant users."
        crumbs={[{ label: "Console", href: "/dashboard" }, { label: "Tenants" }]}
        actions={
          <Button onClick={() => { setFormError(null); setFormTarget({ mode: "create", tenant: null }); }}>
            <Plus /> Create Tenant
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full gap-2 sm:max-w-xl" onSubmit={applySearch}>
          <Input
            aria-label="Search tenants"
            placeholder="Search by tenant name or slug"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {notice ?? `${total} sub-tenant${total === 1 ? "" : "s"}`}
        </p>
      </div>

      {pageError ? <p className="text-sm text-destructive" role="alert">{pageError}</p> : null}
      {loading && tenants.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-border p-4" aria-label="Loading tenants">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-11 w-full" />)}
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState
          title={search ? "No tenants found" : "No sub-tenants yet"}
          description={search ? "Try another name or slug." : "Create a sub-tenant to start managing its users and domains."}
          action={!search ? <Button onClick={() => setFormTarget({ mode: "create", tenant: null })}><Plus /> Create Tenant</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Management domain</TableHead>
                  <TableHead>Public website</TableHead>
                  <TableHead>Local development</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-44 items-center gap-1 font-mono text-xs text-muted-foreground">
                        <span className="truncate" title={tenant.id}>{tenant.id}</span>
                        <Button variant="ghost" size="icon-xs" onClick={() => void copyTenantId(tenant)} aria-label={`Copy UUID for ${tenant.name}`}>
                          {copiedTenantId === tenant.id ? <Check /> : <Copy />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{tenant.managementDomain ?? <span className="text-muted-foreground">—</span>}</div>
                      <StatusBadge status={tenant.managementDomainStatus ?? "DISABLED"} />
                    </TableCell>
                    <TableCell>
                      <div>{tenant.websiteDomain ?? <span className="text-muted-foreground">—</span>}</div>
                      <StatusBadge status={tenant.websiteDomainStatus ?? "DISABLED"} />
                    </TableCell>
                    <TableCell>{tenant.localDevelopmentHostname ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{tenant.userCount}</TableCell>
                    <TableCell><StatusBadge status={tenant.status} /></TableCell>
                    <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`View ${tenant.name}`} title="View" onClick={() => { setDetailTenant(tenant); setDetailOpen(true); }}>
                          <Eye />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${tenant.name}`} title="Edit" onClick={() => { setFormError(null); setFormTarget({ mode: "edit", tenant }); }}>
                          <Pencil />
                        </Button>
                        <Button asChild variant="ghost" size="icon-sm" aria-label={`Manage users in ${tenant.name}`} title="Manage Users">
                          <Link href={`/tenants/${tenant.id}/users`}><UsersRound /></Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`${tenant.status === "ACTIVE" ? "Disable" : "Enable"} ${tenant.name}`} title={tenant.status === "ACTIVE" ? "Disable" : "Enable"} onClick={() => { setStatusError(null); setStatusTarget(tenant); }}>
                          <Power />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Page {page} of {totalPages} · {total} tenants</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}

      {formTarget ? (
        <TenantFormDialog
          key={`${formTarget.mode}:${formTarget.tenant?.id ?? "new"}`}
          tenant={formTarget.tenant}
          open
          loading={creating || updating}
          error={formError}
          onOpenChange={(open) => { if (!open) setFormTarget(null); }}
          onSubmit={(values) => void submitTenant(values)}
        />
      ) : null}

      <TenantDetailsDialog
        open={detailOpen}
        tenant={tenants.find((tenant) => tenant.id === detailTenant?.id) ?? detailTenant}
        loading={false}
        error={null}
        onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetailTenant(null); }}
        onManageDomain={(purpose) => {
          const tenant = tenants.find((item) => item.id === detailTenant?.id) ?? detailTenant;
          if (tenant) {
            setDomainTarget({ tenant, purpose });
            setDetailOpen(false);
          }
        }}
      />
      {domainTarget ? (
        <TenantDomainSetupDialog
          tenantId={domainTarget.tenant.id}
          tenantName={domainTarget.tenant.name}
          purpose={domainTarget.purpose}
          hostname={domainTarget.purpose === "MANAGEMENT" ? domainTarget.tenant.managementDomain : domainTarget.tenant.websiteDomain}
          status={(domainTarget.purpose === "MANAGEMENT" ? domainTarget.tenant.managementDomainStatus : domainTarget.tenant.websiteDomainStatus) ?? "DISABLED"}
          open
          onOpenChange={(open) => { if (!open) setDomainTarget(null); }}
          onChanged={() => { void refetch(); }}
        />
      ) : null}

      <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => { if (!open) setStatusTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statusTarget?.status === "ACTIVE" ? "Disable tenant?" : "Enable tenant?"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {statusTarget?.status === "ACTIVE"
                ? `Users in ${statusTarget.name} will no longer be able to sign in.`
                : `Users in ${statusTarget?.name} will be able to sign in again.`}
            </p>
          </DialogHeader>
          {statusError ? <p className="text-sm text-destructive" role="alert">{statusError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(null)} disabled={updatingStatus}>Cancel</Button>
            <Button variant={statusTarget?.status === "ACTIVE" ? "destructive" : "default"} onClick={() => void confirmStatusChange()} disabled={updatingStatus}>
              {updatingStatus ? "Saving…" : statusTarget?.status === "ACTIVE" ? "Disable tenant" : "Enable tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
