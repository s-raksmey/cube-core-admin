import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SubTenantRow } from "@/lib/apollo/types";

type TenantStatusConfirmDialogProps = { tenant: SubTenantRow | null; loading: boolean; error: string | null; onOpenChange: (open: boolean) => void; onConfirm: () => void };

/** Shared confirmation UI for a sub-tenant enable or suspend action. */
export function TenantStatusConfirmDialog({ tenant, loading, error, onOpenChange, onConfirm }: TenantStatusConfirmDialogProps) {
  const disabling = tenant?.status === "ACTIVE";
  return <Dialog open={Boolean(tenant)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{disabling ? "Disable tenant?" : "Enable tenant?"}</DialogTitle><p className="text-sm text-muted-foreground">{disabling ? `Users in ${tenant?.name} will no longer be able to sign in.` : `Users in ${tenant?.name} will be able to sign in again.`}</p></DialogHeader>{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button><Button variant={disabling ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>{loading ? "Saving…" : disabling ? "Disable tenant" : "Enable tenant"}</Button></DialogFooter></DialogContent></Dialog>;
}
