# Phase 1C — Backend foundation close-out

Status: PASS — COMPLETE, 2026-09-16.

This closes the NestJS foundation for the native Android Staff/Supervisor APK and the future Next.js Admin Portal. Both clients use the same backend API. Android must never access PostgreSQL or contain database credentials. No database, authentication, RBAC, task, QR, evidence, Android or Admin Portal business implementation is included.

## Evidence and scope

Close-out inspected the existing source, installed package manifests, saved runtime artifacts and current listeners. The successful TypeScript, unit, integration and audit command results were retained from the immediately preceding validation in this session; they were not rerun during documentation closure. Audit results are the findings at that validation, not a guarantee against future advisories.

| Check | Recorded result |
| --- | --- |
| `npm run check` | PASS — TypeScript, no emit |
| TypeScript compilation used by tests | PASS — emitted runnable JavaScript |
| Isolated unknown-route integration case | PASS — paths inside and outside the API prefix |
| Request-ID integration cases | PASS — header/body agreement and concurrent async isolation |
| Isolated health integration case | PASS |
| `npm run test:unit` | PASS — 3 tests |
| `npm run test:integration` | PASS — 9 reported tests, including the parent test |
| `npm audit --omit=dev` | `found 0 vulnerabilities` |
| `npm audit` | `found 0 vulnerabilities` |
| Compiled `dist/src/main.js` runtime, checked with curl | PASS |
| Runtime listener | `127.0.0.1:3000` only |
| Shutdown | PASS — process stopped; no remaining API listener |

The runtime check returned HTTP 200 with `Content-Type: application/json; charset=utf-8` and exactly `{"status":"ok"}` from `GET /api/v1/health`. An unknown route returned HTTP 404, the same JSON content type, and only `statusCode`, `error`, `message`, and a request ID matching the response header. No HTML or stack trace was returned.

Temporary runtime evidence is at `/tmp/tasktrack-phase1c-runtime-z7ddph46/` (`health.json`, `health.headers`, `unknown.json`, `unknown.headers`, `runtime.log`). This directory is temporary, not a durable audit archive. The results above record the verified outcome independently of its retention.

## Verified toolchain and dependency matrix

Node.js: **v24.19.0**. npm: **11.17.0**.

| Package | Installed version |
| --- | --- |
| `@nestjs/common` | 12.0.3 |
| `@nestjs/core` | 12.0.3 |
| `@nestjs/platform-express` | 12.0.3 |
| `@nestjs/config` | 12.0.0 |
| `@nestjs/swagger` | 12.0.1 |
| `@nestjs/testing` | 12.0.3 |
| `helmet` | 8.3.0 |
| `reflect-metadata` | 0.2.2 |
| `rxjs` | 7.8.2 |
| `typescript` | 5.9.3 |
| `@types/node` | 24.13.5 |
| `@types/express` | 5.0.6 |
| `multer` (transitive) | 2.4.0 |
| `@nestjs/throttler` | NOT INSTALLED |

Patched dependency path: `@pakwheels/tasktrack-api → @nestjs/platform-express@12.0.3 → multer@2.4.0`. Strict peer/engine validation passed during dependency remediation, with no forced resolution or overrides. Lifecycle scripts remained disabled; published build outputs were present and no required install-time script was identified. Closure made no package changes.

## Implemented foundation

- Bootstrap and root module under `apps/api/src/`, using explicit ESM and the installed TypeScript compiler.
- Shared `configureApplication()` for runtime and tests: API prefix/versioning, request context, safe exception filter, Helmet headers and HTTP logging middleware.
- API base `/api/v1`; health endpoint `GET /api/v1/health`. Health indicates process liveness only, not database/storage readiness or business availability.
- Internally generated UUID v4 request IDs in `X-Request-ID`, error bodies and request logs. AsyncLocalStorage preserves the ID within request work. Incoming client IDs are ignored; trusted proxy behavior remains disabled.
- Safe generic JSON errors without raw exception messages, stack traces, URLs, credentials or internal objects. HTTP 404 uses `{"statusCode":404,"error":"Not Found","message":"Not Found","requestId":"<generated UUID>"}`.
- Structured logs use UTC ISO timestamps, level, event, request ID, allowlisted method, framework route template, status and duration. Raw URLs, queries, headers, bodies, evidence and arbitrary framework log arguments are not serialized. These logs are not a durable security audit subsystem.
- Helmet security headers and disabled `X-Powered-By`. HSTS and forced HTTPS upgrades are disabled for this local HTTP phase; production TLS policy remains future work.
- Development-only Swagger at `/api/docs`, JSON at `/api/docs-json`; health is the only documented operational endpoint. Documentation is disabled outside development, and all modes remain loopback-bound.
- Unit and integration coverage for configuration, module initialization, health, error safety, IDs, headers, malformed/oversized JSON, logging and Swagger visibility.
- Future module boundaries documented in `apps/api/src/future/README.md`; no business contracts or logic were invented.

### Unknown-route correction

Both application factories already shared configuration. NestJS 12.0.3 scopes its Express not-found handler to the global `/api` prefix. Requests outside that prefix reached Express's default HTML 404 without invoking the safe filter, although request IDs were already assigned. The shared configuration now forwards out-of-prefix paths as `NotFoundException` to Nest's root error handler and the existing safe filter. Regression tests cover both prefix scopes; runtime curl verification confirmed the same behavior.

## Configuration and time

The application reads process environment variables. It does not automatically load `.env` files. The root `.env.example` remains an earlier template; its legacy `API_HOST`/`API_PORT` names are not consumed by this foundation. No environment file or secret was created during close-out.

| Variable | Default / constraint |
| --- | --- |
| `NODE_ENV` | `development`; accepts development, test, production |
| `APP_HOST` | `127.0.0.1`; all other values rejected in this phase |
| `APP_PORT` | `3000`; integer 1–65535 |
| `APP_API_PREFIX` | `api`; validated single path segment |
| `APP_API_VERSION` | `1`; validated positive numeric string |
| `APP_TIMEZONE` | `Asia/Karachi`; other values rejected |
| `APP_OPENAPI_ENABLED` | true only by default in development; enabling outside development rejected |

Future stored instants must use UTC, with Asia/Karachi display semantics. Server time must determine final task status; device time must not. Persistence and task timing rules are not implemented.

## Remaining security and deployment work

Rate limiting: **PLANNED / REQUIRED — NOT IMPLEMENTED**. It must be selected and verified before security foundation completion and before login, password reset, QR validation, uploads or exports become operational. Do not reinstall incompatible Throttler 6.5.0 or substitute custom security-sensitive code to bypass compatibility.

The eventual deployment remains Android → internal HTTPS reverse proxy/DNS → authenticated API, with approved source network `192.168.96.0/20`. The server is `192.168.110.15/20`, gateway `192.168.100.10`. Android's future backend URL belongs in controlled build/release configuration, not a hard-coded production server IP.

No LAN/public API listener remains. No firewall, routing, pfSense, Netplan, VLAN, Docker networking, NGINX, DNS or TLS changes were made. PostgreSQL and application containers were not started. No secrets were created; Git was not initialized and nothing was committed, pushed or deployed.

## Traceability and next step

The complete BRD and full Master Prompt document are not available in the workspace. Implementation and validation follow the user's supplied Phase 1C scope. Formal requirement IDs, acceptance mappings and full BRD traceability remain unresolved; Phase 1C completion does not claim otherwise.

Next: review the Phase 1D data-foundation plan in [Development plan](development-plan.md). No next-phase implementation is authorized by this closure.
