/** Main-tenant role. */
export type MainTenantRole = "SUPERADMIN";

/** Sub-tenant roles. */
export type SubTenantRole = "ADMIN" | "EDITOR" | "AUTHOR";

export type UserRole = MainTenantRole | SubTenantRole;
export type UserType = "MAIN" | "SUB";
export type UserStatus = "PENDING" | "ACTIVE" | "DISABLED";

export type AuthUser = {
  id: string;
  email: string;
  username?: string | null;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  type: UserType;
  role: UserRole;
  status?: UserStatus;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    type: "MAIN" | "SUB";
    status: "ACTIVE" | "SUSPENDED";
  };
};
