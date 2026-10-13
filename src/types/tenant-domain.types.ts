import type { TenantDomainStatus } from "@/lib/apollo/generated/graphql";

export type TenantDomainVerificationChallenge = {
  hostname: string;
  status: TenantDomainStatus;
  verifiedAt: string | null;
  recordName: string | null;
  recordValue: string | null;
};
