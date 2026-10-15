"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMainTenantBranding } from "@/hooks/use-main-tenant-branding";
import { ImageIcon, Monitor, Share2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

function mainAssetUrl(path: string) {
  return `/main-assets/${path.replace(/^\/storage\//, "")}`;
}

type Asset = "MANAGEMENT_LOGO" | "FAVICON" | "OPEN_GRAPH_IMAGE";
type Branding = {
  managementLogoUrl: string | null;
  faviconUrl: string | null;
  openGraphImageUrl: string | null;
};
const assetConfig: {
  asset: Asset;
  title: string;
  description: string;
  icon: typeof Monitor;
  field: keyof Branding;
  social?: boolean;
}[] = [
  {
    asset: "MANAGEMENT_LOGO",
    title: "Main console logo",
    description: "Shown in the Main Tenant navigation and sign-in experience.",
    icon: Monitor,
    field: "managementLogoUrl",
  },
  {
    asset: "FAVICON",
    title: "Favicon",
    description: "Shown in browser tabs and bookmarks for the Main Tenant.",
    icon: ImageIcon,
    field: "faviconUrl",
  },
  {
    asset: "OPEN_GRAPH_IMAGE",
    title: "Social sharing image",
    description: "Used when Cube Core pages are shared on social platforms.",
    icon: Share2,
    field: "openGraphImageUrl",
    social: true,
  },
];

function AssetCard({
  config,
  url,
  change,
  saving,
  onStage,
  onSave,
  onValidationError,
}: {
  config: (typeof assetConfig)[number];
  url: string | null;
  change: File | null | undefined;
  saving: boolean;
  onStage: (asset: Asset, file: File | null) => void;
  onSave: (asset: Asset) => void;
  onValidationError: (message: string) => void;
}) {
  const inputId = useId();
  const Icon = config.icon;
  const previewUrl = change === null ? null : url;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex gap-3 border-b px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="font-semibold">{config.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div
          className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 ${config.social ? "h-32" : "h-24"}`}
        >
          {previewUrl ? (
            <Image
              src={mainAssetUrl(previewUrl)}
              alt={config.title}
              fill
              unoptimized
              sizes={
                config.social ? "(min-width: 1024px) 40vw, 100vw" : "240px"
              }
              className={
                config.social ? "p-2 object-contain" : "p-4 object-contain"
              }
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Default branding
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
            disabled={saving}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (file.size > 1000 * 1024) {
                onValidationError("Image must be 1,000 KB or smaller.");
                return;
              }
              onStage(config.asset, file);
            }}
          />
          <Button type="button" size="sm" disabled={saving} asChild>
            <label className="cursor-pointer" htmlFor={inputId}>
              <Upload className="size-4" />
              {url ? "Replace image" : "Upload image"}
            </label>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving || change === undefined}
            onClick={() => onSave(config.asset)}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving || !url || change === null}
            onClick={() => onStage(config.asset, null)}
          >
            <Trash2 className="size-4 text-destructive" />
            Remove
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPEG, WebP, SVG, or ICO · Maximum 1,000 KB
        </p>
        {change instanceof File ? (
          <p className="text-xs text-primary">
            Selected: {change.name}. Save to apply it.
          </p>
        ) : null}
        {change === null ? (
          <p className="text-xs text-destructive">
            This image will be removed when saved.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function MainTenantBrandingPanel() {
  const {
    data,
    loading,
    error,
    refetch,
    updateBranding: update,
    saving,
  } = useMainTenantBranding();
  const [changes, setChanges] = useState<Partial<Record<Asset, File | null>>>(
    {},
  );
  const [confirm, setConfirm] = useState<Asset[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const save = async (assets: Asset[]) => {
    setConfirm(null);
    setMessage(null);
    try {
      for (const asset of assets) {
        const change = changes[asset];
        if (change === undefined) continue;
        let contentBase64: string | null = null;
        if (change)
          contentBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(String(reader.result).split(",")[1] ?? "");
            reader.onerror = reject;
            reader.readAsDataURL(change);
          });
        await update({
          variables: {
            asset,
            fileName: change?.name ?? "remove",
            mimeType: change?.type ?? "image/png",
            contentBase64,
          },
        });
      }
      setChanges((current) => {
        const next = { ...current };
        assets.forEach((asset) => delete next[asset]);
        return next;
      });
      await refetch();
      window.dispatchEvent(new Event("main-tenant-branding-updated"));
      setMessage(
        assets.length === 1
          ? "Branding asset saved."
          : "All branding changes saved.",
      );
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Could not save branding changes.",
      );
    }
  };
  const branding = data?.mainTenantBranding;
  const initialLoading = loading && !branding;
  if (initialLoading)
    return <p className="text-sm text-muted-foreground">Loading branding…</p>;
  if (error && !branding)
    return <p className="text-sm text-destructive">{error.message}</p>;
  const pending = Object.keys(changes) as Asset[];
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-4">
        <h2 className="font-semibold">Main Tenant brand assets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload the visual identity and social sharing assets used by Cube
          Core. Changes appear after saving.
        </p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        {assetConfig.map((config) => (
          <AssetCard
            key={config.asset}
            config={config}
            url={branding?.[config.field] ?? null}
            change={changes[config.asset]}
            saving={saving}
            onStage={(asset, file) => {
              setMessage(null);
              setChanges((current) => ({ ...current, [asset]: file }));
            }}
            onSave={(asset) => setConfirm([asset])}
            onValidationError={setMessage}
          />
        ))}
      </div>
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-border bg-card/95 px-5 py-3 backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {pending.length
            ? "You have unsaved branding changes."
            : "No unsaved changes."}
        </p>
        <Button
          disabled={!pending.length || saving}
          onClick={() => setConfirm(pending)}
        >
          {saving ? "Saving…" : "Save all changes"}
        </Button>
      </div>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!saving && !open) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.length === 1
                ? "Save branding asset?"
                : "Save all branding changes?"}
            </DialogTitle>
            <DialogDescription>
              The selected image uploads and removals will be applied to the
              Main Tenant.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={saving || !confirm?.length}
              onClick={() => {
                if (confirm) void save(confirm);
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
