"use client";

import { useState } from "react";
import type { MainTenantUserRow } from "@/lib/apollo/types";

export type MainUserLinkResult = { url: string; expiresAt: string; label: string };

/** Groups dialog and form state for the Main Tenant user-management workflow. */
export function useMainUserDialogState() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [editUser, setEditUser] = useState<MainTenantUserRow | null>(null);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MainTenantUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<MainTenantUserRow | null>(null);
  const [activationTarget, setActivationTarget] = useState<MainTenantUserRow | null>(null);
  const [activationResetMode, setActivationResetMode] = useState(false);
  const [activationLinkUser, setActivationLinkUser] = useState<MainTenantUserRow | null>(null);
  const [activationLinkUnavailable, setActivationLinkUnavailable] = useState(false);
  const [activationLookupFailed, setActivationLookupFailed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<MainUserLinkResult | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  function openCreate() {
    setFirstName(""); setLastName(""); setEmail(""); setFormError(null); setCreateConfirmOpen(false); setCreateOpen(true);
  }
  function openEdit(user: MainTenantUserRow) {
    setEditUser(user); setFirstName(user.firstName ?? ""); setLastName(user.lastName ?? ""); setEmail(user.email); setStatus(user.membershipStatus === "DISABLED" ? "INACTIVE" : "ACTIVE"); setFormError(null); setEditConfirmOpen(false);
  }
  function requestCreate() { setFormError(null); setCreateOpen(false); setCreateConfirmOpen(true); }
  function requestUpdate() { setFormError(null); setEditConfirmOpen(true); }
  return { createOpen, setCreateOpen, createConfirmOpen, setCreateConfirmOpen, editUser, setEditUser, editConfirmOpen, setEditConfirmOpen, deleteTarget, setDeleteTarget, resetTarget, setResetTarget, activationTarget, setActivationTarget, activationResetMode, setActivationResetMode, activationLinkUser, setActivationLinkUser, activationLinkUnavailable, setActivationLinkUnavailable, activationLookupFailed, setActivationLookupFailed, firstName, setFirstName, lastName, setLastName, email, setEmail, status, setStatus, formError, setFormError, linkResult, setLinkResult, busyUserId, setBusyUserId, openCreate, openEdit, requestCreate, requestUpdate };
}
