"use client";

import { useQuery } from "@apollo/client/react";
import { FileText, HardDrive, Users, ShieldCheck } from "lucide-react";
import { TENANT_DASHBOARD_QUERY } from "@/lib/apollo/operations";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuthUser } from "@/lib/types";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export function AdminDashboard({ user }: { user: AuthUser }) {
  const { data, loading, error, refetch } = useQuery(TENANT_DASHBOARD_QUERY);
  const dashboard = data?.tenantDashboard;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome to ${user.tenant.name}`}
        description="Manage users, content, and settings for your sub-tenant workspace only."
        crumbs={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Dashboard" },
        ]}
        actions={
          <>
            <Button asChild>
              <a href="/users">Manage Users</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/settings">Tenant Settings</a>
            </Button>
          </>
        }
      />

      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-primary">Sub-tenant workspace</p>
        <h2 className="mt-1 text-xl font-semibold">{user.tenant.name}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          You are signed in as {user.role}. Platform-wide tenant management is
          not available in this view.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <a href="/content">Create Content</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/media">Upload Media</a>
          </Button>
        </div>
      </section>

      {error ? (
        <EmptyState
          title="Unable to load tenant dashboard"
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
          title="Total Users"
          value={dashboard?.totalUsers ?? 0}
          hint={`${dashboard?.activeUsers ?? 0} active`}
          icon={Users}
          loading={loading}
        />
        <KpiCard
          title="Published Content"
          value={dashboard?.publishedContent ?? 0}
          hint="Content module not implemented yet"
          icon={FileText}
          loading={loading}
        />
        <KpiCard
          title="Media Storage"
          value={formatBytes(dashboard?.mediaStorageBytes ?? 0)}
          hint="Media module not implemented yet"
          icon={HardDrive}
          loading={loading}
        />
        <KpiCard
          title="Tenant Status"
          value={dashboard?.tenant.status ?? user.tenant.status}
          icon={ShieldCheck}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Content activity over time"
          loading={loading}
          emptyLabel="No content activity yet. Content module is not implemented."
          points={(dashboard?.contentActivityByMonth ?? []).map((item) => ({
            label: item.month.slice(5),
            value: item.count,
          }))}
        />
        <ChartPanel
          title="Content by status"
          loading={loading}
          emptyLabel="No content distribution yet."
          points={(dashboard?.contentByStatus ?? []).map((item) => ({
            label: item.status,
            value: item.count,
          }))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Recent users</h3>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : (dashboard?.recentUsers.length ?? 0) === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No users in this tenant"
                description="Invite teammates from the Users module when available."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard?.recentUsers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.email}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <StatusBadge status={member.status ?? "UNKNOWN"} />
                    </TableCell>
                    <TableCell>
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <ActivityFeed
          title="Recent tenant activity"
          loading={loading}
          items={dashboard?.recentActivity ?? []}
        />
      </div>
    </div>
  );
}
