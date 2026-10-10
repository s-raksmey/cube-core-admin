"use client";

import { useQuery } from "@apollo/client/react";
import { CURRENT_USER_QUERY } from "@/lib/apollo/operations";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { SuperAdminDashboard } from "@/components/dashboard/superadmin-dashboard";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/lib/types";

type MeData = { me: AuthUser | null };

export default function DashboardPage() {
  const { data, loading } = useQuery<MeData>(CURRENT_USER_QUERY);
  const user = data?.me;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in required"
        description="Redirecting to login…"
      />
    );
  }

  if (user.role === "SUPERADMIN") {
    return <SuperAdminDashboard user={user} />;
  }

  if (user.role === "ADMIN" || user.role === "EDITOR") {
    return <AdminDashboard user={user} />;
  }

  return (
    <EmptyState
      title="Unsupported role"
      description="This console does not support the current account role."
    />
  );
}
