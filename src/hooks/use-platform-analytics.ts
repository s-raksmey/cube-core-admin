"use client";

import type { AnalyticsPeriod } from "@/lib/apollo/generated/graphql";
import { PLATFORM_ANALYTICS_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 29 * 86_400_000)
  .toISOString()
  .slice(0, 10);

export function usePlatformAnalytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("LAST_30_DAYS");
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const valid =
    period !== "CUSTOM" || (Boolean(from && to) && from <= to && to <= today);
  const query = useQuery(PLATFORM_ANALYTICS_QUERY, {
    variables: {
      range: { period, ...(period === "CUSTOM" ? { from, to } : {}) },
    },
    skip: !valid,
    fetchPolicy: "cache-and-network",
  });
  return {
    ...query,
    period,
    setPeriod,
    from,
    setFrom,
    to,
    setTo,
    valid,
    analytics: valid ? query.data?.platformAnalytics : undefined,
  };
}
