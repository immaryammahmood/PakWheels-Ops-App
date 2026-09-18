# Development plan

| Phase | Scope | Status |
| --- | --- | --- |
| Phase 0 | Discovery / Gap Analysis | COMPLETE |
| Phase 1 | Foundation | IN PROGRESS |
| Phase 2 | Core Operations | PLANNED |
| Phase 3 | Android Staff Workflow | PLANNED |
| Phase 4 | Supervisor Workflow | PLANNED |
| Phase 5 | Admin Portal / Reports / Operations | PLANNED |
| Phase 6 | Controlled Pilot / Release Candidate | PLANNED |

## Phase 1 — Foundation boundary and progress

Phase 1 includes project structure, the local development environment, secure configuration, NestJS/API foundation, PostgreSQL data foundation, database schema/migrations, authentication/session foundation, RBAC, branch scope, audit foundation, API contract, and CI / quality/security gates. These foundation items must be established before Phase 2 begins.

| Foundation subphase | Scope | Status |
| --- | --- | --- |
| Phase 1A | Project Structure / Foundation | COMPLETE |
| Phase 1B | Development Toolchain | COMPLETE |
| Phase 1C | NestJS Backend Foundation | PASS — COMPLETE |
| Phase 1D | PostgreSQL Data Foundation | PLANNING PENDING — next controlled activity |

Phase 1A–1C completion does not mean Phase 1 as a whole is complete. Authentication/session foundation, RBAC, branch scope, audit foundation, and remaining API contract and quality/security gates remain Phase 1 work. Subsequent Foundation subphase labels and detailed implementation scopes are not assigned by this documentation correction. Phase 1D remains data-foundation planning only; no implementation is authorized here.

## Phase 2 — Core Operations boundary

Phase 2 includes branches, employees, task types, schedules, task generation, assignments, timing rules, QR locations, and task lifecycle. It begins only after the Phase 1 foundation items above are established. Phase 1 provides the schema and authorization/branch-scope foundations; Phase 2 implements the core operational workflows that use them.

## BRD traceability

**BRD TRACEABILITY: PARTIAL / BLOCKED PENDING AUTHORITATIVE BRD**

The complete authoritative BRD is not available in the workspace. This phase sequence follows the project owner's supplied authoritative Master Prompt boundaries; it does not invent BRD requirement IDs or acceptance criteria. See [Requirements traceability](traceability.md).

## Phase 1A boundary

Create only the authorized directories and foundation text files inside `/opt/pakwheels-tasktrack`. No application business logic, migrations, credentials, certificates, Git initialization, toolchain installation, package manager execution, networking changes, services, or deployment are included.

The Phase 1A boundary above records its original scope. Phase 1B toolchain setup was subsequently authorized and verified by the project owner.

## Phase 1B — Development Toolchain: COMPLETE

Closed on 2026-09-16 against the project owner's final verified evidence, recorded in [Toolchain](toolchain.md). Docker Engine 29.8.0 and Docker Compose v5.5.1 are installed; Docker is active and enabled. Node.js v24.19.0, npm 11.17.0 and npx 11.17.0 are verified. The previous npm/npx PATH blocker is resolved.

Java/JDK and Android SDK are deferred. No TaskTrack containers exist yet; the PostgreSQL application container has not been started, and NGINX is not installed. Toolchain completion does not mean any application, database schema, authentication, QR, evidence workflow or deployment is implemented.

## Phase 1C — NestJS Backend Foundation: PASS — COMPLETE

Closed 2026-09-16 following successful TypeScript, unit, integration, production/full audit and compiled loopback-runtime validation. See [Backend foundation close-out](backend-foundation.md) for exact versions, configuration, safe error/request-ID/logging behavior, test counts and runtime evidence. The test server was stopped; no API listener remains.

Rate limiting remains **PLANNED / REQUIRED — NOT IMPLEMENTED**, required before security foundation completion and before sensitive endpoints operate. PostgreSQL, authentication, RBAC, business modules, Android, Admin Portal and deployment remain unimplemented. Complete BRD traceability remains unresolved.

## Next controlled activity — Phase 1D plan only

1. Review the available BRD/Master Prompt and settle data ownership, required entities and constraints before naming tables or acceptance mappings. Reconcile the old environment template in a separately authorized configuration change.
2. Propose a stable PostgreSQL version and supported NestJS 12/Node 24 persistence and migration tooling. Review security, compatibility, least-privilege database roles, private connectivity, secret provisioning, UTC timestamps, backups and restore procedures. No installation or database startup in this closure.
3. Prepare a reviewable schema/migration design from confirmed requirements, including relationships, constraints, indexes and migration rollback strategy. After separate approval, implement and validate on an isolated development database, including forward migration, rollback and restore checks.
4. Plan authentication/session storage and revocation, then RBAC and branch-scope enforcement. Select supported password hashing and rate limiting before sensitive endpoints operate. Android never receives database credentials or direct database access.
5. Plan durable security audit records with server UTC timestamps and correlation IDs, defined sensitive-data exclusions, access controls and retention. HTTP access logs do not satisfy this requirement by themselves.

Review the data-foundation proposal and its validation/rollback plan before implementing Phase 1D. Authentication/session foundation, RBAC, branch scope and audit foundation remain required Phase 1 work; their implementation is outside the current Phase 1D planning activity and requires separate authorization. No database schema, migrations, secrets, services or network changes are created by this plan. This documentation correction does not resume Phase 1D planning automatically; that is the next controlled step.
