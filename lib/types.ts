export type UserRole = "SUPERADMIN" | "ADMIN" | "EDITOR";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    type: "MAIN" | "SUB";
    status: "ACTIVE" | "SUSPENDED";
  };
};
