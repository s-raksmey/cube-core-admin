"use client";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  TenantDomainPurpose,
  TenantDomainStatus,
} from "@/lib/apollo/generated/graphql";
import {
  ACTIVATE_TENANT_DOMAIN,
  CHECK_TENANT_DOMAIN_VERIFICATION,
  START_TENANT_DOMAIN_VERIFICATION,
} from "@/lib/apollo/operations";
import { useMutation } from "@apollo/client/react";
import { Check, Copy, LoaderCircle, RotateCw } from "lucide-react";
import { useState } from "react";

type VerificationChallenge = {
  hostname: string;
  status: TenantDomainStatus;
  verifiedAt: string | null;
  recordName: string | null;
  recordValue: string | null;
};

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to update domain status.";
}

export function TenantDomainSetupDialog({
  tenantId,
  tenantName,
  hostname,
  purpose,
  status,
  open,
  onOpenChange,
  onChanged,
}: {
  tenantId: string;
  tenantName: string;
  hostname: string | null;
  purpose: TenantDomainPurpose;
  status: TenantDomainStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmedHttps, setConfirmedHttps] = useState(false);
  const [start, { loading: starting }] = useMutation(
    START_TENANT_DOMAIN_VERIFICATION,
  );
  const [check, { loading: checking }] = useMutation(
    CHECK_TENANT_DOMAIN_VERIFICATION,
  );
  const [activate, { loading: activating }] = useMutation(
    ACTIVATE_TENANT_DOMAIN,
  );
  const busy = starting || checking || activating;

  async function beginVerification() {
    setError(null);
    try {
      const result = await start({ variables: { tenantId, purpose } });
      const value = result.data?.startTenantDomainVerification;
      if (!value) throw new Error("Verification details were not returned.");
      setChallenge(value);
      setCopied(false);
      onChanged();
    } catch (cause) {
      setError(message(cause));
    }
  }

  async function checkVerification() {
    setError(null);
    try {
      const result = await check({ variables: { tenantId, purpose } });
      const value = result.data?.checkTenantDomainVerification;
      if (!value) throw new Error("Verification status was not returned.");
      if (value.status === "PENDING_VERIFICATION") {
        setError(
          "The TXT record was not found yet. DNS changes can take time to propagate.",
        );
      } else {
        setChallenge((current) =>
          current
            ? { ...current, status: value.status, verifiedAt: value.verifiedAt }
            : current,
        );
        onChanged();
      }
    } catch (cause) {
      setError(message(cause));
    }
  }

  async function markConnected() {
    setError(null);
    try {
      const result = await activate({
        variables: {
          tenantId,
          purpose,
          confirmHttpsAndRouting: confirmedHttps,
        },
      });
      const value = result.data?.activateTenantDomain;
      if (!value) throw new Error("Domain status was not returned.");
      setChallenge((current) =>
        current
          ? { ...current, status: value.status, verifiedAt: value.verifiedAt }
          : current,
      );
      onChanged();
    } catch (cause) {
      setError(message(cause));
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setError("Could not copy the value. Select and copy it manually.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {purpose === "MANAGEMENT"
              ? "Management domain"
              : "Public website domain"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {tenantName} · {hostname ?? "No domain configured"}
          </p>
        </DialogHeader>
        {!hostname ? (
          <p className="text-sm text-muted-foreground">
            Add a hostname in Edit Tenant before setting up this domain.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <span>Connection status</span>
              <StatusBadge status={challenge?.status ?? status} />
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Generate the ownership check below, then add the exact TXT
                record at your DNS provider.
              </li>
              <li>
                After DNS publishes the TXT record, check ownership. The domain
                will move to DNS and hosting setup.
              </li>
              <li>
                Configure the hostname on the shared{" "}
                {purpose === "MANAGEMENT" ? "Tenant Console" : "website"}{" "}
                deployment. Use the deployment provider&apos;s current CNAME/A
                record instructions.
              </li>
              <li>
                Confirm the domain opens the correct tenant over HTTPS before
                connecting it here.
              </li>
            </ol>
            {challenge?.recordName &&
            challenge.recordValue &&
            challenge.status === "PENDING_VERIFICATION" ? (
              <div className="grid gap-3 rounded-md bg-muted/50 p-3">
                <div className="space-y-1">
                  <p className="font-medium">TXT record name</p>
                  <div className="flex gap-2">
                    <Input readOnly value={challenge.recordName} />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => void copy(challenge.recordName ?? "")}
                      aria-label="Copy TXT record name"
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">TXT record value</p>
                  <div className="flex gap-2">
                    <Input readOnly value={challenge.recordValue} />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => void copy(challenge.recordValue ?? "")}
                      aria-label="Copy TXT record value"
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            {challenge?.status === "PENDING_DNS" || status === "PENDING_DNS" ? (
              <label className="flex items-start gap-2 rounded-md border p-3">
                <input
                  type="checkbox"
                  checked={confirmedHttps}
                  onChange={(event) => setConfirmedHttps(event.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  I tested <strong>https://{hostname}</strong> and confirmed it
                  routes to the{" "}
                  {purpose === "MANAGEMENT"
                    ? "Tenant Console"
                    : "public website"}{" "}
                  for {tenantName} with a valid HTTPS certificate.
                </span>
              </label>
            ) : null}
            {error ? (
              <p className="text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {copied ? (
              <p className="text-muted-foreground" role="status">
                Copied.
              </p>
            ) : null}
          </div>
        )}
        <DialogFooter className="flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hostname && status !== "ACTIVE" && status !== "PENDING_DNS" ? (
            <Button onClick={() => void beginVerification()} disabled={busy}>
              {starting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RotateCw />
              )}
              Generate TXT check
            </Button>
          ) : null}
          {hostname &&
          (challenge?.status === "PENDING_VERIFICATION" ||
            status === "PENDING_VERIFICATION") ? (
            <Button
              variant="outline"
              onClick={() => void checkVerification()}
              disabled={busy}
            >
              {checking ? <LoaderCircle className="animate-spin" /> : <Check />}
              Check DNS
            </Button>
          ) : null}
          {hostname &&
          (challenge?.status === "PENDING_DNS" || status === "PENDING_DNS") ? (
            <Button
              onClick={() => void markConnected()}
              disabled={busy || !confirmedHttps}
            >
              {activating ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Check />
              )}
              Connect domain
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
