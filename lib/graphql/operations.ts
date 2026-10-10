import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      fullName
      type
      role
      tenantId
      tenant {
        id
        name
        slug
        type
        status
      }
    }
  }
`;

export const MAIN_TENANT_USERS_QUERY = gql`
  query MainTenantUsers($search: String, $page: Int, $pageSize: Int) {
    mainTenantUsers(search: $search, page: $page, pageSize: $pageSize) {
      items {
        id
        email
        username
        firstName
        lastName
        fullName
        type
        role
        status
        createdAt
        lastLoginAt
        totpEnabled
        tenant {
          id
          name
          slug
          type
        }
      }
      total
      page
      pageSize
    }
  }
`;

export const CREATE_MAIN_TENANT_USER = gql`
  mutation CreateMainTenantUser(
    $firstName: String!
    $lastName: String!
    $email: String!
  ) {
    createMainTenantUser(
      firstName: $firstName
      lastName: $lastName
      email: $email
    ) {
      user {
        id
        email
        firstName
        lastName
        fullName
        role
        status
        createdAt
      }
      activationUrl
      expiresAt
    }
  }
`;

export const UPDATE_MAIN_TENANT_USER = gql`
  mutation UpdateMainTenantUser($id: ID!, $input: UpdateMainTenantUserInput!) {
    updateMainTenantUser(id: $id, input: $input) {
      id
      email
      firstName
      lastName
      fullName
      role
      status
      createdAt
      lastLoginAt
      totpEnabled
    }
  }
`;

export const DELETE_MAIN_TENANT_USER = gql`
  mutation DeleteMainTenantUser($id: ID!) {
    deleteMainTenantUser(id: $id)
  }
`;

export const GENERATE_MAIN_TENANT_USER_PASSWORD_RESET = gql`
  mutation GenerateMainTenantUserPasswordResetLink($userId: ID!) {
    generateMainTenantUserPasswordResetLink(userId: $userId) {
      resetUrl
      expiresAt
      user {
        id
        email
        fullName
      }
    }
  }
`;

export const PLATFORM_DASHBOARD_QUERY = gql`
  query PlatformDashboard {
    platformDashboard {
      totalSubTenants
      activeSubTenants
      totalAdmins
      platformHealth
      growthByMonth {
        month
        count
      }
      statusDistribution {
        status
        count
      }
      recentSubTenants {
        id
        name
        slug
        status
        createdAt
      }
      recentActivity {
        id
        action
        createdAt
        actorEmail
        targetTenantName
        targetTenantSlug
      }
    }
  }
`;

export const TENANT_DASHBOARD_QUERY = gql`
  query TenantDashboard {
    tenantDashboard {
      tenant {
        id
        name
        slug
        status
      }
      totalUsers
      activeUsers
      publishedContent
      mediaStorageBytes
      contentActivityByMonth {
        month
        count
      }
      contentByStatus {
        status
        count
      }
      recentUsers {
        id
        email
        fullName
        role
        status
      }
      recentActivity {
        id
        action
        createdAt
        actorEmail
        targetTenantName
        targetTenantSlug
      }
    }
  }
`;

export const SUB_TENANTS_QUERY = gql`
  query SubTenants($search: String, $page: Int, $pageSize: Int) {
    subTenants(search: $search, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        slug
        status
        createdAt
      }
      total
      page
      pageSize
    }
  }
`;

export const CREATE_SUB_TENANT = gql`
  mutation CreateSubTenant($name: String!, $slug: String!) {
    createSubTenant(name: $name, slug: $slug) {
      id
      name
      slug
      status
    }
  }
`;

export const SET_SUB_TENANT_STATUS = gql`
  mutation SetSubTenantStatus($tenantId: ID!, $status: TenantStatus!) {
    setSubTenantStatus(tenantId: $tenantId, status: $status) {
      id
      status
    }
  }
`;

export const CREATE_ADMIN_USER = gql`
  mutation CreateAdminUser(
    $email: String!
    $firstName: String!
    $lastName: String!
    $tenantId: ID!
    $role: SubTenantRole = ADMIN
  ) {
    createAdminUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      tenantId: $tenantId
      role: $role
    ) {
      user {
        id
        email
        firstName
        lastName
        fullName
        type
        role
        status
      }
      activationUrl
      expiresAt
    }
  }
`;

export const GENERATE_MAIN_TENANT_USER_ACTIVATION = gql`
  mutation GenerateMainTenantUserActivationLink($userId: ID!) {
    generateMainTenantUserActivationLink(userId: $userId) {
      activationUrl
      expiresAt
      user {
        id
        email
        fullName
      }
    }
  }
`;
