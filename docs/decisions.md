# Decision register

Confirmed values are supplied by the project owner. Pending decisions have not been implemented.

| ID | Decision | Status | Current Value | Notes |
| --- | --- | --- | --- | --- |
| DEC-001 | Network CIDR | Confirmed | 192.168.96.0/20 | Internal LAN; subnet mask 255.255.240.0. |
| DEC-002 | Server IP | Confirmed | 192.168.110.15/20 | Server hostname: tasktrack-server. |
| DEC-003 | Gateway | Confirmed | 192.168.100.10 | No routing changes authorized. |
| DEC-004 | Timezone | Confirmed | Asia/Karachi | Server time will be authoritative. |
| DEC-005 | Server address assignment | Confirmed | DHCP reservation / MAC binding | No static interface configuration planned in this phase. |
| DEC-006 | Internal DNS hostname | Pending | TBD | Application hostname remains undecided. |
| DEC-007 | TLS / internal CA | Pending | TBD | HTTPS required; no certificates created. |
| DEC-008 | Android minimum version | Pending | TBD | Confirm supported staff devices. |
| DEC-009 | Device enrollment policy | Pending | TBD | Optional approved-device enrollment. |
| DEC-010 | Evidence retention | Pending | TBD | Confirm retention and deletion policy. |
| DEC-011 | Maximum photo/video sizes | Pending | TBD | Confirm upload and storage limits. |
| DEC-012 | Multi-branch connectivity | Pending | TBD | Remote branch connectivity and site-to-site VPN design are future decisions. |

## Phase 1B closure — 2026-09-16

The following records reflect the project owner's final verified evidence; this closure updates documentation only. See [Toolchain](toolchain.md) for the complete environment and verification record.

| ID | Decision | Status | Current Value | Notes |
| --- | --- | --- | --- | --- |
| DEC-013 | Development host OS | Confirmed | Ubuntu Server 24.04 LTS | Existing server environment. |
| DEC-014 | Container toolchain | Verified | Docker Engine 29.8.0; Docker Compose v5.5.1 | Docker service active and startup enabled; no TaskTrack containers yet. |
| DEC-015 | Node distribution | Verified | Node.js v24.19.0; npm 11.17.0; npx 11.17.0 | Official nodejs.org Linux x64 archive; SHA-256 verification PASS. |
| DEC-016 | Node installation and PATH | Verified | `/opt/node-v24.19.0-linux-x64` | `/opt/node-v24.19.0-linux-x64/bin` added to tasktrackadmin's `~/.bashrc` PATH; previous npm/npx blocker resolved. |
| DEC-017 | NodeSource generic installer | Rejected; never executed | Official Node distribution used | Review found unnecessary NodeSource/N&#124;Solid/APT changes. |
| DEC-018 | Android build tools | Deferred | Java/JDK and Android SDK | No installation authorized by this closure. |
| DEC-019 | Application infrastructure | Not started / not installed | PostgreSQL application container not started; NGINX not installed | No application containers or deployment created by this closure. |
| DEC-020 | Phase progression | Confirmed | Phase 1B COMPLETE; Phase 1C NEXT | Phase 1C — NestJS Backend Foundation is plan only; later phases remain unimplemented. |

## Phase 1C closure — 2026-09-16

The historical Phase 1B progression entry above is superseded for current status: **Phase 1C PASS — COMPLETE; Phase 1D PLANNED**. [Backend foundation close-out](backend-foundation.md) records the verified dependency matrix and validation evidence.

- NestJS Common/Core/Platform Express/Testing 12.0.3, Config 12.0.0 and Swagger 12.0.1 are installed. Platform Express supplies Multer 2.4.0. No forced peer resolution or dependency overrides were used.
- Development binding is restricted to `127.0.0.1`. The standalone verification server was stopped; LAN/TLS/reverse-proxy deployment remains deferred.
- Rate limiting remains PLANNED / REQUIRED — NOT IMPLEMENTED. Throttler 6.5.0 was removed due to unsupported NestJS 12 peers; a supported implementation is required before sensitive operations become available.
- No PostgreSQL, authentication, RBAC, business modules, Android or Admin Portal implementation is claimed. Formal BRD traceability remains unresolved.
