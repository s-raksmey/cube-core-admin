"use client";

import Image from "next/image";
import Link from "next/link";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Activity,
  Box,
  FileText,
  HeartPulse,
  ImageIcon,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { AuthUser } from "@/lib/types";

const MAIN_BRANDING = gql`query MainSidebarBranding { mainTenantBranding { managementLogoUrl faviconUrl } }`;
function mainAssetUrl(path: string) {
  return `/main-assets/${path.replace(/^\/storage\//, "")}`;
}

function applyMainFavicon(path: string | null | undefined) {
  document.querySelector<HTMLLinkElement>("link[data-main-tenant-favicon]")?.remove();
  if (!path) return;
  const link = document.createElement("link");
  link.dataset.mainTenantFavicon = "true";
  link.rel = "icon";
  link.href = `${mainAssetUrl(path)}?v=${Date.now()}`;
  document.head.appendChild(link);
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const superAdminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tenants", href: "/tenants", icon: Box },
  { title: "Users", href: "/users", icon: Users },
  { title: "Roles & Permissions", href: "/roles", icon: ShieldCheck },
  { title: "Platform Settings", href: "/settings", icon: Settings },
  { title: "Audit Logs", href: "/audit", icon: Activity },
  { title: "System Health", href: "/health", icon: HeartPulse },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/users", icon: Users },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

const editorNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

function navForRole(role: AuthUser["role"]) {
  if (role === "SUPERADMIN") return superAdminNav;
  if (role === "ADMIN") return adminNav;
  return editorNav;
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const items = navForRole(user.role);
  const { data: brandingData, refetch } = useQuery<{ mainTenantBranding: { managementLogoUrl: string | null; faviconUrl: string | null } }>(MAIN_BRANDING, { skip: user.role !== "SUPERADMIN", fetchPolicy: "cache-and-network" });
  const managementLogoUrl = brandingData?.mainTenantBranding.managementLogoUrl;
  const faviconUrl = brandingData?.mainTenantBranding.faviconUrl;
  useEffect(() => { applyMainFavicon(faviconUrl); }, [faviconUrl, pathname]);
  useEffect(() => {
    const refresh = () => { void refetch(); };
    window.addEventListener("main-tenant-branding-updated", refresh);
    return () => window.removeEventListener("main-tenant-branding-updated", refresh);
  }, [refetch]);
  const identityLabel =
    user.role === "SUPERADMIN" ? "Main Tenant" : user.tenant.name;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center border-b border-sidebar-border p-0 px-3">
        <Image
          src={managementLogoUrl ? mainAssetUrl(managementLogoUrl) : "/images/cube-core-icon.webp"}
          alt="Cube Core"
          width={32}
          height={32}
          className="size-8 object-contain"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="text-sidebar-foreground hover:text-sidebar-accent-foreground data-active:text-sidebar-accent-foreground"
                    >
                      <Link href={item.href} className="no-underline">
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
            {identityLabel}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {user.email}
          </p>
          <Badge className="mt-2 bg-sidebar-primary text-sidebar-primary-foreground">
            {user.role}
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
