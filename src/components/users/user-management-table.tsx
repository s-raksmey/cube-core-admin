"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KeyRound, Link2, Pencil, Trash2 } from "lucide-react";
import type { MainTenantUserRow } from "@/lib/apollo/types";

type MainUserRow = MainTenantUserRow;

type UserManagementTableProps = {
  users: MainUserRow[];
  currentUserId: string | null;
  busyUserId: string | null;
  regenerating: boolean;
  resetting: boolean;
  page: number;
  totalPages: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  onEdit: (user: MainUserRow) => void;
  onGenerateActivation: (user: MainUserRow) => void;
  onResetPassword: (user: MainUserRow) => void;
  onDelete: (user: MainUserRow) => void;
  onPageChange: (page: number) => void;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function UserManagementTable({
  users,
  currentUserId,
  busyUserId,
  regenerating,
  resetting,
  page,
  totalPages,
  total,
  canPrev,
  canNext,
  onEdit,
  onGenerateActivation,
  onResetPassword,
  onDelete,
  onPageChange,
}: UserManagementTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.username ?? "—"}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">SUPERADMIN</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.status === "ACTIVE"
                      ? "default"
                      : user.status === "PENDING"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>{user.totpEnabled ? "On" : "Off"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(user.lastLoginAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(user)}
                    aria-label={`Edit ${user.firstName} ${user.lastName}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {user.status === "PENDING" || !user.totpEnabled ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyUserId === user.id || regenerating}
                      onClick={() => onGenerateActivation(user)}
                      aria-label={`Regenerate activation link for ${user.firstName} ${user.lastName}`}
                    >
                      <Link2 className="size-4" />
                    </Button>
                  ) : null}
                  {currentUserId !== user.id ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={
                        busyUserId === user.id ||
                        resetting ||
                        (user.status !== "ACTIVE" && user.status !== "LOCKED")
                      }
                      onClick={() => onResetPassword(user)}
                      aria-label={`Reset password for ${user.firstName} ${user.lastName}`}
                    >
                      <KeyRound className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(user)}
                    aria-label={`Delete ${user.firstName} ${user.lastName}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages} · {total} user{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canPrev}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canNext}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
