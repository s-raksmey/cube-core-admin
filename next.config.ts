import type { NextConfig } from "next";

const graphqlDestination =
  process.env.GRAPHQL_SERVER_URL ?? "http://localhost:4000/graphql";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/graphql",
        destination: graphqlDestination,
      },
    ];
  },
};

export default nextConfig;
