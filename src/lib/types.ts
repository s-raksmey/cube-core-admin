/** Main-tenant role. */
export type MainTenantRole = "SUPERADMIN";

/** Sub-tenant roles. */
export type SubTenantRole = "ADMIN" | "EDITOR" | "AUTHOR";

export type UserRole = MainTenantRole | SubTenantRole;
export type { UserStatus, UserType } from "@/lib/apollo/generated/graphql";
export type AuthUser = NonNullable<
  import("@/lib/apollo/generated/graphql").CurrentUserQuery["me"]
>;
