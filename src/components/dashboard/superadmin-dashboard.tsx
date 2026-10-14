"use client";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlatformDashboard } from "@/hooks/use-platform-dashboard";
import { Activity, Building2, Shield, Users } from "lucide-react";
import Image from "next/image";

export function SuperAdminDashboard() {
  const {
    dashboard,
    error,
    refetch,
    search,
    setSearch,
    filteredTenants,
    statusError,
    updatingStatus,
    initialLoading,
    toggleTenantStatus,
  } = usePlatformDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome, SuperAdmin"
        description="Manage the Cube Core platform and all sub-tenants while staying in the Main Tenant context."
        crumbs={[
          {
            label: "Console",
            href: "/dashboard",
          },
          {
            label: "Dashboard",
          },
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-medium text-primary">Main Tenant</p>

            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Cube Core
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Platform-wide controls for sub-tenants, users, audit logs,
              settings, and system health. Your session remains bound to the
              Main Tenant.
            </p>

          </div>

          <div className="relative mx-auto aspect-square w-full max-w-55">
            <Image
              src="/images/Futuristic-Glowing-Cube-Network.webp"
              alt="Cube Core network illustration"
              fill
              className="object-contain"
              sizes="220px"
              priority
            />
          </div>
        </div>
      </section>

      {error && !dashboard ? (
        <EmptyState
          title="Unable to load platform dashboard"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {statusError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
        >
          <p className="text-sm text-destructive">{statusError}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Sub-tenants"
          value={dashboard?.totalSubTenants ?? 0}
          icon={Building2}
          loading={initialLoading}
        />

        <KpiCard
          title="Active Sub-tenants"
          value={dashboard?.activeSubTenants ?? 0}
          icon={Activity}
          loading={initialLoading}
        />

        <KpiCard
          title="Total Admins"
          value={dashboard?.totalAdmins ?? 0}
          icon={Users}
          loading={initialLoading}
        />

        <KpiCard
          title="Platform Health"
          value={dashboard?.platformHealth ?? "—"}
          hint="Verified operational status"
          icon={Shield}
          loading={initialLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Sub-tenant growth"
          loading={initialLoading}
          emptyLabel="No sub-tenant growth data yet."
          points={(dashboard?.growthByMonth ?? []).map((item) => ({
            label: item.month.slice(5),
            value: item.count,
          }))}
        />

        <ChartPanel
          title="Sub-tenant status distribution"
          loading={initialLoading}
          emptyLabel="No status distribution yet."
          points={(dashboard?.statusDistribution ?? []).map((item) => ({
            label: item.status,
            value: item.count,
          }))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">Recent Sub-tenants</h3>

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or slug"
              className="max-w-xs"
            />
          </div>

          {initialLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No sub-tenants yet"
                description="Create the first sub-tenant to populate this table."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>

                  <TableHead>Slug</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead>Created</TableHead>

                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>

                    <TableCell>{tenant.slug}</TableCell>

                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>

                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingStatus}
                        onClick={() =>
                          void toggleTenantStatus(tenant.id, tenant.status)
                        }
                      >
                        {tenant.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <ActivityFeed
          title="Recent platform activity"
          loading={initialLoading}
          items={dashboard?.recentActivity ?? []}
        />
      </div>
    </div>
  );
}
