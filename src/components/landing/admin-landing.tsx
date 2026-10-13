"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { ConsoleAuthFlow } from "@/components/auth/console-auth-flow";

type AdminLandingProps = {
  initialShowLogin?: boolean;
};

export function AdminLanding({ initialShowLogin = false }: AdminLandingProps) {
  const { data } = useQuery<{ publicMainTenantBranding: { managementLogoUrl: string | null; faviconUrl: string | null } }>(
    gql`query PublicMainTenantBranding { publicMainTenantBranding { managementLogoUrl faviconUrl } }`,
    { fetchPolicy: "cache-and-network" },
  );
  return <ConsoleAuthFlow initialShowLogin={initialShowLogin} branding={data?.publicMainTenantBranding} />;
}
