"use client";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LOGOUT_MUTATION } from "@/lib/apollo/operations";
import { clearAdminSession } from "@/lib/auth/session-actions";
import { mainTenantDocumentTitleStorageKey } from "@/lib/main-tenant-document-title";
import type { AuthUser } from "@/lib/types";
import { useApolloClient } from "@apollo/client/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

export function ConsoleShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const apollo = useApolloClient();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useLayoutEffect(() => {
    document.title = user.tenant.name;
    localStorage.setItem(mainTenantDocumentTitleStorageKey, user.tenant.name);
  }, [user.tenant.name]);

  async function handleLogout() {
    try {
      await apollo.mutate({
        mutation: LOGOUT_MUTATION,
      });
    } catch {
      // Continue logout even if the API logout request fails.
    }

    await clearAdminSession();

    // Remove authenticated data from Apollo memory.
    await apollo.clearStore();

    // Internal Next.js navigation.
    router.replace("/");
  }

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await handleLogout();
      // Keep the progress state visible until navigation unmounts this shell.
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
          <SidebarTrigger />

          <Separator orientation="vertical" className="h-5" />

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <p className="truncate text-sm text-muted-foreground">
              Platform overview · Main Tenant
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutOpen(true)}
              className="shrink-0"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <Dialog
        open={logoutOpen}
        onOpenChange={(open) => {
          if (!loggingOut) setLogoutOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You will need to sign in again to access the Main Console.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loggingOut}
              onClick={() => setLogoutOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={loggingOut} onClick={() => void confirmLogout()}>
              <LogOut className="size-4" />
              {loggingOut ? "Logging out…" : "Log out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
