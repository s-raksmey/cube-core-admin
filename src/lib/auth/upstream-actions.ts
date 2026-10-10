"use server";

import { authServerBaseUrl } from "@/lib/auth/console";

type GraphqlPayload = Record<string, unknown> & { error?: string };

async function serverGraphql<TData extends Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; payload: GraphqlPayload }> {
  const response = await fetch(`${authServerBaseUrl()}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await response.json()) as {
    data?: TData;
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    return {
      ok: false,
      status: response.status >= 400 ? response.status : 400,
      payload: { error: json.errors[0]?.message ?? "Request failed" },
    };
  }

  const data = json.data;
  if (!data) {
    return {
      ok: false,
      status: 500,
      payload: { error: "Empty GraphQL response" },
    };
  }

  const values = Object.values(data);
  const payload = (values[0] ?? {}) as GraphqlPayload;
  return { ok: true, status: 200, payload };
}

export async function validateActivationToken(token: string) {
  return serverGraphql(
    `query ValidateActivationToken($token: String!) {
      validateActivationToken(token: $token) {
        valid
        expiresAt
        email
        firstName
        lastName
        needsActivation
      }
    }`,
    { token },
  );
}

export async function completeActivation(body: Record<string, unknown>) {
  return serverGraphql(
    `mutation CompleteActivation(
      $token: String!
      $username: String!
      $password: String!
      $confirmPassword: String!
    ) {
      completeActivation(
        token: $token
        username: $username
        password: $password
        confirmPassword: $confirmPassword
      ) {
        nextStep
        challengeToken
        qrCodeDataUrl
        manualEntryKey
        email
        username
        activationToken
      }
    }`,
    body,
  );
}

export async function activateTotp(body: Record<string, unknown>) {
  return serverGraphql(
    `mutation CompleteActivationTotp(
      $challengeToken: String!
      $code: String!
      $activationToken: String!
    ) {
      completeActivationTotp(
        challengeToken: $challengeToken
        code: $code
        activationToken: $activationToken
      ) {
        success
        recoveryCodes
        user {
          id
          email
        }
      }
    }`,
    body,
  );
}

export async function validatePasswordResetToken(token: string) {
  return serverGraphql(
    `query ValidatePasswordResetToken($token: String!) {
      validatePasswordResetToken(token: $token) {
        valid
        expiresAt
      }
    }`,
    { token },
  );
}

export async function completePasswordReset(body: Record<string, unknown>) {
  return serverGraphql(
    `mutation CompletePasswordReset(
      $token: String!
      $firstName: String
      $lastName: String
      $fullName: String
      $password: String!
      $confirmPassword: String!
    ) {
      completePasswordReset(
        token: $token
        firstName: $firstName
        lastName: $lastName
        fullName: $fullName
        password: $password
        confirmPassword: $confirmPassword
      ) {
        success
      }
    }`,
    body,
  );
}
