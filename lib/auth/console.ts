export type ConsoleAudience = "ADMIN_CONSOLE" | "TENANT_APP";

export const REFRESH_COOKIE = "management_console_admin_session";
export const ACCESS_COOKIE = "management_console_admin_access";

export function authServerBaseUrl() {
  const base =
    process.env.AUTH_SERVER_URL ??
    process.env.GRAPHQL_SERVER_URL?.replace(/\/api\/graphql\/?$/, "") ??
    "http://localhost:4000";
  return base.replace(/\/$/, "");
}

export const ADMIN_AUDIENCE: ConsoleAudience = "ADMIN_CONSOLE";
