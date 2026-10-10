/** Main-tenant role. */
export type MainTenantRole = "SUPERADMIN";

import type { SubTenantRole } from "@/lib/apollo/generated/graphql";
export type { SubTenantRole, UserStatus, UserType } from "@/lib/apollo/generated/graphql";
export type UserRole = MainTenantRole | SubTenantRole;
export type AuthUser = NonNullable<
  import("@/lib/apollo/generated/graphql").CurrentUserQuery["me"]
>;
