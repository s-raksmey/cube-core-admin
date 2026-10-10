/**
 * Apollo operation / schema types.
 * Sources: `src/graphql/*.gql` → `npm run graphql:codegen`
 */
import type { MainTenantUsersQuery } from "@/lib/apollo/generated/graphql";

export type {
  CurrentUserQuery,
  CurrentUserQueryVariables,
  MainTenantUsersQuery,
  MainTenantUsersQueryVariables,
  CreateMainTenantUserMutation,
  CreateMainTenantUserMutationVariables,
  UpdateMainTenantUserMutation,
  UpdateMainTenantUserMutationVariables,
  DeleteMainTenantUserMutation,
  DeleteMainTenantUserMutationVariables,
  GenerateMainTenantUserPasswordResetLinkMutation,
  GenerateMainTenantUserPasswordResetLinkMutationVariables,
  GenerateMainTenantUserActivationLinkMutation,
  GenerateMainTenantUserActivationLinkMutationVariables,
  PlatformDashboardQuery,
  TenantDashboardQuery,
  SubTenantsQuery,
  CreateSubTenantMutation,
  SetSubTenantStatusMutation,
  CreateAdminUserMutation,
  LoginMutation,
  VerifyLoginTotpMutation,
  VerifyTotpEnrollmentMutation,
  VerifyRecoveryCodeMutation,
  UserStatus,
  UpdateMainTenantUserInput,
} from "@/lib/apollo/generated/graphql";

/** One row from `mainTenantUsers`. */
export type MainTenantUserRow =
  MainTenantUsersQuery["mainTenantUsers"]["items"][number];
