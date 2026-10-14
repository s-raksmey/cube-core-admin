"use client";

import { PLATFORM_AUDIT_LOGS_QUERY } from "@/lib/apollo/operations";
import type { PlatformAuditLogsQuery } from "@/lib/apollo/types";
import type { PlatformAuditLogPage } from "@/types/audit-log.types";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";

const PAGE_SIZE = 10;

/** Owns the platform audit query and keeps the previous page visible on navigation. */
export function usePlatformAuditLogs() {
  const [requestedPage, setPage] = useState(1);
  const query = useQuery<PlatformAuditLogsQuery>(PLATFORM_AUDIT_LOGS_QUERY, {
    variables: { page: requestedPage },
  });
  const pageData: PlatformAuditLogPage | undefined =
    query.data?.platformAuditLogs ?? query.previousData?.platformAuditLogs;
  const total = pageData?.total ?? 0;
  const page = pageData?.page ?? requestedPage;
  const pageSize = pageData?.pageSize ?? PAGE_SIZE;

  return {
    ...query,
    page,
    pageSize,
    total,
    logs: pageData?.items ?? [],
    initialLoading: query.loading && !pageData,
    blockingError: Boolean(query.error && !pageData),
    canPrev: page > 1,
    canNext: page * pageSize < total,
    setPage,
    refresh: () => query.refetch({ page: requestedPage }),
  };
}

export type PlatformAuditLogs = ReturnType<typeof usePlatformAuditLogs>;
