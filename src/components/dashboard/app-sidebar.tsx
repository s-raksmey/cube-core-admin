"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useMainSidebarBranding } from "@/hooks/use-main-sidebar-branding";
import { mainTenantDocumentTitle } from "@/lib/main-tenant-document-title";
import type { AuthUser } from "@/lib/types";
import {
  Activity,
  Box,
  HeartPulse,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    href: "/tenants",
    icon: Box,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Roles & Permissions",
    href: "/roles",
    icon: ShieldCheck,
  },
  {
    title: "Platform Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Audit Logs",
    href: "/audit",
    icon: Activity,
  },
  {
    title: "System Health",
    href: "/health",
    icon: HeartPulse,
  },
];

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const { managementLogoUrl, mainAssetUrl } = useMainSidebarBranding();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center border-b border-sidebar-border px-3">
        {managementLogoUrl ? (
          <Image
            src={mainAssetUrl(managementLogoUrl)}
            alt={`${user.tenant.name} logo`}
            width={32}
            height={32}
            className="size-8 shrink-0 object-contain"
          />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {user.tenant.name.charAt(0).toUpperCase()}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-sidebar-foreground hover:text-sidebar-accent-foreground data-active:text-sidebar-accent-foreground"
                    >
                      <Link
                        href={item.href}
                        className="no-underline"
                        onClick={() => {
                          document.title = mainTenantDocumentTitle;
                        }}
                      >
                        <item.icon />

                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent p-3 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
            {user.tenant.name}
          </p>

          <p className="mt-0.5 truncate text-xs text-sidebar-foreground/70">
            {user.email}
          </p>

          <Badge className="mt-2 bg-sidebar-primary text-sidebar-primary-foreground">
            SuperAdmin
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
