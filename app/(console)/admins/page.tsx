import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function AdminsPage() {
  return (
    <div>
      <PageHeader
        title="Admins"
        description="Platform admin management module placeholder."
        crumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Admins" },
        ]}
      />
      <EmptyState
        title="Admin directory coming next"
        description="Use Add Admin on the SuperAdmin dashboard to create sub-tenant admins."
      />
    </div>
  );
}
