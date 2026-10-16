"use client";

import { ChartPanel } from "@/components/dashboard/chart-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePlatformAnalytics } from "@/hooks/use-platform-analytics";
import type { AnalyticsPeriod } from "@/lib/apollo/generated/graphql";
import {
  Activity,
  Building2,
  ChevronDown,
  CirclePause,
  Users,
} from "lucide-react";
import Link from "next/link";

const periods: { value: AnalyticsPeriod; label: string }[] = [
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
  { value: "LAST_90_DAYS", label: "Last 90 days" },
  { value: "LAST_180_DAYS", label: "Last 180 days" },
  { value: "LAST_365_DAYS", label: "Last 365 days" },
  { value: "CUSTOM", label: "Custom range" },
];

export function PlatformAnalyticsSection({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const {
    analytics,
    loading,
    error,
    refetch,
    period,
    setPeriod,
    from,
    setFrom,
    to,
    setTo,
    valid,
  } = usePlatformAnalytics();
  const pending = loading && !analytics;
  return (
    <div className="space-y-6">
      {embedded ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Platform analytics</h2>
            <p className="text-sm text-muted-foreground">
              Tenant growth and recorded platform activity.
            </p>
          </div>
          <Link
            href="/analytics"
            className="text-sm font-medium text-primary hover:underline"
          >
            View full analytics
          </Link>
        </div>
      ) : (
        <PageHeader
          title="Platform Analytics"
          description="Tenant growth and recorded platform activity across Cube Core."
        />
      )}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Period
          <div className="relative">
            <select
              className="h-9 appearance-none rounded-md border border-input bg-background px-3 pr-6 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
            >
              {periods.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-3.5" />
          </div>
        </label>
        {period === "CUSTOM" ? (
          <>
            <label className="space-y-1 text-sm">
              From (UTC)
              <Input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              To (UTC)
              <Input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>
      {!valid ? (
        <p role="alert" className="text-sm text-destructive">
          Choose a valid UTC date range.
        </p>
      ) : null}
      {error && !analytics ? (
        <EmptyState
          title="Unable to load analytics"
          description="Try again after checking the connection."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}
      {valid && (!error || analytics || pending) ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total tenants"
              value={analytics?.totalTenants ?? 0}
              icon={Building2}
              loading={pending}
            />
            <KpiCard
              title="Active tenants"
              value={analytics?.activeTenants ?? 0}
              icon={Activity}
              loading={pending}
            />
            <KpiCard
              title="Suspended tenants"
              value={analytics?.suspendedTenants ?? 0}
              icon={CirclePause}
              loading={pending}
            />
            <KpiCard
              title="Sub-tenant users"
              value={analytics?.tenantUsers ?? 0}
              icon={Users}
              loading={pending}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartPanel
              title="Tenants created over time (UTC)"
              points={
                analytics?.growth.map((point) => ({
                  label: point.date,
                  value: point.value,
                })) ?? []
              }
              loading={pending}
              emptyLabel="No tenants created in this period."
            />
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle>Tenant activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Recorded platform audit actions in the selected period.
                </p>
                {pending ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : analytics?.tenantActivity.length ? (
                  <ul className="divide-y">
                    {analytics.tenantActivity.map((item) => (
                      <li
                        key={item.name}
                        className="flex justify-between gap-4 py-2 text-sm"
                      >
                        <span>{item.name}</span>
                        <strong>{item.count.toLocaleString()}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recorded tenant activity in this period.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function PlatformAnalyticsPage() {
  return <PlatformAnalyticsSection />;
}
