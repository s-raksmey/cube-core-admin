"use client";

import { MAIN_TENANT_USERS_QUERY } from "@/lib/apollo/operations";
import type { MainTenantUsersQuery } from "@/lib/apollo/types";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";

const PAGE_SIZE = 10;

/** Owns Main Tenant user-list querying, search, and pagination. */
export function useMainTenantUsers({ canViewUsers }: { canViewUsers: boolean }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useQuery<MainTenantUsersQuery>(
    MAIN_TENANT_USERS_QUERY,
    {
      variables: { search: search || null, page, pageSize: PAGE_SIZE },
      skip: !canViewUsers,
    },
  );

  const pageData = data?.mainTenantUsers;
  const users = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applySearch() {
    const nextSearch = searchInput.trim();
    if (nextSearch === search && page === 1) return;
    setSearch(nextSearch);
    setPage(1);
  }

  return {
    searchInput,
    setSearchInput,
    search,
    page,
    setPage,
    users,
    total,
    totalPages,
    canPrev: page > 1,
    canNext: page < totalPages,
    initialLoading: loading && !pageData,
    blockingError: Boolean(error && !pageData),
    refreshError: Boolean(error && pageData),
    refetch,
    applySearch,
  };
}

export type MainTenantUsersList = ReturnType<typeof useMainTenantUsers>;