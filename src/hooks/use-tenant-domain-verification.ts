"use client";

import type { TenantDomainPurpose } from "@/lib/apollo/generated/graphql";
import {
  ACTIVATE_TENANT_DOMAIN,
  CHECK_TENANT_DOMAIN_VERIFICATION,
  START_TENANT_DOMAIN_VERIFICATION,
} from "@/lib/apollo/operations";
import type { TenantDomainVerificationChallenge } from "@/types/tenant-domain.types";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to update domain status.";
}

export function useTenantDomainVerification({
  tenantId,
  purpose,
  onChanged,
}: {
  tenantId: string;
  purpose: TenantDomainPurpose;
  onChanged: () => void;
}) {
  const [challenge, setChallenge] =
    useState<TenantDomainVerificationChallenge | null>(null);
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
      setError(errorMessage(cause));
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
        return;
      }
      setChallenge((current) =>
        current
          ? { ...current, status: value.status, verifiedAt: value.verifiedAt }
          : current,
      );
      onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
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
      setError(errorMessage(cause));
    }
  }

  return {
    challenge,
    error,
    copied,
    confirmedHttps,
    busy: starting || checking || activating,
    starting,
    checking,
    activating,
    beginVerification,
    checkVerification,
    markConnected,
    setError,
    setCopied,
    setConfirmedHttps,
  };
}
