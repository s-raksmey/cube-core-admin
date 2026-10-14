import "server-only";

import { authServerBaseUrl } from "@/lib/auth/console";
import { cache } from "react";

export type PublicMainTenantBranding = {
  managementLogoUrl: string | null;
  faviconUrl: string | null;
};

type BrandingResponse = {
  data?: { publicMainTenantBranding?: PublicMainTenantBranding | null };
  errors?: Array<{ message?: string }>;
};

/**
 * Loads the public branding during the server render so the landing header has
 * its current logo before the client-side Apollo query runs.
 */
export const getPublicMainTenantBranding = cache(
  async (): Promise<PublicMainTenantBranding | null> => {
    try {
      const response = await fetch(`${authServerBaseUrl()}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query PublicMainTenantBranding {
            publicMainTenantBranding {
              managementLogoUrl
              faviconUrl
            }
          }`,
        }),
        cache: "no-store",
      });

      if (!response.ok) return null;
      const payload = (await response.json()) as BrandingResponse;
      if (payload.errors?.length) return null;
      return payload.data?.publicMainTenantBranding ?? null;
    } catch {
      // Keep the sign-in screen available while the branding service restarts.
      return null;
    }
  },
);
