"use server";

import { type TypedDocumentNode } from "@apollo/client";
import { print } from "graphql";
import { ADMIN_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import {
  CompleteActivationDocument,
  CompleteActivationTotpDocument,
  CompletePasswordResetDocument,
  LoginDocument,
  ValidateActivationTokenDocument,
  ValidatePasswordResetTokenDocument,
  VerifyLoginTotpDocument,
  VerifyRecoveryCodeDocument,
  VerifyTotpEnrollmentDocument,
} from "@/lib/apollo/generated/graphql";
import type {
  CompleteActivationMutationVariables,
  CompleteActivationTotpMutationVariables,
  CompletePasswordResetMutationVariables,
  LoginMutationVariables,
  ValidateActivationTokenQueryVariables,
  ValidatePasswordResetTokenQueryVariables,
  VerifyLoginTotpMutationVariables,
  VerifyRecoveryCodeMutationVariables,
  VerifyTotpEnrollmentMutationVariables,
} from "@/lib/apollo/generated/graphql";
import {
  clearAuthCookiesOnStore,
  setAuthCookiesOnStore,
} from "@/lib/auth/cookies";

type GraphqlResponse<TData> = {
  data?: TData;
  errors?: { message: string }[];
};

async function requestGraphql<
  TData extends Record<string, unknown>,
  TVariables extends Record<string, unknown>,
>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
): Promise<TData> {
  const response = await fetch(`${authServerBaseUrl()}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cube-auth-action-secret": process.env.ADMIN_AUTH_ACTION_SECRET ?? "",
    },
    body: JSON.stringify({ query: print(document), variables }),
    cache: "no-store",
  });
  const json = (await response.json()) as GraphqlResponse<TData>;
  if (!response.ok || json.errors?.length || !json.data) {
    throw new Error(json.errors?.[0]?.message ?? "GraphQL request failed");
  }
  return json.data;
}

function actionError(error: unknown) {
  return error instanceof Error ? error.message : "Authentication request failed";
}

export async function loginAdmin(
  input: Omit<LoginMutationVariables, "audience">,
) {
  try {
    const data = await requestGraphql(LoginDocument, {
      ...input,
      audience: ADMIN_AUDIENCE,
    });
    if (!("challengeToken" in data.login)) {
      throw new Error("Unexpected login response");
    }
    return {
      ok: true as const,
      challengeToken: data.login.challengeToken,
      nextStep: data.login.nextStep,
      qrCodeDataUrl: data.login.qrCodeDataUrl,
      manualEntryKey: data.login.manualEntryKey,
    };
  } catch (error) {
    return { ok: false as const, error: actionError(error) };
  }
}

async function completeAdminLogin(accessToken: string, refreshToken: string) {
  await setAuthCookiesOnStore({
    audience: ADMIN_AUDIENCE,
    accessToken,
    refreshToken,
  });
  return { ok: true as const };
}

export async function verifyAdminLoginTotp(
  variables: VerifyLoginTotpMutationVariables,
) {
  try {
    const { verifyLoginTotp } = await requestGraphql(
      VerifyLoginTotpDocument,
      variables,
    );
    return completeAdminLogin(
      verifyLoginTotp.accessToken,
      verifyLoginTotp.refreshToken,
    );
  } catch (error) {
    return { ok: false as const, error: actionError(error) };
  }
}

export async function verifyAdminTotpEnrollment(
  variables: VerifyTotpEnrollmentMutationVariables,
) {
  try {
    const { verifyTotpEnrollment } = await requestGraphql(
      VerifyTotpEnrollmentDocument,
      variables,
    );
    return completeAdminLogin(
      verifyTotpEnrollment.accessToken,
      verifyTotpEnrollment.refreshToken,
    );
  } catch (error) {
    return { ok: false as const, error: actionError(error) };
  }
}

export async function verifyAdminRecoveryCode(
  variables: VerifyRecoveryCodeMutationVariables,
) {
  try {
    const { verifyRecoveryCode } = await requestGraphql(
      VerifyRecoveryCodeDocument,
      variables,
    );
    return completeAdminLogin(
      verifyRecoveryCode.accessToken,
      verifyRecoveryCode.refreshToken,
    );
  } catch (error) {
    return { ok: false as const, error: actionError(error) };
  }
}

export async function validateActivationTokenAction(
  token: string,
) {
  try {
    const variables: ValidateActivationTokenQueryVariables = { token };
    const data = await requestGraphql(ValidateActivationTokenDocument, variables);
    return { ok: true as const, status: 200, payload: data.validateActivationToken };
  } catch (error) {
    return { ok: false as const, status: 400, payload: { error: actionError(error) } };
  }
}

export async function completeActivationAction(
  variables: CompleteActivationMutationVariables,
) {
  try {
    const data = await requestGraphql(CompleteActivationDocument, variables);
    return { ok: true as const, status: 200, payload: data.completeActivation };
  } catch (error) {
    return { ok: false as const, status: 400, payload: { error: actionError(error) } };
  }
}

export async function completeActivationTotpAction(
  variables: CompleteActivationTotpMutationVariables,
) {
  try {
    const data = await requestGraphql(CompleteActivationTotpDocument, variables);
    return { ok: true as const, status: 200, payload: data.completeActivationTotp };
  } catch (error) {
    return { ok: false as const, status: 400, payload: { error: actionError(error) } };
  }
}

export async function validatePasswordResetTokenAction(
  token: string,
) {
  try {
    const variables: ValidatePasswordResetTokenQueryVariables = { token };
    const data = await requestGraphql(ValidatePasswordResetTokenDocument, variables);
    return { ok: true as const, status: 200, payload: data.validatePasswordResetToken };
  } catch (error) {
    return { ok: false as const, status: 400, payload: { error: actionError(error) } };
  }
}

export async function completePasswordResetAction(
  variables: CompletePasswordResetMutationVariables,
) {
  try {
    const data = await requestGraphql(CompletePasswordResetDocument, variables);
    return { ok: true as const, status: 200, payload: data.completePasswordReset };
  } catch (error) {
    return { ok: false as const, status: 400, payload: { error: actionError(error) } };
  }
}

/** Clear the active admin session cookies. */
export async function clearAdminSession() {
  await clearAuthCookiesOnStore(ADMIN_AUDIENCE);
}
