# Monorepo migration validation

Validation date: 2026-09-01

## History and security

- Three audited source histories were filtered and merged through commits `2f6a299`, `eb08eee`, and `bdce54f`.
- The integrated public source and governance commit is `e14f3f4`.
- `git fsck --no-dangling` passed for every filtered source repository before merge.
- The final Arckit scan covered all refs and 5,859 reachable text blobs at commit `e14f3f4`.
- No audited sensitive path and none of the 13 blocked credential fingerprints remained reachable.
- Residual heuristic findings are existing test fixtures, invalid placeholders, documentation interpolation/storage keys, or scanners checking for private-key markers. They do not match any blocked source fingerprint.
- Public runtime/build surfaces contain no source dependency on sibling `arckit-ops`.

## Repository and license governance

- Root npm workspaces resolve ArcOrbit, Todo Web, Feedback Console, and Feedback Web SDK from one lockfile (`lockfileVersion: 3`).
- Per-workspace npm lockfiles were removed.
- Todo Web, Feedback Console, Workshop API, and ArcOrbit carry PolyForm Perimeter 1.0.1 directory licenses.
- Feedback Web SDK, the iOS example, and public Workshop docs carry Apache-2.0 directory licenses.
- Package metadata and the bilingual repository licensing guides match the directory license matrix.
- The sibling private `arckit-ops` repository tracks only policy/contracts; representative plaintext and quarantine targets pass `git check-ignore` and are mode `0600`.

## Executable validation

| Surface | Command | Result |
|---|---|---|
| JavaScript workspace graph | `npm ls --workspaces --depth=0` | passed |
| Todo Web | root `npm run build` | Vite production build passed (594 modules) |
| Feedback Console | root `npm run build` | Vite production build passed (588 modules) |
| Feedback Web SDK | root `npm run build` | Vite production build passed (54 modules) |
| Todo Web tests | `npm test --workspace @arckit/todo-web` | 7/7 passed |
| ArcOrbit tests | `npm test --workspace @arckit/arcorbit` | 555 passed, 23 skipped, 0 failed; Electron cases require execution outside the filesystem sandbox |
| Workshop API | `go test ./...` | passed for all packages |
| Feedback iOS example | `xcodebuild ... CODE_SIGNING_ALLOWED=NO build` with DerivedData in `/private/tmp` | build succeeded for arm64 and x86_64 simulator |

The imported Todo source retains a pre-existing strict TypeScript debt: its `build:check` command reports unused-symbol and model-typing errors even though the production Vite build and tests pass. The root `typecheck` command keeps that stricter baseline visible without misrepresenting it as a migration regression.

## Public-release gate

No remote push was performed. Before publishing the merged history, credential owners must complete the redacted statuses in `../arckit-ops/runbooks/credential-rotation.md`, and repository owners must confirm they hold the rights needed to relicense earlier contributions under the directory license matrix. Original source repositories also remain unchanged; archival is a separate owner action after publication.
