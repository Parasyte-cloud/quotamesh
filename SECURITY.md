# QuotaMesh Security Policy

QuotaMesh controls access to real network infrastructure. Treat suspected vulnerabilities, credential exposure, tenant-isolation failures, authentication bypasses, and remote-command issues as security-sensitive.

## Reporting a vulnerability

Please use GitHub's **private vulnerability reporting / private security advisory** workflow for this repository. **Do not open a public issue** for an undisclosed security vulnerability and do not include credentials, session tokens, private keys, RADIUS shared secrets, controller credentials, or production network details in public discussions.

A useful report includes the affected component, reproducible steps, expected versus observed behavior, impact, and any safe proof-of-concept material. Do not access another tenant's data or disrupt production networks while testing.

## Supported code

Security fixes target the latest code on `main`. Development work lands through `dev` and must pass the repository security and quality gates before promotion.

## Secret exposure

If a secret is committed or otherwise exposed, removing it from Git history is not sufficient. Revoke or rotate the secret immediately, then clean the repository history where appropriate.
