"use client";

import {
  mainTenantDocumentTitle,
  mainTenantDocumentTitleStorageKey,
} from "@/lib/main-tenant-document-title";
import { useEffect } from "react";

/** Keeps the Main Tenant name in browser chrome during console route transitions. */
export function MainTenantDocumentTitleGuard() {
  useEffect(() => {
    const applyStoredTitle = () => {
      try {
        const title = localStorage.getItem(mainTenantDocumentTitleStorageKey);
        if (title === mainTenantDocumentTitle && document.title !== title) {
          document.title = title;
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
