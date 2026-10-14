"use client";

import { ConsoleAuthFlow } from "@/components/auth/console-auth-flow";
import { usePublicMainTenantBranding } from "@/hooks/use-public-main-tenant-branding";
import type { PublicMainTenantBranding } from "@/lib/branding/public-main-tenant-branding";

type AdminLandingProps = {
  initialShowLogin?: boolean;
  initialBranding?: PublicMainTenantBranding | null;
};

export function AdminLanding({
  initialShowLogin = false,
  initialBranding = null,
}: AdminLandingProps) {
  const { data } = usePublicMainTenantBranding();
  return (
    <ConsoleAuthFlow
      initialShowLogin={initialShowLogin}
      branding={data?.publicMainTenantBranding ?? initialBranding ?? undefined}
    />
  );
}
