# Review finding invariant association repair

The repository semantic materializer now accepts an explicitly declared
`local:review-finding:<handle>` in invariant assessment `gap_refs`. It resolves
that reference to the same derived repair gap identity used by `applyReview`,
and includes those gaps in projected open-gap validation. It does not infer
invariant dispositions or add ordinary Case content to a review command.
Unknown findings and undeclared ordinary gap handles remain rejected.

Verification on 2026-09-11:

- `node --test runtime/arcorbit/test/semantic-case-command.test.mjs`: 9 passed,
  zero failures. The new isolated fixture executes real writeback and a trusted
  post-commit snapshot, proving the repair gap is open and the Case unresolved.
- `node --test runtime/arcorbit/test/case-transition.test.mjs runtime/arcorbit/test/ledger-writer.test.mjs`:
  18 passed, zero failures.
- `git diff --check`: passed.
- `git status --short services/workshop-api`: empty.

The authorized installed `loop-snapshot.mjs read` still reports available state
and Case selection token
`29acf5ffcbf3085868c786b5e7b7da967d1846f35ac0d9f24a0958acac6cb439`.
No canonical project or Case writes were performed in this workspace.

## Activation boundary

The running app uses the old materializer under
`/Applications/arcorbit.app/Contents/Resources/arcorbit/trusted-capabilities/arckit-development-ledger`.
Repository changes do not update that copy. `runtime/arcorbit/scripts/prepare-distribution.mjs`
binds trusted capability files to the distribution digest. No installed bundle
was patched, no digest check bypassed, and no new application package built.
The runtime/distribution owner must activate a normally built distribution
containing this fix before resubmission can succeed.

After activation, fresh-read CASE-20260911-003 and preserve the original review:
four finding dimensions, minimality clean, and both realization and risk
invariants threatened. Use `local:review-finding:visible-submission-context`
for the finding and both affected invariant gap references. The original
implementation finding remains in `completion-review-client-only.md`; no
client implementation work was repeated and the server remains unchanged.
