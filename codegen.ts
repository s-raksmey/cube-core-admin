import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * Documents: `src/graphql/*.gql`
 * Generated Apollo artifacts: `src/lib/apollo/generated/`
 * After server SDL or admin documents change: `npm run graphql:codegen`
 */
const config: CodegenConfig = {
  schema: "../cube-core-server/src/graphql/schema.graphql",
  documents: ["src/graphql/**/*.gql"],
  ignoreNoDocuments: true,
  generates: {
    "src/lib/apollo/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        enumsAsTypes: true,
        skipTypename: true,
      },
    },
  },
};

export default config;
