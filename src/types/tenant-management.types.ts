import type { ManagedSubTenantUsersQuery } from "@/lib/apollo/types";

export type ManagedTenantUser =
  ManagedSubTenantUsersQuery["subTenantUsers"]["items"][number];

export type ManagedTenantUserLinkResult = {
  user: ManagedTenantUser;
  url: string | null;
  expiresAt: string;
  isNew: boolean;
  kind: "activation" | "password-reset";
};

export type TenantUserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "EDITOR";
};

export type TenantFormValues = {
  name: string;
  slug: string;
  managementDomain: string;
  websiteDomain: string;
  localDevelopmentHostname: string;
};
