"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Activity,
  Building2,
  Shield,
  Users,
} from "lucide-react";
import {
  PLATFORM_DASHBOARD_QUERY,
  SET_SUB_TENANT_STATUS,
} from "@/lib/apollo/operations";
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
import type { AuthUser } from "@/lib/types";

export function SuperAdminDashboard({ user }: { user: AuthUser }) {
  const { data, loading, error, refetch } = useQuery(PLATFORM_DASHBOARD_QUERY);
  const [setStatus, { loading: updatingStatus }] =
    useMutation(SET_SUB_TENANT_STATUS);

  const [search, setSearch] = useState("");

  const dashboard = data?.platformDashboard;
  const filteredTenants = useMemo(() => {
    const items = dashboard?.recentSubTenants ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [dashboard?.recentSubTenants, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, SuperAdmin`}
        description="Manage the Cube Core platform and all sub-tenants remotely while staying in the Main Tenant context."
        crumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-medium text-primary">Main Tenant</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {user.tenant.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Platform-wide controls for sub-tenants, admins, audit, and health.
              Your session remains bound to the main tenant.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <a href="/settings">Platform Settings</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/audit">View Audit Logs</a>
              </Button>
            </div>
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

      {error ? (
        <EmptyState
          title="Unable to load platform dashboard"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Sub-tenants"
          value={dashboard?.totalSubTenants ?? 0}
          icon={Building2}
          loading={loading}
        />
        <KpiCard
          title="Active Sub-tenants"
          value={dashboard?.activeSubTenants ?? 0}
          icon={Activity}
          loading={loading}
        />
        <KpiCard
          title="Total Admins"
          value={dashboard?.totalAdmins ?? 0}
          icon={Users}
          loading={loading}
        />
        <KpiCard
          title="Platform Health"
          value={dashboard?.platformHealth ?? "—"}
          hint="Verified operational status"
          icon={Shield}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Sub-tenant growth"
          loading={loading}
          emptyLabel="No sub-tenant growth data yet. Create a sub-tenant to begin."
          points={(dashboard?.growthByMonth ?? []).map((item) => ({
            label: item.month.slice(5),
            value: item.count,
          }))}
        />
        <ChartPanel
          title="Sub-tenant status distribution"
          loading={loading}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or slug"
              className="max-w-xs"
            />
          </div>
          {loading ? (
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
                          setStatus({
                            variables: {
                              tenantId: tenant.id,
                              status:
                                tenant.status === "ACTIVE"
                                  ? "SUSPENDED"
                                  : "ACTIVE",
                            },
                          }).then(() => refetch())
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
          loading={loading}
          items={dashboard?.recentActivity ?? []}
        />
      </div>
    </div>
  );
}
