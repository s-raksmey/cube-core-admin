"use client";

import {
  PLATFORM_DASHBOARD_QUERY,
  SET_SUB_TENANT_STATUS,
} from "@/lib/apollo/operations";
import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";

export function usePlatformDashboard() {
  const query = useQuery(PLATFORM_DASHBOARD_QUERY);
  const [setStatus, { loading: updatingStatus }] = useMutation(
    SET_SUB_TENANT_STATUS,
  );
  const [search, setSearch] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const dashboard = query.data?.platformDashboard;
  const filteredTenants = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return dashboard?.recentSubTenants ?? [];
    return (dashboard?.recentSubTenants ?? []).filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(value) ||
        tenant.slug.toLowerCase().includes(value),
    );
  }, [dashboard?.recentSubTenants, search]);

  async function toggleTenantStatus(tenantId: string, currentStatus: string) {
    setStatusError(null);
    try {
      await setStatus({
        variables: {
          tenantId,
          status: currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
        },
      });
      await query.refetch();
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "Unable to update tenant status.",
      );
    }
  }

  return {
    ...query,
    dashboard,
    search,
    setSearch,
    filteredTenants,
    statusError,
    updatingStatus,
    initialLoading: query.loading && !dashboard,
    toggleTenantStatus,
  };
}
