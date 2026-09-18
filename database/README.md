# Phase 1D identity and scope foundation

Step 7 creates schema source only. **Live SQL validation: NOT RUN — BLOCKED BY POSTGRESQL RUNTIME GATE.** No migration or seeds have been executed. Docker access remains blocked; image vulnerability classification is deferred until before Phase 1 security closure/pilot/release.

The current Step 7 owner instruction authorizes this scope and supersedes the planning-only status in older repository documents. A separate approved Phase 1D plan and complete authoritative Master Prompt/BRD are not present in this workspace. BRD traceability remains **PARTIAL / BLOCKED PENDING AUTHORITATIVE BRD**; the choices below are provisional where business semantics are unavailable.

## Ownership and relationships

| Table | Purpose and ownership |
| --- | --- |
| organizations | Independent organization roots; stable code and name. |
| branches | Organization-owned branches; code unique within organization. |
| users | Organization-owned identity; username and/or employee identifier plus display name. |
| roles | Organization-owned role definitions, without predefined role records or UI behavior. |
| permissions | Global backend permission vocabulary, independent of roles; no values seeded. |
| role_permissions | Unique role/permission mapping; organization ownership derives from the role. |
| user_role_assignments | Explicit organization-wide or branch-scoped role grants to users in the same organization. |
| user_branch_assignments | User membership in branches of the same organization. |

All primary keys are UUIDs without defaults. The future backend must generate authoritative random UUIDs; clients do not choose authoritative IDs. No PostgreSQL extension is required. Composite `(organization_id, id)` candidate keys and foreign keys prevent cross-organization user, role and branch assignments. All foreign keys use `ON DELETE RESTRICT`; there are no cascading deletions.

## Identity and scope rules

Codes and identity identifiers must be nonempty and have no surrounding ASCII spaces (`btrim`). Unique expression indexes use `lower` for case-insensitive comparison under the database collation. Organization/permission codes are globally unique; branch/role codes and each user identifier are unique within their organization, including deactivated records. Display names need only be nonblank.

Both `username` and `employee_identifier` are optional individually, but at least one is required. They are separate namespaces: no combined login lookup is defined. Confirm the actual login selector, employee-number format, Unicode normalization/collation policy and identifier reuse policy against the BRD before implementing authentication. There is no password column or authentication behavior.

`scope_type = 'organization'` requires a null branch; `scope_type = 'branch'` requires a branch in the same organization. Organization scope never grants cross-organization authority. Any later System/HO role spanning organizations needs explicit grants per organization or a separately reviewed model. Branch membership and role grants are independent facts; whether branch grants also require current membership remains a BRD/backend authorization decision.

Assignments use half-open effective intervals `[effective_from, effective_until)`, with a null end meaning unbounded. End dates must be later than start dates. Partial unique indexes prevent duplicate unbounded assignments for the same user/role/scope or user/branch; separate organization/branch indexes avoid NULL uniqueness ambiguity. These indexes do **not** prevent overlapping bounded intervals or determine current authorization. Later write services must serialize changes per user in a transaction, validate interval overlaps, close old assignments and insert new rows. Later authorization must check effective dates and deactivation of all relevant identities using server time. No time-dependent partial index or cross-table CHECK is used.

## Retention, time and concurrency

Organizations, branches, users and roles are active when `deactivated_at IS NULL`. Set this server timestamp for deactivation instead of deleting rows. Historical references and identifier reservations remain intact. Assignment changes retain old rows by closing their effective intervals. No automatic physical deletion is defined. Foreign keys protect references, but these tables alone do not provide an immutable audit log or prevent every privileged deletion; audit and least-privilege database grants remain later controlled work. Role-permission mapping history also belongs to the later audit foundation.

Real instants use `timestamptz`; insertion defaults use database `CURRENT_TIMESTAMP`. The runner sets UTC; Asia/Karachi is for display/schedule interpretation. Mutable records carry a positive `revision` starting at 1. Future backend updates must atomically match the expected revision, increment it and set `updated_at = CURRENT_TIMESTAMP`; defaults do not automatically update these fields. Role-permission pairs are immutable links with a creation timestamp.

Indexes cover normalized identity/code lookups, active users, mapping pairs, assignment user/scope/history lookups and foreign-key child lookups. Existing composite indexes cover leading organization keys; reverse role/branch/permission indexes cover the remaining relationships.

## Migration operation

Use zero-padded sequential numbers: `0001_identity_scope_foundation.sql`, then `0002_<description>.sql`, with unique increasing prefixes. SQL files use node-pg-migrate's `-- Up Migration` and `-- Down Migration` markers. Never change a migration after it has been applied. There are no seeds, extensions, operational/task tables, secrets or automatic migration startup.

The existing `apps/api/scripts/migrate.mjs` discovers this directory and supplies transaction/order/advisory-lock controls. Only an explicitly authorized future `up` invocation may connect. Do not invoke the runner, including dry-run mode, while the PostgreSQL runtime gate is blocked. Offline discovery can import the runner's directory and use the installed library's `getMigrationFilePaths` and `loadMigrationUnits` with no database connection; loader checks are not PostgreSQL SQL execution or syntax validation.

The down section deliberately raises an exception rather than deleting retained identity/history. Recovery requires a separately reviewed forward repair or backup/restore plan, tested against an isolated database once runtime is available.

Next minimum implementation: a NestJS DatabaseModule foundation for the existing typed configuration, pool lifecycle and injectable transaction access. It must not auto-run migrations or enable authentication. Live database verification and migration/constraint tests remain required before this schema can be treated as runtime-verified. Authentication/session schema follows its separately approved storage/revocation design.

Architecture remains Android/Admin → NestJS → PostgreSQL, with server-side credentials. PostgreSQL development publication remains configured at `127.0.0.1:5432`, runtime unverified; no network changes are made.

## Step 7 offline verification — 2026-09-17

Static review passed for the eight-table allowlist, absence of seed/credential/destructive SQL, 12 restrictive foreign keys (including five composite assignment references), uniqueness, scope/date/revision checks and whitespace. Installed node-pg-migrate discovery and SQL-section loading passed with SQL captured only in memory. This is not PostgreSQL parsing or constraint execution.

`npm run check` and `npm run check:migrations` passed. Existing unit tests passed (10: seven database-configuration and three foundation); non-database integration tests passed (9). Production and full npm audits each reported zero vulnerabilities. No migration command, PostgreSQL connection or Docker access was attempted. Runtime SQL validation remains blocked.
