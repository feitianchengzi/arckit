# Private extraction report

Date: 2026-09-01

The sibling `arckit-ops` workspace was initialized as a separate private Git repository. Its 20-file tracked surface contains only repository policy, 15 environment configuration contracts, the private all-rights-reserved license, and a credential-rotation runbook.

The extraction commands emitted no secret values. They produced four verified Git-ignored targets:

- the current Todo Web Feedback API credential transition file;
- the former ArcOrbit Feedback API credential transition file;
- a quarantined copy of the Workshop API debug web surface;
- a structured quarantine record for current credential-bearing documentation.

The extraction found 28 current assignment values requiring isolation or owner review. Secret files were written with mode `0600`; the tracked `secrets/README.md` remains `0644`. `git check-ignore` accepted every representative secret/quarantine target.

The rotation runbook stores only identifiers and truncated SHA-256 fingerprints. The complete audit catalog contains 17 fingerprints: 16 inherited from the imported source repositories and one removed from ArcOrbit's current tree but still present in its pre-existing reachable history. Credential owners must rotate, revoke, or prove invalid every listed item before any public push. New credential values must be supplied through a controlled secret manager or local ignored files, never committed to either repository as plaintext.

Repeatable implementation: `tools/scripts/bootstrap-arckit-ops.mjs`. The separate sanitized public-stage generator handles NUL-delimited Git paths so non-ASCII source names are preserved without relying on Git's quoted display format.
