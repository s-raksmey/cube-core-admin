/**
 * Apollo operation / schema types.
 * Sources: `src/graphql/*.gql` → `npm run graphql:codegen`
 */
import type {
  MainTenantUsersQuery,
  SubTenantsQuery,
} from "@/lib/apollo/generated/graphql";

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
  MainTenantUserActivationLinkQuery,
  MainTenantUserActivationLinkQueryVariables,
  PlatformAuditLogsQuery,
  SubTenantsQuery,
  SubTenantsQueryVariables,
  CreateSubTenantMutation,
  CreateSubTenantMutationVariables,
  UpdateSubTenantMutation,
  UpdateSubTenantMutationVariables,
  SetSubTenantStatusMutation,
  SetSubTenantStatusMutationVariables,
  CreateAdminUserMutation,
  CreateAdminUserMutationVariables,
  ManagedSubTenantUsersQuery,
  ManagedSubTenantUsersQueryVariables,
  SubTenantUserActivationLinkQuery,
  SubTenantUserActivationLinkQueryVariables,
  RegenerateSubTenantUserActivationLinkMutation,
  RegenerateSubTenantUserActivationLinkMutationVariables,
  ActivationStatus,
  LoginMutation,
  VerifyLoginTotpMutation,
  VerifyTotpEnrollmentMutation,
  VerifyRecoveryCodeMutation,
  UserStatus,
  UpdateMainTenantUserInput,
  MainConsoleUserPermissionsQuery,
} from "@/lib/apollo/generated/graphql";

/** One row from `mainTenantUsers`. */
export type MainTenantUserRow =
  MainTenantUsersQuery["mainTenantUsers"]["items"][number];

export type SubTenantRow = SubTenantsQuery["subTenants"]["items"][number];
