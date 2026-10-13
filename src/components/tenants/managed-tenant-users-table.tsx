import { KeyRound, Pencil, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ManagedSubTenantUsersQuery } from "@/lib/apollo/types";

export type ManagedTenantUser = ManagedSubTenantUsersQuery["subTenantUsers"]["items"][number];

type ManagedTenantUsersTableProps = {
  users: ManagedTenantUser[];
  page: number;
  pages: number;
  total: number;
  loading: boolean;
  regenerating: boolean;
  loadingLink: boolean;
  generatingReset: boolean;
  hasActions: boolean;
  permissions: { canEdit: boolean; canChangeRoles: boolean; canSuspend: boolean; canActivate: boolean; canReset: boolean; canDelete: boolean };
  onEdit: (user: ManagedTenantUser) => void;
  onActivation: (user: ManagedTenantUser) => void;
  onResetPassword: (user: ManagedTenantUser) => void;
  onDelete: (user: ManagedTenantUser) => void;
  onPageChange: (page: number) => void;
};

function dateLabel(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

/** Data table and pagination shared by Main Tenant sub-tenant user screens. */
export function ManagedTenantUsersTable({ users, page, pages, total, loading, regenerating, loadingLink, generatingReset, hasActions, permissions, onEdit, onActivation, onResetPassword, onDelete, onPageChange }: ManagedTenantUsersTableProps) {
  return <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Account status</TableHead><TableHead>Activation</TableHead><TableHead>Link generated</TableHead><TableHead>Link expiry</TableHead>{hasActions ? <TableHead className="text-right">Actions</TableHead> : null}</TableRow></TableHeader><TableBody>{users.map((user) => {
    const eligible = (user.accountStatus === "PENDING" && (user.activationStatus === "PENDING" || user.activationStatus === "EXPIRED")) || user.accountStatus === "ACTIVE";
    return <TableRow key={user.id}><TableCell className="font-medium">{user.fullName}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell><StatusBadge status={user.membershipStatus === "DISABLED" ? "SUSPENDED" : user.accountStatus} /></TableCell><TableCell><StatusBadge status={user.activationStatus} /></TableCell><TableCell>{dateLabel(user.activationLinkCreatedAt)}</TableCell><TableCell>{dateLabel(user.activationLinkExpiresAt)}</TableCell>{hasActions ? <TableCell className="text-right"><div className="flex justify-end gap-1">{permissions.canEdit || permissions.canChangeRoles || permissions.canSuspend ? <Button variant="ghost" size="icon" onClick={() => onEdit(user)} title="Edit user"><Pencil /></Button> : null}{permissions.canActivate ? <Button variant="ghost" size="icon" disabled={!eligible || regenerating || loadingLink} onClick={() => onActivation(user)} title={user.accountStatus === "ACTIVE" ? "Reactivate account and reset 2FA" : eligible ? "Regenerate activation link" : "Only pending or active accounts can receive an activation link"}>{user.accountStatus === "ACTIVE" ? <RotateCcw /> : <RotateCw />}</Button> : null}{permissions.canReset ? <Button variant="ghost" size="icon" disabled={generatingReset || user.accountStatus !== "ACTIVE"} onClick={() => onResetPassword(user)} title="Reset password"><KeyRound /></Button> : null}{permissions.canDelete ? <Button variant="ghost" size="icon" onClick={() => onDelete(user)} title="Delete tenant user"><Trash2 className="text-destructive" /></Button> : null}</div></TableCell> : null}</TableRow>;
  })}</TableBody></Table></div><div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Page {page} of {pages} · {total} users</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => onPageChange(page + 1)}>Next</Button></div></div></div>;
}
