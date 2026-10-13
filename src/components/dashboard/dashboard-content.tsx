"use client";

import { useConsoleUser } from "@/components/dashboard/console-user-context";
import { SuperAdminDashboard } from "@/components/dashboard/superadmin-dashboard";

export function DashboardContent() {
  const user = useConsoleUser();

  return <SuperAdminDashboard user={user} />;
}
