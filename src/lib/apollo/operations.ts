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
  MainTenantUserActivationLinkDocument as MAIN_TENANT_USER_ACTIVATION_LINK,
  PlatformDashboardDocument as PLATFORM_DASHBOARD_QUERY,
  TenantDashboardDocument as TENANT_DASHBOARD_QUERY,
  SubTenantsDocument as SUB_TENANTS_QUERY,
  CreateSubTenantDocument as CREATE_SUB_TENANT,
  UpdateSubTenantDocument as UPDATE_SUB_TENANT,
  StartTenantDomainVerificationDocument as START_TENANT_DOMAIN_VERIFICATION,
  CheckTenantDomainVerificationDocument as CHECK_TENANT_DOMAIN_VERIFICATION,
  ActivateTenantDomainDocument as ACTIVATE_TENANT_DOMAIN,
  SetSubTenantStatusDocument as SET_SUB_TENANT_STATUS,
  CreateAdminUserDocument as CREATE_ADMIN_USER,
  ManagedSubTenantUsersDocument as MANAGED_SUB_TENANT_USERS_QUERY,
  SubTenantUserActivationLinkDocument as SUB_TENANT_USER_ACTIVATION_LINK_QUERY,
  RegenerateSubTenantUserActivationLinkDocument as REGENERATE_SUB_TENANT_USER_ACTIVATION_LINK,
  LogoutDocument as LOGOUT_MUTATION,
} from "@/lib/apollo/generated/graphql";
