"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const PUBLIC_MAIN_TENANT_BRANDING = gql`
  query PublicMainTenantBranding {
    publicMainTenantBranding {
      managementLogoUrl
      faviconUrl
    }
  }
`;

export function usePublicMainTenantBranding() {
  return useQuery<{
    publicMainTenantBranding: {
      managementLogoUrl: string | null;
      faviconUrl: string | null;
    };
  }>(PUBLIC_MAIN_TENANT_BRANDING);
}
