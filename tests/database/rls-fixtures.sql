\set ON_ERROR_STOP on

INSERT INTO organizations (organization_id, name, slug)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Tenant A', 'tenant-a'),
  ('22222222-2222-4222-8222-222222222222', 'Tenant B', 'tenant-b');

INSERT INTO organization_memberships (organization_id, user_id, role)
VALUES
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'read_only');

INSERT INTO sites (site_id, organization_id, name, vendor, timezone)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'A Site', 'unifi', 'Africa/Lagos'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 'B Site', 'meraki', 'Africa/Lagos');

INSERT INTO auth_sessions (
  session_id,
  token_hash,
  user_id,
  organization_id,
  expires_at
)
VALUES (
  '44444444-4444-4444-8444-444444444444',
  'ci-active-token-hash',
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  now() + interval '1 hour'
);
