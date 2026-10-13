"use client";

import { SuperAdminDashboard } from "@/components/dashboard/superadmin-dashboard";
import { useConsoleUser } from "@/components/providers/console-user-provider";

export function DashboardContent() {
  const user = useConsoleUser();

  return <SuperAdminDashboard user={user} />;
}
