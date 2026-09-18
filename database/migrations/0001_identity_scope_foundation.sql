-- Up Migration
-- UUIDs are supplied by the backend. No extensions, credentials or seed data.

CREATE TABLE public.organizations (
    id uuid PRIMARY KEY,
    code text NOT NULL CHECK (code = btrim(code) AND code <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    deactivated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0)
);
CREATE UNIQUE INDEX organizations_code_uq ON public.organizations (lower(code));

CREATE TABLE public.branches (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
    code text NOT NULL CHECK (code = btrim(code) AND code <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    deactivated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    UNIQUE (organization_id, id)
);
CREATE UNIQUE INDEX branches_code_uq ON public.branches (organization_id, lower(code));

CREATE TABLE public.users (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
    username text CHECK (username = btrim(username) AND username <> ''),
    employee_identifier text CHECK (employee_identifier = btrim(employee_identifier) AND employee_identifier <> ''),
    display_name text NOT NULL CHECK (btrim(display_name) <> ''),
    deactivated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    CONSTRAINT users_identity_required CHECK (username IS NOT NULL OR employee_identifier IS NOT NULL),
    UNIQUE (organization_id, id)
);
CREATE UNIQUE INDEX users_username_uq ON public.users (organization_id, lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX users_employee_identifier_uq ON public.users (organization_id, lower(employee_identifier)) WHERE employee_identifier IS NOT NULL;
CREATE INDEX users_active_idx ON public.users (organization_id, id) WHERE deactivated_at IS NULL;

CREATE TABLE public.roles (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
    code text NOT NULL CHECK (code = btrim(code) AND code <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    deactivated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    UNIQUE (organization_id, id)
);
CREATE UNIQUE INDEX roles_code_uq ON public.roles (organization_id, lower(code));

CREATE TABLE public.permissions (
    id uuid PRIMARY KEY,
    code text NOT NULL CHECK (code = btrim(code) AND code <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0)
);
CREATE UNIQUE INDEX permissions_code_uq ON public.permissions (lower(code));

CREATE TABLE public.role_permissions (
    id uuid PRIMARY KEY,
    role_id uuid NOT NULL REFERENCES public.roles (id) ON DELETE RESTRICT,
    permission_id uuid NOT NULL REFERENCES public.permissions (id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, permission_id)
);
CREATE INDEX role_permissions_permission_idx ON public.role_permissions (permission_id);

CREATE TABLE public.user_role_assignments (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    scope_type text NOT NULL CHECK (scope_type IN ('organization', 'branch')),
    branch_id uuid,
    effective_from timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    CONSTRAINT user_role_assignments_scope_check CHECK (
        (scope_type = 'organization' AND branch_id IS NULL)
        OR (scope_type = 'branch' AND branch_id IS NOT NULL)
    ),
    CONSTRAINT user_role_assignments_dates_check CHECK (effective_until IS NULL OR effective_until > effective_from),
    FOREIGN KEY (organization_id, user_id) REFERENCES public.users (organization_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (organization_id, role_id) REFERENCES public.roles (organization_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (organization_id, branch_id) REFERENCES public.branches (organization_id, id) ON DELETE RESTRICT
);
-- Separate indexes make NULL organization scope unambiguous without extensions.
CREATE UNIQUE INDEX user_role_assignments_open_org_uq ON public.user_role_assignments (organization_id, user_id, role_id)
    WHERE scope_type = 'organization' AND effective_until IS NULL;
CREATE UNIQUE INDEX user_role_assignments_open_branch_uq ON public.user_role_assignments (organization_id, user_id, role_id, branch_id)
    WHERE scope_type = 'branch' AND effective_until IS NULL;
CREATE INDEX user_role_assignments_user_scope_idx ON public.user_role_assignments (organization_id, user_id, scope_type, branch_id);
CREATE INDEX user_role_assignments_role_idx ON public.user_role_assignments (organization_id, role_id);
CREATE INDEX user_role_assignments_branch_idx ON public.user_role_assignments (organization_id, branch_id) WHERE branch_id IS NOT NULL;

CREATE TABLE public.user_branch_assignments (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
    user_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    effective_from timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    CONSTRAINT user_branch_assignments_dates_check CHECK (effective_until IS NULL OR effective_until > effective_from),
    FOREIGN KEY (organization_id, user_id) REFERENCES public.users (organization_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (organization_id, branch_id) REFERENCES public.branches (organization_id, id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX user_branch_assignments_open_uq ON public.user_branch_assignments (organization_id, user_id, branch_id)
    WHERE effective_until IS NULL;
CREATE INDEX user_branch_assignments_user_branch_idx ON public.user_branch_assignments (organization_id, user_id, branch_id);
CREATE INDEX user_branch_assignments_branch_idx ON public.user_branch_assignments (organization_id, branch_id);

-- Down Migration
-- Retained identity/history must not be destroyed by an automatic rollback.
DO $$
BEGIN
    RAISE EXCEPTION 'Identity/scope rollback requires a separately reviewed recovery plan';
END;
$$;
