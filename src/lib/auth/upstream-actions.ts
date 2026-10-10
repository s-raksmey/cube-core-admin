"use server";

import {
  validateActivationTokenAction,
  completeActivationAction,
  completeActivationTotpAction,
  validatePasswordResetTokenAction,
  completePasswordResetAction,
} from "@/lib/auth/session-actions";

export async function validateActivationToken(token: string) {
  return validateActivationTokenAction(token);
}

export async function completeActivation(
  ...args: Parameters<typeof completeActivationAction>
) {
  return completeActivationAction(...args);
}

export async function activateTotp(
  ...args: Parameters<typeof completeActivationTotpAction>
) {
  return completeActivationTotpAction(...args);
}

export async function validatePasswordResetToken(token: string) {
  return validatePasswordResetTokenAction(token);
}

export async function completePasswordReset(
  ...args: Parameters<typeof completePasswordResetAction>
) {
  return completePasswordResetAction(...args);
}
