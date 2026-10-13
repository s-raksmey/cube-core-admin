"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchToolbar } from "@/components/dashboard/search-toolbar";
import { TenantDetailsDialog } from "@/components/tenants/tenant-details-dialog";
import { TenantDomainSetupDialog } from "@/components/tenants/tenant-domain-setup-dialog";
import {
  TenantFormDialog,
  type TenantFormValues,
} from "@/components/tenants/tenant-form-dialog";
import { TenantListTable } from "@/components/tenants/tenant-list-table";
import { TenantStatusConfirmDialog } from "@/components/tenants/tenant-status-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import type { TenantDomainPurpose } from "@/lib/apollo/generated/graphql";
import {
  CREATE_SUB_TENANT,
  SET_SUB_TENANT_STATUS,
  SUB_TENANTS_QUERY,
  UPDATE_SUB_TENANT,
} from "@/lib/apollo/operations";
import type { SubTenantRow } from "@/lib/apollo/types";
import { useMutation, useQuery } from "@apollo/client/react";
import { Plus } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function TenantManagementPanel() {
  const {
    searchInput,
    setSearchInput,
    search,
    setSearch,
    page,
    setPage,
    applySearch,
  } = usePaginatedSearch();
  const [formTarget, setFormTarget] = useState<
    | { mode: "create"; tenant: null }
    | { mode: "edit"; tenant: SubTenantRow }
    | null
  >(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTenant, setDetailTenant] = useState<SubTenantRow | null>(null);
  const [domainTarget, setDomainTarget] = useState<{
    tenant: SubTenantRow;
    purpose: TenantDomainPurpose;
  } | null>(null);
  const [statusTarget, setStatusTarget] = useState<SubTenantRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(SUB_TENANTS_QUERY, {
    variables: { search: search || null, page, pageSize: PAGE_SIZE },
  });
  const [createTenant, { loading: creating }] = useMutation(CREATE_SUB_TENANT);
  const [updateTenant, { loading: updating }] = useMutation(UPDATE_SUB_TENANT);
  const [setTenantStatus, { loading: updatingStatus }] = useMutation(
    SET_SUB_TENANT_STATUS,
  );
  const result = data?.subTenants;
  const tenants = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const editing = formTarget?.mode === "edit" ? formTarget.tenant : null;
  const initialLoading = loading && !result;

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
      await setTenantStatus({
        variables: { tenantId: statusTarget.id, status },
      });
      setNotice(status === "ACTIVE" ? "Tenant enabled." : "Tenant disabled.");
      setStatusTarget(null);
      await refetch();
    } catch (mutationError) {
      setStatusError(
        getErrorMessage(mutationError, "Unable to update tenant status."),
      );
    }
  }

  async function copyTenantId(tenant: SubTenantRow) {
    try {
      await navigator.clipboard.writeText(tenant.id);
      setCopiedTenantId(tenant.id);
      setNotice("Tenant UUID copied.");
    } catch {
      setNotice(
        "Could not copy the tenant UUID. Select it from tenant details.",
      );
    }
  }

  const pageError =
    error && !result ? getErrorMessage(error, "Unable to load tenants.") : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Management"
        description="Create and manage sub-tenants, their domains, and tenant users."
        crumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Tenants" },
        ]}
        actions={
          <Button
            onClick={() => {
              setFormError(null);
              setFormTarget({ mode: "create", tenant: null });
            }}
          >
            <Plus /> Create Tenant
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchToolbar
          label="Search tenants"
          placeholder="Search by tenant name or slug"
          value={searchInput}
          onValueChange={setSearchInput}
          onSearch={applySearch}
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {notice ?? `${total} sub-tenant${total === 1 ? "" : "s"}`}
        </p>
      </div>

      {pageError ? (
        <p className="text-sm text-destructive" role="alert">
          {pageError}
        </p>
      ) : null}
      {error && result ? (
        <p className="text-sm text-destructive" role="status">
          Could not refresh tenants. Showing the most recent data.
        </p>
      ) : null}
      {initialLoading ? (
        <div
          className="space-y-2 rounded-xl border border-border p-4"
          aria-label="Loading tenants"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState
          title={search ? "No tenants found" : "No sub-tenants yet"}
          description={
            search
              ? "Try another name or slug."
              : "Create a sub-tenant to start managing its users and domains."
          }
          action={
            !search ? (
              <Button
                onClick={() => setFormTarget({ mode: "create", tenant: null })}
              >
                <Plus /> Create Tenant
              </Button>
            ) : undefined
          }
        />
      ) : (
        <TenantListTable
          tenants={tenants}
          page={page}
          totalPages={totalPages}
          total={total}
          loading={loading}
          copiedTenantId={copiedTenantId}
          onCopyId={(tenant) => void copyTenantId(tenant)}
          onView={(tenant) => {
            setDetailTenant(tenant);
            setDetailOpen(true);
          }}
          onEdit={(tenant) => {
            setFormError(null);
            setFormTarget({ mode: "edit", tenant });
          }}
          onStatus={(tenant) => {
            setStatusError(null);
            setStatusTarget(tenant);
          }}
          onPageChange={setPage}
        />
      )}

      {formTarget ? (
        <TenantFormDialog
          key={`${formTarget.mode}:${formTarget.tenant?.id ?? "new"}`}
          tenant={formTarget.tenant}
          open
          loading={creating || updating}
          error={formError}
          onOpenChange={(open) => {
            if (!open) setFormTarget(null);
          }}
          onSubmit={(values) => void submitTenant(values)}
        />
      ) : null}

      <TenantDetailsDialog
        open={detailOpen}
        tenant={
          tenants.find((tenant) => tenant.id === detailTenant?.id) ??
          detailTenant
        }
        loading={false}
        error={null}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailTenant(null);
        }}
        onManageDomain={(purpose) => {
          const tenant =
            tenants.find((item) => item.id === detailTenant?.id) ??
            detailTenant;
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
          hostname={
            domainTarget.purpose === "MANAGEMENT"
              ? domainTarget.tenant.managementDomain
              : domainTarget.tenant.websiteDomain
          }
          status={
            (domainTarget.purpose === "MANAGEMENT"
              ? domainTarget.tenant.managementDomainStatus
              : domainTarget.tenant.websiteDomainStatus) ?? "DISABLED"
          }
          open
          onOpenChange={(open) => {
            if (!open) setDomainTarget(null);
          }}
          onChanged={() => {
            void refetch();
          }}
        />
      ) : null}

      <TenantStatusConfirmDialog
        tenant={statusTarget}
        loading={updatingStatus}
        error={statusError}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        onConfirm={() => void confirmStatusChange()}
      />
    </div>
  );
}
