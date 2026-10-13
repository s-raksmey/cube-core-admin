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

      <div className="space-y-4 rounded-xl border border-border p-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-2/5 rounded-md" />
          </div>
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
