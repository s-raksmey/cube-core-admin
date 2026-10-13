"use client";

import { ConsoleAuthFlow } from "@/components/auth/console-auth-flow";
import { usePublicMainTenantBranding } from "@/hooks/use-public-main-tenant-branding";

type AdminLandingProps = {
  initialShowLogin?: boolean;
};

export function AdminLanding({ initialShowLogin = false }: AdminLandingProps) {
  const { data } = usePublicMainTenantBranding();
  return (
    <ConsoleAuthFlow
      initialShowLogin={initialShowLogin}
      branding={data?.publicMainTenantBranding}
    />
  );
}
