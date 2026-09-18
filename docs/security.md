# Security principles

Status: Phase 1C foundation controls implemented and validated; the security requirements below remain PLANNED unless explicitly identified as implemented.

Implemented: loopback-only configuration, internally generated request IDs, safe JSON errors including unknown routes, structured logs with allowlisted fields, Helmet headers, and development-only Swagger. Both dependency audits reported zero vulnerabilities at Phase 1C validation. See [Backend foundation close-out](backend-foundation.md). These controls do not implement authentication, authorization, durable audit logging or production LAN/TLS enforcement.

- Server-side authentication: validate identity on the backend.
- Role-based access control (RBAC): enforce permitted actions by role.
- Branch-scoped authorization: check branch access for every applicable operation.
- Active/inactive account enforcement: deny access for inactive accounts.
- Optional approved-device enrollment: policy remains pending.
- HTTPS/TLS required: internal certificate authority and certificate provisioning remain pending.
- No database credentials in APK: Android communicates only with the API.
- PostgreSQL private to backend: no direct client database access.
- Private evidence storage: authorize file uploads and retrieval through the API.
- No public media URLs: evidence must not be anonymously accessible.
- Server time authoritative: enforce task timing using server time.
- Audit logging: record security-relevant and workflow actions without recording secrets.
- Secure password hashing: select an appropriate password hashing algorithm and parameters in a later phase.
- Short-lived access token design: token lifetime remains to be decided.
- Refresh token/session revocation: support ending access and invalidating sessions.
- Rate limiting: **PLANNED / REQUIRED — NOT IMPLEMENTED**. Select a supported integration before security foundation completion and before login, password reset, QR validation, uploads or exports become operational. Incompatible `@nestjs/throttler@6.5.0` is not installed.
- File upload validation: validate allowed file types, sizes, and content; limits remain pending.
- No gallery upload by default: intended evidence capture uses the application capture flow.
- No production secrets in Git: environment secrets, private keys, certificates, and signing materials must remain outside source control.

No credentials, JWT secrets, certificates, signing keys, security services, or enforcement rules are created in Phase 1A.
