import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function TenantsPage() {
  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Full tenant directory will expand here. Use Dashboard quick actions for create/suspend in this MVP."
        crumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Tenants" },
        ]}
      />
      <EmptyState
        title="Tenant directory coming next"
        description="Create and manage sub-tenants from the SuperAdmin dashboard for now."
      />
    </div>
  );
}
