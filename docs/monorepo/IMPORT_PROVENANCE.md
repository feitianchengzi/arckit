# Todo and Feedback import provenance

Initial import date: 2026-09-01

Latest source sync: 2026-09-06

The migration retained source author identity, author/committer dates, commit messages, and allowed file evolution. Each source was cloned locally, filtered into its final destination paths, checked with `git fsck`, scanned across all reachable blobs, and merged through a dedicated local merge commit.

| Source | Audited source HEAD | Filtered HEAD | Retained commits | Destination |
|---|---|---|---:|---|
| `hoewo/workshop-todo` | `633b779ca1d0793a9577e267d3e9b1599248f772` | `f3a3d941a773ac6272d61ded02156e2774bbc1b3` | 87 | `services/workshop-api/` |
| `hoewo/workshop-todo-website` | `ddbb99a7b83dfcefb3316c8fced3a2f8573c3eb0` | `6a2547a6ce1c913dbfc6ae4c04f9ac8b261d3b35` | 126 | `apps/todo-web/` |
| `hoewo/Workshop-Feedbacks` | `447e16800edac4108d4dfdfb4e92f41da70e5fa6` | `b10e50f4aa7eca0b7345838cc5fc4422693f1810` | 5 | Feedback app, SDK, iOS example, and design docs |

The corresponding Arckit merge commits are `2f6a299`, `eb08eee`, and `bdce54f`. Filtered histories contain no sensitive or non-product paths reported by the source audit and no occurrence of the 16 source-import blocked fingerprints. Sensitive current files were then rebuilt from the audited HEAD with invalid placeholders or explicit environment contracts.

## Latest source sync

On 2026-09-06 the three source repositories were fetched again and their permitted product trees were rebuilt through `tools/scripts/prepare-monorepo-import.mjs`. The synchronized stage contained 710 files and no occurrence of the 16 blocked source-import fingerprints. Existing Arckit licensing, root workspace configuration, and sanitized environment contracts remain authoritative monorepo adaptations.

| Source | Previous synchronized HEAD | Current synchronized HEAD | Result |
|---|---|---|---|
| `hoewo/workshop-todo` | `633b779ca1d0793a9577e267d3e9b1599248f772` | `4ac58fb6c30696c99d833433f28c04101fd72b4a` | Updated `services/workshop-api/` with Console self-feedback sessions and notification rollout changes |
| `hoewo/workshop-todo-website` | `ddbb99a7b83dfcefb3316c8fced3a2f8573c3eb0` | `ddbb99a7b83dfcefb3316c8fced3a2f8573c3eb0` | No product-code delta |
| `hoewo/Workshop-Feedbacks` | `447e16800edac4108d4dfdfb4e92f41da70e5fa6` | `3ae724ef763edaa1ad811655968c029854e0803a` | Updated `apps/feedback-console/`; SDK, iOS example, and design docs had no delta |

The source workspaces' current `.env` files were copied locally to their matching Arckit workspaces for deployment continuity. They remain ignored and are intentionally absent from tracked history and this report.

The exact repeatable rules live in `tools/scripts/prepare-filtered-histories.sh`, `tools/scripts/prepare-monorepo-import.mjs`, and `tools/monorepo/import-manifest.json`. The original repositories are not modified or archived by this local operation.
