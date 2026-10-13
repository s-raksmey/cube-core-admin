"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useEffect } from "react";

const MAIN_SIDEBAR_BRANDING = gql`
  query MainSidebarBranding {
    mainTenantBranding {
      managementLogoUrl
      faviconUrl
    }
  }
`;

function mainAssetUrl(path: string) {
  return `/main-assets/${path.replace(/^\/storage\//, "")}`;
}

function applyMainFavicon(path: string | null | undefined) {
  const existing = document.querySelector<HTMLLinkElement>(
    "link[data-main-tenant-favicon]",
  );
  if (!path) {
    existing?.remove();
    return;
  }
  const link = existing ?? document.createElement("link");
  link.dataset.mainTenantFavicon = "true";
  link.rel = "icon";
  link.href = mainAssetUrl(path);
  if (!existing) document.head.appendChild(link);
}

export function useMainSidebarBranding() {
  const query = useQuery<{
    mainTenantBranding: {
      managementLogoUrl: string | null;
      faviconUrl: string | null;
    };
  }>(MAIN_SIDEBAR_BRANDING);
  const branding = query.data?.mainTenantBranding;
  const { refetch } = query;

  useEffect(() => {
    applyMainFavicon(branding?.faviconUrl);
  }, [branding?.faviconUrl]);
  useEffect(() => {
    const refreshBranding = () => void refetch();
    window.addEventListener("main-tenant-branding-updated", refreshBranding);
    return () =>
      window.removeEventListener(
        "main-tenant-branding-updated",
        refreshBranding,
      );
  }, [refetch]);

  return {
    managementLogoUrl: branding?.managementLogoUrl ?? null,
    mainAssetUrl,
  };
}
