import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Sub-tenant user management module placeholder."
        crumbs={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Users" },
        ]}
      />
      <EmptyState
        title="Users module coming next"
        description="Recent users already appear on the Admin dashboard."
      />
    </div>
  );
}
