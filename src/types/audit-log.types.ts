import type { PlatformAuditLogsQuery } from "@/lib/apollo/types";

export type PlatformAuditLogRow =
  PlatformAuditLogsQuery["platformAuditLogs"]["items"][number];

export type PlatformAuditLogPage = PlatformAuditLogsQuery["platformAuditLogs"];
