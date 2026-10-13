"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubTenantRow } from "@/lib/apollo/types";
import { useState, type FormEvent } from "react";
import type { TenantFormValues } from "@/types/tenant-management.types";

export function TenantFormDialog({
  tenant,
  open,
  loading,
  error,
  onOpenChange,
  onSubmit,
}: {
  tenant: SubTenantRow | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TenantFormValues) => void;
}) {
  const [values, setValues] = useState<TenantFormValues>(() => ({
    name: tenant?.name ?? "",
    slug: tenant?.slug ?? "",
    managementDomain: productionHostnameValue(tenant?.managementDomain),
    websiteDomain: productionHostnameValue(tenant?.websiteDomain),
    localDevelopmentHostname:
      tenant?.localDevelopmentHostname ??
      (hasLegacyLocalAddress(tenant?.managementDomain) ||
      hasLegacyLocalAddress(tenant?.websiteDomain)
        ? "localhost"
        : ""),
  }));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(tenant));
  const isEditing = Boolean(tenant);

  function update(field: keyof TenantFormValues, value: string) {
    if (field === "name") {
      setValues((current) => ({
        ...current,
        name: value,
        ...(!slugManuallyEdited ? { slug: slugFromName(value) } : {}),
      }));
      return;
    }

    if (field === "slug") setSlugManuallyEdited(true);
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit tenant" : "Create sub-tenant"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-name">Tenant name</Label>
            <Input
              id="tenant-name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={80}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-slug">Slug</Label>
            <Input
              id="tenant-slug"
              value={values.slug}
              onChange={(event) => update("slug", event.target.value)}
              placeholder="acme-corp"
              maxLength={60}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? "Lowercase letters, numbers, and hyphens. You can change the slug."
                : "Suggested from the tenant name. You can edit it; use lowercase letters, numbers, and hyphens."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="management-domain">Management domain</Label>
            <Input
              id="management-domain"
              value={values.managementDomain}
              onChange={(event) =>
                update("managementDomain", event.target.value)
              }
              placeholder="admin.example.com"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Use a real custom hostname here. Local development shares
              localhost:3001 across tenants; tenant-specific links are available
              in Tenant details.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website-domain">Public website domain</Label>
            <Input
              id="website-domain"
              value={values.websiteDomain}
              onChange={(event) => update("websiteDomain", event.target.value)}
              placeholder="www.example.com"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Use a real custom hostname here. Local public previews share
              localhost:3002 across tenants.
            </p>
          </div>
          {isEditing ? (
            <div className="space-y-1.5">
              <Label htmlFor="local-development-hostname">
                Local development hostname
              </Label>
              <Input
                id="local-development-hostname"
                value={values.localDevelopmentHostname}
                onChange={(event) =>
                  update("localDevelopmentHostname", event.target.value)
                }
                placeholder="localhost"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter localhost to make this tenant active on the shared local
                console (3001) and website (3002). Leave empty to remove the
                assignment.
              </p>
              {hasLegacyLocalAddress(tenant?.managementDomain) ||
              hasLegacyLocalAddress(tenant?.websiteDomain) ? (
                <p className="text-xs text-muted-foreground">
                  Saving converts old localhost domain entries to this
                  local-only assignment.
                </p>
              ) : null}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Leave these fields blank for local development. Saving a domain only
            records a production hostname; DNS ownership, hosting, and HTTPS
            must be completed from Tenant details → Setup before it can serve
            traffic.
          </p>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function hasLegacyLocalAddress(value: string | null | undefined) {
  return Boolean(
    value &&
    /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?\/?$/i.test(
      value.trim(),
    ),
  );
}

function productionHostnameValue(value: string | null | undefined) {
  return hasLegacyLocalAddress(value) ? "" : (value ?? "");
}

function slugFromName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
