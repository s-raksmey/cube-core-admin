"use client";

import { useConsoleUser } from "@/components/providers/console-user-provider";
import { SuperAdminDashboard } from "@/components/dashboard/superadmin-dashboard";

export function DashboardContent() {
  const user = useConsoleUser();

  return <SuperAdminDashboard user={user} />;
}
