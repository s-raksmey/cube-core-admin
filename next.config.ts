import type { NextConfig } from "next";

const graphqlServerUrl = new URL(
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER_URL ?? "http://localhost:4000/graphql",
);
const storageServerUrl = graphqlServerUrl.toString().replace(/\/graphql\/?$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: graphqlServerUrl.protocol.replace(":", "") as "http" | "https",
        hostname: graphqlServerUrl.hostname,
        port: graphqlServerUrl.port,
        pathname: "/storage/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/main-assets/:path*",
        destination: `${storageServerUrl}/storage/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
