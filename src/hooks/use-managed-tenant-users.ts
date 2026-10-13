"use client";

import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { MANAGED_SUB_TENANT_USERS_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo } from "react";

const PAGE_SIZE = 10;

export function useManagedTenantUsers({
  tenantId,
  canViewUsers,
}: {
  tenantId: string;
  canViewUsers: boolean;
}) {
  const { searchInput, setSearchInput, search, page, setPage, applySearch } =
    usePaginatedSearch();
  const query = useQuery(MANAGED_SUB_TENANT_USERS_QUERY, {
    variables: { tenantId, search: search || null, page, pageSize: PAGE_SIZE },
    skip: !canViewUsers,
  });
  const result = query.data?.subTenantUsers;
  const { refetch } = query;
  const users = useMemo(() => result?.items ?? [], [result?.items]);
  const total = result?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const nextExpiry = users
      .map((user) =>
        user.activationLinkExpiresAt
          ? Date.parse(user.activationLinkExpiresAt)
          : Number.NaN,
      )
      .filter(
        (expiresAt) => Number.isFinite(expiresAt) && expiresAt > Date.now(),
      )
      .sort((left, right) => left - right)[0];

    if (!nextExpiry) return;

    const timeout = window.setTimeout(
      () => void refetch(),
      Math.max(0, nextExpiry - Date.now() + 25),
    );

    return () => window.clearTimeout(timeout);
  }, [refetch, users]);

  return {
    ...query,
    searchInput,
    setSearchInput,
    search,
    page,
    setPage,
    applySearch,
    users,
    total,
    pages,
  };
}
