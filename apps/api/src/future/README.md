# Future module boundaries — not implemented

These are architecture placeholders, not business contracts or completed controls.

- Authentication: a future identity module supplies verified server-side identity. No credentials, token format or session design is selected here.
- RBAC: a future authorization module enforces role and scope after authentication. LAN membership alone grants no authority.
- PostgreSQL: future persistence adapters are used only by the backend; Android and the Admin Portal call the API. No schema, connection or database credentials exist here.
- Tasks: future application services own workflow and timing decisions. Persist instants in UTC; render in Asia/Karachi. Server time is authoritative; never trust device time for final status. No timing rules are defined here.
- QR: a future validation module performs server-side checks; no payload or validation protocol is invented here.
- Evidence: a future storage adapter keeps files private and serves them only after server authorization. No uploads or public file paths are exposed.

RequestContext provides internally generated correlation IDs across asynchronous request work. Future audit events may reference them; access logs are not a durable audit subsystem.

Rate limiting: PLANNED / REQUIRED BEFORE SECURITY FOUNDATION COMPLETION. Select a supported NestJS 12-compatible integration before login, password reset, QR, upload or export endpoints become operational. Do not reinstall throttler 6.5.0 or implement a custom limiter to bypass compatibility.

Full BRD and Master Prompt documents are not present in the workspace. This foundation follows the supplied scope; formal traceability remains unresolved.
