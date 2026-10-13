"use client";

import {
  TENANT_ROLE_PERMISSIONS_QUERY,
  UPDATE_TENANT_ROLE_PERMISSIONS,
} from "@/lib/apollo/operations";
import { useMutation, useQuery } from "@apollo/client/react";

/** Provides Main Console role-permission reads and updates. */
export function useMainRolePermissions() {
  const query = useQuery(TENANT_ROLE_PERMISSIONS_QUERY);
  const [updatePermissions, mutation] = useMutation(
    UPDATE_TENANT_ROLE_PERMISSIONS,
  );
  return {
    ...query,
    updatePermissions,
    saving: mutation.loading,
  };
}
