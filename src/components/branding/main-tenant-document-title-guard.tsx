"use client";

import { mainTenantDocumentTitleStorageKey } from "@/lib/main-tenant-document-title";
import { useEffect } from "react";

/** Keeps the Main Tenant name in browser chrome during console route transitions. */
export function MainTenantDocumentTitleGuard() {
  useEffect(() => {
    const applyStoredTitle = () => {
      try {
        const tenantName = localStorage.getItem(mainTenantDocumentTitleStorageKey);
        if (tenantName && document.title !== tenantName) {
          document.title = tenantName;
        }
      } catch {
        // Browser storage can be unavailable in privacy-restricted contexts.
      }
    };

    const observer = new MutationObserver(applyStoredTitle);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    applyStoredTitle();
    return () => observer.disconnect();
  }, []);

  return null;
}
