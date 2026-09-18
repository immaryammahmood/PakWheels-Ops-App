# Architecture

Status: the overall system architecture remains PLANNED. Phase 1C implemented and validated the NestJS backend foundation only; see [Backend foundation close-out](backend-foundation.md). PostgreSQL, authentication/RBAC, business modules, Android, Admin Portal, reverse proxy and deployment remain future work. Development binds only to `127.0.0.1`; the runtime verification process has stopped.

## Simple architecture diagram

```text
Android Staff/Supervisor
        |
        | HTTPS
        v
NGINX Internal Reverse Proxy
        |
        +----------------+
        |                |
        v                v
NestJS API         Next.js Admin Portal
        |
        v
PostgreSQL
        |
        v
Private Evidence Storage
```

The diagram lists the system components in a simplified layout. The PostgreSQL-to-storage arrow represents the relationship between evidence metadata and stored files, not a direct database file transfer. The API manages evidence uploads and authorized retrieval, stores metadata in PostgreSQL, and accesses private evidence storage.

Android communicates only with the backend API through NGINX using HTTPS; it never connects directly to PostgreSQL. Admin users access the Next.js portal through the internal reverse proxy. Portal business operations use the API. PostgreSQL remains private to the backend.

## API authority

The NestJS API is the server-side authority for:

- Authentication
- Authorization
- Branch scope
- Task workflow
- QR validation
- Task timing
- Evidence metadata
- Supervisor decisions
- Reporting
- Audit history

Clients present information and submit actions; server-side checks enforce these rules. Server time is authoritative.

## Operating boundaries

The system is intended for the PakWheels internal LAN only. Core operation must not require public internet access. Evidence files have no public media URLs. Network access controls, TLS, storage policies, and deployment details remain future work requiring authorization.
