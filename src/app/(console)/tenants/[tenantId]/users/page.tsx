import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { TenantUsersManagementPanel } from "@/components/tenants/tenant-users-management-panel";

async function TenantUsersRoute({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return <TenantUsersManagementPanel tenantId={tenantId} />;
}

function TenantUsersFallback() {
  return (
    <div
      className="flex min-h-40 items-center justify-center gap-2"
      aria-busy="true"
    >
      <Loader2 className="size-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}

export default function TenantUsersPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  return (
    <Suspense fallback={<TenantUsersFallback />}>
      <TenantUsersRoute params={params} />
    </Suspense>
  );
}
