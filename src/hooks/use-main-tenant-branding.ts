"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

const MAIN_TENANT_BRANDING = gql`
  query MainTenantBranding {
    mainTenantBranding {
      managementLogoUrl
      faviconUrl
      openGraphImageUrl
    }
  }
`;
const UPDATE_MAIN_TENANT_BRANDING = gql`
  mutation UpdateMainTenantBranding(
    $asset: BrandingAsset!
    $fileName: String!
    $mimeType: String!
    $contentBase64: String
  ) {
    updateMainTenantBranding(
      asset: $asset
      fileName: $fileName
      mimeType: $mimeType
      contentBase64: $contentBase64
    ) {
      managementLogoUrl
      faviconUrl
      openGraphImageUrl
    }
  }
`;

type MainTenantBrandingData = {
  mainTenantBranding: {
    managementLogoUrl: string | null;
    faviconUrl: string | null;
    openGraphImageUrl: string | null;
  };
};

export function useMainTenantBranding() {
  const query = useQuery<MainTenantBrandingData>(MAIN_TENANT_BRANDING);
  const [updateBranding, mutation] = useMutation(UPDATE_MAIN_TENANT_BRANDING);
  return { ...query, updateBranding, saving: mutation.loading };
}
