import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
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
        role
        status
        createdAt
      }
      recentActivity {
        id
        action
        createdAt
        actorEmail
      }
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
      createdAt
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
    $password: String!
    $tenantId: ID!
  ) {
    createAdminUser(email: $email, password: $password, tenantId: $tenantId) {
      id
      email
      role
      tenantId
    }
  }
`;
