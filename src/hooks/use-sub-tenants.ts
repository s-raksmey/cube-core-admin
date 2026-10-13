"use client";

import {
  CREATE_SUB_TENANT,
  SET_SUB_TENANT_STATUS,
  SUB_TENANTS_QUERY,
  UPDATE_SUB_TENANT,
} from "@/lib/apollo/operations";
import { useMutation, useQuery } from "@apollo/client/react";

export function useSubTenants({
  search,
  page,
  pageSize,
}: {
  search: string;
  page: number;
  pageSize: number;
}) {
  const query = useQuery(SUB_TENANTS_QUERY, {
    variables: { search: search || null, page, pageSize },
  });
  const [createTenant, createState] = useMutation(CREATE_SUB_TENANT);
  const [updateTenant, updateState] = useMutation(UPDATE_SUB_TENANT);
  const [setTenantStatus, statusState] = useMutation(SET_SUB_TENANT_STATUS);
  const result = query.data?.subTenants;
  return {
    ...query,
    result,
    tenants: result?.items ?? [],
    total: result?.total ?? 0,
    initialLoading: query.loading && !result,
    createTenant,
    updateTenant,
    setTenantStatus,
    creating: createState.loading,
    updating: updateState.loading,
    updatingStatus: statusState.loading,
  };
}
