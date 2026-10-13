import { Suspense } from "react";

import { TenantUsersManagementPanel } from "@/components/tenants/tenant-users-management-panel";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="space-y-2 rounded-xl border border-border p-4">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
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
