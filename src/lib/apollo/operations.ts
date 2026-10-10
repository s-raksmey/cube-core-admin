/**
 * Apollo document exports for hooks.
 * Sources: `src/graphql/*.gql` → `npm run graphql:codegen`
 */
export {
  CurrentUserDocument as CURRENT_USER_QUERY,
  MainTenantUsersDocument as MAIN_TENANT_USERS_QUERY,
  CreateMainTenantUserDocument as CREATE_MAIN_TENANT_USER,
  UpdateMainTenantUserDocument as UPDATE_MAIN_TENANT_USER,
  DeleteMainTenantUserDocument as DELETE_MAIN_TENANT_USER,
  GenerateMainTenantUserPasswordResetLinkDocument as GENERATE_MAIN_TENANT_USER_PASSWORD_RESET,
  GenerateMainTenantUserActivationLinkDocument as GENERATE_MAIN_TENANT_USER_ACTIVATION,
  PlatformDashboardDocument as PLATFORM_DASHBOARD_QUERY,
  TenantDashboardDocument as TENANT_DASHBOARD_QUERY,
  SubTenantsDocument as SUB_TENANTS_QUERY,
  CreateSubTenantDocument as CREATE_SUB_TENANT,
  SetSubTenantStatusDocument as SET_SUB_TENANT_STATUS,
  CreateAdminUserDocument as CREATE_ADMIN_USER,
  LoginDocument as LOGIN_MUTATION,
  VerifyLoginTotpDocument as VERIFY_LOGIN_TOTP,
  VerifyTotpEnrollmentDocument as VERIFY_TOTP_ENROLLMENT,
  VerifyRecoveryCodeDocument as VERIFY_RECOVERY_CODE,
  LogoutDocument as LOGOUT_MUTATION,
} from "@/lib/apollo/generated/graphql";
