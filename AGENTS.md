<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cube Core GraphQL field-selection rule

- In `src/graphql/*.gql`, request only fields the current screen/action consumes. Avoid broad “just in case” selections.
- GraphQL limits response fields, but does not automatically limit Prisma/database reads. When a feature needs server changes, use explicit Prisma `select` projections; avoid full-model `include: true` on list paths.
- Never retrieve credentials for display/list work (password hashes, TOTP secrets, recovery codes). Select only `enabledAt` to show whether 2FA is enabled.
- Keep authorization and tenant scoping enforced by the server regardless of requested fields; omitted fields are not access control.
- Keep pagination bounded. After SDL/operation changes, run `npm run graphql:codegen` and inspect generated operation types.
- Follow `cube-core-server/docs/ARCHITECTURE.md` → “GraphQL field selection and data efficiency”.

## Frontend architecture

Use this structure for every new or changed Main Tenant feature:

- `src/app`: routes, layouts, and route-level composition only. Do not place feature data access, mutation handlers, or large UI blocks here.
- `src/components`: presentational UI and page composition. Components receive data and callbacks through props. A component may query only when it is the session gate that establishes the authenticated console user.
- `src/hooks`: Apollo queries, mutations, dynamic feature state, permission-aware actions, and browser synchronization such as branding refresh events.
- `src/types`: shared feature contracts used by more than one component or hook. Keep component-private prop types in their component file.
- `src/lib`: Apollo infrastructure, pure utilities, and framework integration. Do not put React state or JSX here.

Keep Main Tenant responsibilities limited to platform SuperAdmin work: tenants, Main Tenant users, global role permissions, platform branding, audit, and health. Do not add sub-tenant Admin or Editor behavior to this project.

Before adding a new component, reuse an existing UI primitive, table, dialog, page header, permission hook, or branding hook when it fits. Split a feature when it combines data access, domain actions, and UI; do not create one-use wrapper files that only forward props.

Run `npm run typecheck`, `npm run lint`, and `git diff --check` after frontend changes. Run a production build when a route, Apollo boundary, or framework behavior changes.
