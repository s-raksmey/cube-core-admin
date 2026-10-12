import { PageHeader } from "@/components/dashboard/page-header";
import { MainTenantBrandingPanel } from "@/components/branding/main-tenant-branding-panel";

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform Settings"
        description="Manage Cube Core’s visual identity and social sharing assets."
        crumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Platform Settings" },
        ]}
      />
      <MainTenantBrandingPanel />
    </div>
  );
}
