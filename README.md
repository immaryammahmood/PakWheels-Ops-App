# PakWheels Housekeeping & Facility Task Management System

Internal LAN-only housekeeping/facility task tracking system.

## Foundation status

Phase 0 discovery and Phase 1A project foundation are complete. **Phase 1B — Development Toolchain: COMPLETE.** Docker Engine 29.8.0, Docker Compose v5.5.1, Node.js v24.19.0, npm 11.17.0 and npx 11.17.0 are verified; the previous npm/npx PATH blocker is resolved. See the [toolchain record](docs/toolchain.md).

**Phase 1C — NestJS Backend Foundation: PASS — COMPLETE.** The API foundation and validation are complete: `/api/v1/health`, safe JSON errors, generated request IDs, structured logging, security headers and local-development OpenAPI. Development binds only to `127.0.0.1`; the verification process is stopped. Both dependency audits reported zero vulnerabilities. See the [Phase 1C close-out](docs/backend-foundation.md).

PostgreSQL, authentication, RBAC, task/QR/evidence workflows, Android and Admin Portal implementation remain future work. Rate limiting is **PLANNED / REQUIRED — NOT IMPLEMENTED**. No TaskTrack containers or application deployment exist; Git has not been initialized. Phase 1D is plan only.

## Major components

1. Android Staff/Supervisor application — `apps/android/`
2. NestJS backend API — `apps/api/`
3. PostgreSQL database — `database/`
4. Next.js Admin Portal — `apps/admin/`
5. NGINX internal reverse proxy — `infrastructure/nginx/`
6. Private photo/video evidence storage — `storage/private/evidence/`

Supporting directories: `deployment/` for future deployment configuration, `docs/` for documentation, `tests/integration/` and `tests/end-to-end/` for automated tests, and `scripts/` for future project utilities. Database migration and seed directories are empty placeholders.

## Confirmed environment

| Setting | Value |
| --- | --- |
| Server hostname | tasktrack-server |
| Operating system | Ubuntu Server 24.04 LTS |
| Server IP | 192.X.X.X/X |
| Network | 192.X.X.X/X |
| Subnet mask | X.X.X.X |
| Gateway | X.X.X.X |
| Timezone | Asia/Karachi |
| Server IP assignment | DHCP reservation / MAC binding |
| Workspace | /opt/pakwheels-tasktrack |

These environment values are user-confirmed, not independently inspected during this phase.

## Required operating boundaries

- The final application must operate only through the PakWheels internal LAN.
- PostgreSQL will never be accessed directly from Android devices.
- Android communicates only with the backend API, through the internal reverse proxy.
- Admin Portal is accessed through the internal reverse proxy.
- Core application operation will not require public internet access.
- Evidence remains private and is available only through authorized application access.
- Production secrets must never be stored in source control.

## Documentation

- [Backend foundation close-out](docs/backend-foundation.md)
- [Architecture](docs/architecture.md)
- [Network](docs/network.md)
- [Security](docs/security.md)
- [Decision register](docs/decisions.md)
- [Traceability](docs/traceability.md)
- [Development plan](docs/development-plan.md)
- [Toolchain](docs/toolchain.md)

`.env.example` remains an earlier placeholder template and does not configure or start a service. The API reads process environment variables; see the [actual configuration names and safe defaults](docs/backend-foundation.md#configuration-and-time). Phase 1C is closed; the next implementation phase requires separate authorization.

