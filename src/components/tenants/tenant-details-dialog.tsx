"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { SubTenantRow } from "@/lib/apollo/types";
import type { TenantDomainPurpose } from "@/lib/apollo/generated/graphql";

type TenantDetails = SubTenantRow;

export function TenantDetailsDialog({
  open,
  tenant,
  loading,
  error,
  onOpenChange,
  onManageDomain,
}: {
  open: boolean;
  tenant: TenantDetails | null;
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onManageDomain: (purpose: TenantDomainPurpose) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    if (!tenant) return;
    await navigator.clipboard.writeText(tenant.id);
    setCopied(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tenant details</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        ) : tenant ? (
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Name</dt><dd>{tenant.name}</dd>
            <dt className="text-muted-foreground">Slug</dt><dd className="font-mono">{tenant.slug}</dd>
            <dt className="text-muted-foreground">Tenant UUID</dt>
            <dd className="flex min-w-0 items-center gap-2 font-mono text-xs">
              <span className="truncate">{tenant.id}</span>
              <Button variant="ghost" size="icon-sm" onClick={copyId} aria-label="Copy tenant UUID">{copied ? <Check /> : <Copy />}</Button>
            </dd>
            <dt className="text-muted-foreground">Local development hostname</dt>
            <dd>{tenant.localDevelopmentHostname ?? "Not assigned"}</dd>
            <dt className="text-muted-foreground">Management domain</dt>
            <dd className="space-y-1 break-all">
              <div>{tenant.managementDomain ?? "Not configured"}</div>
              <div className="flex items-center gap-2"><StatusBadge status={tenant.managementDomainStatus ?? "DISABLED"} /><Button size="sm" variant="outline" onClick={() => onManageDomain("MANAGEMENT")}>Setup</Button></div>
            </dd>
            <dt className="text-muted-foreground">Public domain</dt>
            <dd className="space-y-1 break-all">
              <div>{tenant.websiteDomain ?? "Not configured"}</div>
              <div className="flex items-center gap-2"><StatusBadge status={tenant.websiteDomainStatus ?? "DISABLED"} /><Button size="sm" variant="outline" onClick={() => onManageDomain("WEBSITE")}>Setup</Button></div>
            </dd>
            <dt className="text-muted-foreground">Users</dt><dd>{tenant.userCount}</dd>
            <dt className="text-muted-foreground">Created</dt><dd>{new Date(tenant.createdAt).toLocaleDateString()}</dd>
          </dl>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
