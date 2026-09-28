\set ON_ERROR_STOP on

DO $$
DECLARE
  resolved_count integer;
  resolved_role text;
BEGIN
  SELECT count(*), max(role)
    INTO resolved_count, resolved_role
    FROM resolve_auth_session('ci-active-token-hash');

  IF resolved_count <> 1 THEN
    RAISE EXCEPTION 'session resolution failure: active session was not resolved';
  END IF;

  IF resolved_role <> 'read_only' THEN
    RAISE EXCEPTION 'session resolution failure: current membership role was not returned';
  END IF;

  SELECT count(*)
    INTO resolved_count
    FROM resolve_auth_session('ci-unknown-token-hash');

  IF resolved_count <> 0 THEN
    RAISE EXCEPTION 'session resolution failure: unknown token hash resolved';
  END IF;
END $$;
