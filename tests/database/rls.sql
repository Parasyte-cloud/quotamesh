\set ON_ERROR_STOP on

BEGIN;

INSERT INTO organizations (organization_id, name, slug)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Tenant A', 'tenant-a'),
  ('22222222-2222-4222-8222-222222222222', 'Tenant B', 'tenant-b');

SELECT set_config('app.current_organization_id', '11111111-1111-4111-8111-111111111111', true);

INSERT INTO sites (site_id, organization_id, name, vendor, timezone)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'A Site', 'unifi', 'Africa/Lagos');

DO $$
BEGIN
  IF (SELECT count(*) FROM organizations) <> 1 THEN
    RAISE EXCEPTION 'RLS visibility failure: tenant A should see exactly one organization';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO sites (site_id, organization_id, name, vendor, timezone)
    VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'B Claimed By A', 'unifi', 'Africa/Lagos');
    RAISE EXCEPTION 'RLS insert failure: tenant A inserted tenant B row';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END $$;

ROLLBACK;
