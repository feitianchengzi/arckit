# Private extraction report

Date: 2026-09-01

The sibling `arckit-ops` workspace was initialized as a separate private Git repository. Its tracked surface contains only repository policy, environment configuration contracts, the private all-rights-reserved license, and a credential-rotation runbook.

The extraction command emitted no secret values. It produced three verified Git-ignored targets:

- the current Todo Web Feedback API credential transition file;
- a quarantined copy of the Workshop API debug web surface;
- a structured quarantine record for current credential-bearing documentation.

The extraction found 27 current assignment values requiring isolation or owner review. Secret files were written with mode `0600`; the tracked `secrets/README.md` remains `0644`. `git check-ignore` accepted every representative secret/quarantine target.

The rotation runbook stores only identifiers and truncated SHA-256 fingerprints. Credential owners must rotate, revoke, or prove invalid every listed item before any public push. New credential values must be supplied through a controlled secret manager or local ignored files, never committed to either repository as plaintext.

Repeatable implementation: `tools/scripts/bootstrap-arckit-ops.mjs`.
