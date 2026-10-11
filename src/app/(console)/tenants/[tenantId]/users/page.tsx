import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-72 w-full" />
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
