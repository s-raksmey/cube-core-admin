"use client";

import { PlatformAnalyticsSection } from "@/components/analytics/platform-analytics";
import { PageHeader } from "@/components/dashboard/page-header";
import Image from "next/image";

export function SuperAdminDashboard() {
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

      <PlatformAnalyticsSection embedded />
    </div>
  );
}
