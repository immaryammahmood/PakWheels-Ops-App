# Development toolchain

## Phase 1B — Development Toolchain: COMPLETE

Closure date: 2026-09-16. Evidence source: the project owner's final verified toolchain results supplied for Phase 1B closure. These results were not re-executed during this documentation-only update.

## Confirmed host and network

| Setting | Verified value |
| --- | --- |
| Operating system | Ubuntu Server 24.04 LTS |
| Workspace | `/opt/pakwheels-tasktrack` |
| Permitted LAN | 192.168.96.0/20 |
| Server address after Docker setup | 192.168.110.15/20 |
| Subnet mask | 255.255.240.0 |
| Default gateway | 192.168.100.10 |
| Timezone | Asia/Karachi |

## Verified toolchain

| Component / state | Verified result |
| --- | --- |
| Docker Engine | 29.8.0 |
| Docker Compose | v5.5.1 |
| Docker service | active |
| Docker startup | enabled |
| Existing TaskTrack containers | none |
| `node --version` | v24.19.0 |
| `npm --version` | 11.17.0 |
| `npx --version` | 11.17.0 |

## Node provenance and PATH resolution

Node was installed from the official nodejs.org Linux x64 distribution into the versioned directory `/opt/node-v24.19.0-linux-x64`.

Archive SHA-256 verification: **PASS**. Supplied verification output:

```text
node-v24.19.0-linux-x64.tar.xz: OK
```

The NodeSource generic installer was **REJECTED and never executed** because review identified unnecessary NodeSource/N|Solid/APT changes.

`/opt/node-v24.19.0-linux-x64/bin` has been added to tasktrackadmin's PATH in `~/.bashrc`. The final node/npm/npx version results above confirm that the previous npm/npx PATH blocker is **RESOLVED**.

## Deferred and unimplemented work

- Java/JDK: deferred.
- Android SDK: deferred.
- PostgreSQL application container: not started yet.
- NGINX: not installed yet.
- NestJS backend, PostgreSQL schema, Android APK, Next.js Admin Portal, authentication/RBAC, QR, task scheduling, evidence workflows and application deployment: not implemented.

Phase 1B completion records host development toolchain readiness only. No packages, applications, services, containers, secrets, production credentials/configuration, certificates or signing keys were created by this documentation closure. No network/firewall configuration was changed by this closure.

**NEXT: Phase 1C — NestJS Backend Foundation.** See the [development plan](development-plan.md) for the plan-only scope. No later phase is complete or implemented.
