BEGIN;

CREATE TABLE auth_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX auth_sessions_token_hash_unique ON auth_sessions(token_hash);
CREATE INDEX auth_sessions_user_org_idx ON auth_sessions(user_id, organization_id);
CREATE INDEX auth_sessions_expires_at_idx ON auth_sessions(expires_at);

-- Authentication must locate a session before tenant context is known. Raw session
-- tokens are never stored; only SHA-256 hashes are persisted. Direct table access is
-- denied to PUBLIC. Runtime authentication is performed through the narrow function
-- below so the API auth identity does not need broad table privileges or BYPASSRLS.
REVOKE ALL ON TABLE auth_sessions FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

CREATE OR REPLACE FUNCTION resolve_auth_session(p_token_hash text)
RETURNS TABLE (
  session_id uuid,
  user_id uuid,
  organization_id uuid,
  role text,
  expires_at timestamptz,
  revoked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_session auth_sessions%ROWTYPE;
BEGIN
  SELECT *
    INTO v_session
    FROM auth_sessions
   WHERE token_hash = p_token_hash
     AND revoked_at IS NULL
     AND expires_at > now()
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM set_config('app.current_organization_id', v_session.organization_id::text, true);

  RETURN QUERY
  SELECT
    v_session.session_id,
    v_session.user_id,
    v_session.organization_id,
    m.role,
    v_session.expires_at,
    v_session.revoked_at
  FROM organization_memberships AS m
  WHERE m.organization_id = v_session.organization_id
    AND m.user_id = v_session.user_id;
END;
$$;

REVOKE ALL ON FUNCTION resolve_auth_session(text) FROM PUBLIC;

COMMIT;
