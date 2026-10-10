"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Activity,
  Building2,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import {
  CREATE_ADMIN_USER,
  CREATE_SUB_TENANT,
  PLATFORM_DASHBOARD_QUERY,
  SET_SUB_TENANT_STATUS,
} from "@/lib/graphql/operations";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { AuthUser } from "@/lib/types";

type PlatformDashboardData = {
  platformDashboard: {
    totalSubTenants: number;
    activeSubTenants: number;
    totalAdmins: number;
    platformHealth: string;
    growthByMonth: Array<{ month: string; count: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    recentSubTenants: Array<{
      id: string;
      name: string;
      slug: string;
      status: "ACTIVE" | "SUSPENDED";
      createdAt: string;
    }>;
    recentActivity: Array<{
      id: string;
      action: string;
      createdAt: string;
      actorEmail?: string | null;
      targetTenantName?: string | null;
    }>;
  };
};

export function SuperAdminDashboard({ user }: { user: AuthUser }) {
  const { data, loading, error, refetch } = useQuery<PlatformDashboardData>(
    PLATFORM_DASHBOARD_QUERY,
  );
  const [createSubTenant, { loading: creatingTenant }] =
    useMutation(CREATE_SUB_TENANT);
  const [createAdminUser, { loading: creatingAdmin }] =
    useMutation(CREATE_ADMIN_USER);
  const [setStatus, { loading: updatingStatus }] =
    useMutation(SET_SUB_TENANT_STATUS);

  const [tenantOpen, setTenantOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminTenantId, setAdminTenantId] = useState("");
  const [adminActivationUrl, setAdminActivationUrl] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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

  async function handleCreateTenant() {
    setFormError(null);
    try {
      await createSubTenant({
        variables: { name: tenantName, slug: tenantSlug },
      });
      setTenantOpen(false);
      setTenantName("");
      setTenantSlug("");
      await refetch();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create tenant");
    }
  }

  async function handleCreateAdmin() {
    setFormError(null);
    try {
      const result = await createAdminUser({
        variables: {
          email: adminEmail,
          firstName: adminFirstName,
          lastName: adminLastName,
          tenantId: adminTenantId,
          role: "ADMIN",
        },
      });
      const payload = (
        result.data as {
          createAdminUser?: { activationUrl?: string };
        } | null
      )?.createAdminUser;
      setAdminActivationUrl(payload?.activationUrl ?? null);
      setAdminEmail("");
      setAdminFirstName("");
      setAdminLastName("");
      setAdminTenantId("");
      await refetch();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create admin");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, SuperAdmin`}
        description="Manage the Cube Core platform and all sub-tenants remotely while staying in the Main Tenant context."
        crumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Dashboard" },
        ]}
        actions={
          <>
            <Dialog open={tenantOpen} onOpenChange={setTenantOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Create Sub-tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Sub-tenant</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tenant-name">Name</Label>
                    <Input
                      id="tenant-name"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tenant-slug">Slug</Label>
                    <Input
                      id="tenant-slug"
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      placeholder="acme-corp"
                    />
                  </div>
                  {formError ? (
                    <p className="text-sm text-destructive">{formError}</p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateTenant}
                    disabled={creatingTenant}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Shield className="size-4" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Admin</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-tenant">Sub-tenant ID</Label>
                    <Input
                      id="admin-tenant"
                      value={adminTenantId}
                      onChange={(e) => setAdminTenantId(e.target.value)}
                      placeholder="Paste sub-tenant id"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-first-name">First name</Label>
                      <Input
                        id="admin-first-name"
                        value={adminFirstName}
                        onChange={(e) => setAdminFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-last-name">Last name</Label>
                      <Input
                        id="admin-last-name"
                        value={adminLastName}
                        onChange={(e) => setAdminLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  {adminActivationUrl ? (
                    <div className="space-y-1.5">
                      <Label>Activation link</Label>
                      <p className="break-all rounded-md bg-muted p-2 text-xs">
                        {adminActivationUrl}
                      </p>
                    </div>
                  ) : null}
                  {formError ? (
                    <p className="text-sm text-destructive">{formError}</p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateAdmin} disabled={creatingAdmin}>
                    Create Admin
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
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
