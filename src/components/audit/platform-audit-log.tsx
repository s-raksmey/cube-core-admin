"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLATFORM_AUDIT_LOGS_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

function formatAuditDetails(details: string | null) {
  if (!details) return "No additional details.";
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
}

/** Displays the same audited platform events summarized on the dashboard. */
export function PlatformAuditLog() {
  const [requestedPage, setRequestedPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, previousData, error, loading, refetch } = useQuery(
    PLATFORM_AUDIT_LOGS_QUERY,
    { variables: { page: requestedPage } },
  );
  // Preserve the current table while Apollo fetches the next page.
  const auditPage =
    data?.platformAuditLogs ?? previousData?.platformAuditLogs;
  const items = auditPage?.items ?? [];
  const selectedLog = items.find((item) => item.id === selectedId) ?? null;
  const page = auditPage?.page ?? requestedPage;
  const pageSize = auditPage?.pageSize ?? 10;
  const total = auditPage?.total ?? 0;
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);
  const canGoNext = page * pageSize < total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Review the most recent audited activity across the Cube Core platform."
        crumbs={[{ label: "Console", href: "/dashboard" }, { label: "Audit Logs" }]}
        actions={
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void refetch({ page })}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <EmptyState
          title="Unable to load audit logs"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Details</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !auditPage ? (
                <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Loading audit logs…</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">No audit logs yet.</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.action}</TableCell>
                  <TableCell>{item.actorEmail ?? "System"}</TableCell>
                  <TableCell>{item.targetTenantName ?? "—"}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setSelectedId(item.id)}>Details</Button></TableCell>
                  <TableCell>
                    <span
                      aria-label={item.success ? "Success" : "Failed"}
                      title={item.success ? "Success" : "Failed"}
                      className={`ml-auto block size-2 rounded-full ${item.success ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    <span className="sr-only">{item.success ? "Success" : "Failed"}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">Showing {firstItem}–{lastItem} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setRequestedPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={loading || !canGoNext} onClick={() => setRequestedPage(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Audit log details</DialogTitle>
            <DialogDescription>{selectedLog?.action}</DialogDescription>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2">
                <dt className="text-muted-foreground">Status</dt>
                <dd className={selectedLog.success ? "text-emerald-600" : "text-red-600"}>{selectedLog.success ? "Success" : "Failed"}</dd>
                <dt className="text-muted-foreground">Actor</dt>
                <dd className="break-words">{selectedLog.actorEmail ?? "System"}</dd>
                <dt className="text-muted-foreground">Tenant</dt>
                <dd className="break-words">{selectedLog.targetTenantName ?? "—"}</dd>
                <dt className="text-muted-foreground">Target</dt>
                <dd className="break-all">{selectedLog.targetType ?? "—"}{selectedLog.targetId ? ` · ${selectedLog.targetId}` : ""}</dd>
                <dt className="text-muted-foreground">Time</dt>
                <dd>{new Date(selectedLog.createdAt).toLocaleString()}</dd>
              </dl>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Event data</p>
                <pre className="max-h-[min(45svh,24rem)] overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">{formatAuditDetails(selectedLog.details)}</pre>
              </div>
            </div>
          ) : null}
          <DialogFooter><Button onClick={() => setSelectedId(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
