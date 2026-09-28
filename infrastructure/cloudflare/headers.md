# Edge and application security headers

QuotaMesh emits security headers from application code and keeps Cloudflare edge rules aligned with them.

Required production controls:

- HSTS: `max-age=63072000; includeSubDomains; preload`
- CSP: default self, no `unsafe-eval`, no wildcard script source, `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denies camera, microphone, geolocation, payment, and USB unless a future reviewed feature explicitly needs one.
- `X-Frame-Options: DENY` as legacy clickjacking defense in addition to CSP.

Do not create Transform Rules that weaken these values. If Cloudflare Access is enabled for administrative routes later, it supplements application authentication rather than replacing tenant authorization.
