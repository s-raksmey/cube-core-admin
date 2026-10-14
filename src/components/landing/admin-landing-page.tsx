import { AdminLanding } from "@/components/landing/admin-landing";
import { getPublicMainTenantBranding } from "@/lib/branding/public-main-tenant-branding";
import { Suspense } from "react";

async function BrandedAdminLanding({ showLogin }: { showLogin: boolean }) {
  const branding = await getPublicMainTenantBranding();
  return <AdminLanding initialShowLogin={showLogin} initialBranding={branding} />;
}

/**
 * The fallback preserves the landing layout during a slow branding lookup.
 * Once the server response arrives it replaces only the branding data.
 */
export function AdminLandingPage({ showLogin = false }: { showLogin?: boolean }) {
  return (
    <Suspense fallback={<AdminLanding initialShowLogin={showLogin} />}>
      <BrandedAdminLanding showLogin={showLogin} />
    </Suspense>
  );
}
