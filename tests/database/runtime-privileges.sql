\set ON_ERROR_STOP on

DO $$
BEGIN
  IF has_table_privilege('quotamesh_tenant', 'auth_sessions', 'SELECT') THEN
    RAISE EXCEPTION 'least-privilege failure: tenant role can read auth_sessions';
  END IF;

  IF has_table_privilege('quotamesh_auth', 'auth_sessions', 'SELECT') THEN
    RAISE EXCEPTION 'least-privilege failure: auth role has direct auth_sessions SELECT';
  END IF;

  IF has_table_privilege('quotamesh_auth', 'sites', 'SELECT') THEN
    RAISE EXCEPTION 'least-privilege failure: auth role can read sites';
  END IF;

  IF NOT has_function_privilege('quotamesh_auth', 'resolve_auth_session(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'auth runtime role lacks resolve_auth_session EXECUTE';
  END IF;

  IF NOT has_table_privilege('quotamesh_tenant', 'sites', 'SELECT') THEN
    RAISE EXCEPTION 'tenant runtime role lacks sites SELECT';
  END IF;
END $$;
