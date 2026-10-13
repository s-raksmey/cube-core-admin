import { PageHeader } from "@/components/dashboard/page-header";
import { UserManagementPanel } from "@/components/users/user-management-panel";

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage users authorized to access the Main Console and administer the Main Tenant."
        crumbs={[{ label: "Console", href: "/dashboard" }, { label: "Users" }]}
      />
      <UserManagementPanel />
    </div>
  );
}
