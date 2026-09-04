# Consolidate Workshop Todo and Feedback into the Arckit monorepo

Case: CASE-20260901-001
Status: handoff
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-03T05:54:52.452Z

## User Intent

Merge the Workshop Todo backend, Todo web application, Feedback web applications, SDK, and iOS example into Arckit with a coherent directory structure, explicit multi-license boundaries, and a sibling private arckit-ops repository for non-public operational material.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260901-001",
  "title": "Consolidate Workshop Todo and Feedback into the Arckit monorepo",
  "status": "handoff",
  "artifact_type": "mixed",
  "created_at": "2026-09-01T04:12:15.983Z",
  "updated_at": "2026-09-03T05:54:52.452Z",
  "user_intent": "Merge the Workshop Todo backend, Todo web application, Feedback web applications, SDK, and iOS example into Arckit with a coherent directory structure, explicit multi-license boundaries, and a sibling private arckit-ops repository for non-public operational material.",
  "expected_outcome": "Arckit is the canonical public source monorepo for Arckit, ArcOrbit, Todo, and Feedback product code; non-public production and customer-specific operational material is isolated in a sibling arckit-ops repository; imported code builds and repository governance documents match the new boundary.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260901-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "The repository owner authorized consolidating the Workshop Todo and Feedback code repositories into the public Arckit repository, upgrading licensing, and extracting non-public configuration and secrets into a sibling arckit-ops directory.",
      "basis": "Direct user authorization defines the migration target and public/private repository boundary.",
      "evidence": [
        "Current user instruction, 2026-09-01"
      ]
    },
    {
      "id": "FACT-20260901-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Arckit is the public source monorepo for Arckit, ArcOrbit, Workshop Todo, and Workshop Feedback; product sources are organized as apps, services, packages, examples, and public docs, while a sibling arckit-ops workspace exclusively owns private environment, infrastructure, secret, and customer material under an explicit multi-license and filtered-history policy.",
      "basis": "The repository owner authorized consolidation and the accepted technical solution defines a coherent, auditable boundary that preserves existing Arckit/ArcOrbit paths.",
      "evidence": [
        "arckit/tech/repository-governance/monorepo-solution.md"
      ]
    },
    {
      "id": "FACT-20260901-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "The clean main HEADs 633b779 (Workshop API), ddbb99a (Todo Web), and 447e168 (Workshop Feedbacks) contain separable product sources, but Workshop API and Todo Web current/history include credential material that must not enter Arckit history; all three repositories lack top-level licenses, and non-product Agent/tool/gitlink/generated paths are explicitly excluded by the sanitized import manifest.",
      "basis": "A repeatable redacted scan covered all refs, current worktrees, path provenance, license markers, gitlinks, generated assets, and current credential-bearing sources.",
      "evidence": [
        "docs/monorepo/SOURCE_AUDIT.md",
        "tools/monorepo/import-manifest.json",
        "tools/scripts/audit-monorepo-sources.mjs"
      ]
    },
    {
      "id": "FACT-20260901-001-004",
      "revision": 1,
      "status": "superseded",
      "statement": "A separate local arckit-ops Git workspace now owns private environment contracts, credential rotation records, and Git-ignored plaintext/quarantine material; a repeatable sanitized staging build mapped 701 current source files and found zero occurrences of all 13 known blocked fingerprints.",
      "basis": "The bootstrap and staging tools completed against the three audited source HEADs, verified representative secret targets with git check-ignore, enforced secret file mode 0600, emitted no secret values, and produced durable redacted reports.",
      "evidence": [
        "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
        "docs/monorepo/SANITIZED_STAGE_REPORT.json",
        "tools/scripts/bootstrap-arckit-ops.mjs",
        "tools/scripts/prepare-monorepo-import.mjs"
      ]
    },
    {
      "id": "FACT-20260901-001-005",
      "revision": 1,
      "status": "superseded",
      "statement": "The Workshop API, Todo Web, and Workshop Feedback histories were filtered and merged into their accepted Arckit monorepo destinations; root workspace governance and per-surface license boundaries are applied, supported builds and tests pass, and the final scan of 5,861 reachable text blobs reports zero sensitive paths and zero blocked credential fingerprints.",
      "basis": "Six local migration commits preserve filtered provenance, integrate all public product surfaces, centralize JavaScript workspace locking, document the license boundary, and record successful JavaScript, Go, Electron, and iOS validation plus the final reachable-history security scan.",
      "evidence": [
        "docs/monorepo/IMPORT_PROVENANCE.md",
        "docs/monorepo/VALIDATION.md",
        "commits b8cda68, 2f6a299, eb08eee, bdce54f, e14f3f4, c4dad71"
      ]
    },
    {
      "id": "FACT-20260901-001-004",
      "revision": 2,
      "status": "accepted",
      "statement": "The sibling arckit-ops repository has a clean 20-file tracked policy surface with 15 environment contracts and a 17-entry redacted rotation gate; four plaintext or quarantine targets remain Git ignored with mode 0600, and the regenerated 707-file sanitized stage contains none of the 16 source-import blocked fingerprints.",
      "basis": "The corrected private extraction inventory, committed ops contracts, ignore and permission checks, tracked-tree scan, and regenerated source stage provide repeatable redacted evidence.",
      "evidence": [
        "../arckit-ops commit b318717",
        "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
        "docs/monorepo/SANITIZED_STAGE_REPORT.json",
        "tools/scripts/bootstrap-arckit-ops.mjs",
        "tools/scripts/prepare-monorepo-import.mjs"
      ]
    },
    {
      "id": "FACT-20260901-001-005",
      "revision": 2,
      "status": "accepted",
      "statement": "The merged monorepo current HEAD contains none of the 17 cataloged blocked credential fingerprints, ArcOrbit obtains its Feedback credential only from explicit operator configuration and fails closed when unconfigured, and one removed ArcOrbit credential remains reachable only through pre-existing local history pending owner rotation or revocation and any separately authorized history rewrite.",
      "basis": "The security remediation commit, full catalog scan, product regression evidence, and corrected validation report distinguish current-tree safety from the remaining history and owner gates.",
      "evidence": [
        "commit 27d8e48",
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/env.example",
        "tools/monorepo/blocked-secret-fingerprints.json",
        "docs/monorepo/VALIDATION.md",
        "post-commit audit: 0 current blocked, 1 history-only blocked"
      ]
    },
    {
      "id": "FACT-20260901-001-006",
      "revision": 1,
      "status": "accepted",
      "statement": "The repository owner explicitly authorized private publication of arckit-ops, and feitianchengzi/arckit-ops now exists on GitHub with PRIVATE visibility; main is synchronized at b318717 and the 20-file remote tracked tree excludes all ignored plaintext and quarantine material.",
      "basis": "Direct owner authorization plus GitHub visibility metadata, branch synchronization, commit equality, and remote tree inspection.",
      "evidence": [
        "Current user instruction, 2026-09-01",
        "https://github.com/feitianchengzi/arckit-ops",
        "GitHub visibility: PRIVATE",
        "local HEAD and origin/main: b318717",
        "remote secrets tree: secrets/README.md only"
      ]
    },
    {
      "id": "FACT-20260901-001-007",
      "revision": 1,
      "status": "accepted",
      "statement": "The governed ArcOrbit packaging workflow is monorepo-aware: both jobs cache the root package-lock.json and perform the workspace installation from the repository root, while ArcOrbit-specific checks and packaging continue under runtime/arcorbit and no arckit-ops checkout or feedback credential embedding is introduced.",
      "basis": "The workflow implementation, root npm workspace resolution, explicit regression assertions, and passing package-distribution tests establish the current packaging boundary.",
      "evidence": [
        ".github/workflows/arcorbit-package.yml",
        "runtime/arcorbit/test/package-distribution.test.mjs",
        "node --test runtime/arcorbit/test/package-distribution.test.mjs: 4 passed, 0 failed",
        "npm prefix from runtime/arcorbit: repository root"
      ]
    },
    {
      "id": "FACT-20260901-001-008",
      "revision": 1,
      "status": "accepted",
      "statement": "The local ArcOrbit package:local flow remains valid after consolidation: it resolves the Arckit root and sibling ArcForge root from runtime/arcorbit, builds only the current host-native unsigned target, consumes the monorepo-installed workspace dependencies, and has no arckit-ops dependency. On the current darwin/x64 host with version 0.1.0 and build ID shellfix, the generated DMG name is ArcOrbit-0.1.0-local.shellfix-local-shellfix-mac-x64.dmg; copying that file to ArcOrbit-local.dmg works but is coupled to those three naming inputs.",
      "basis": "The implementation, host and plan probes, npm workspace tree, exact filename matcher, and focused regression tests establish both compatibility and the bounded hard-coding risk.",
      "evidence": [
        "runtime/arcorbit/scripts/build-local-distribution.mjs",
        "runtime/arcorbit/test/local-distribution-build.test.mjs",
        "node --test runtime/arcorbit/test/local-distribution-build.test.mjs: 4 passed, 0 failed",
        "host probe: x86_64 and darwin/x64",
        "build plan: expected shellfix artifact accepted",
        "npm ls --workspace @arckit/arcorbit --depth=0: passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260901-001-001",
      "fact_id": "FACT-20260901-001-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "runtime_surfaces",
        "revision": 5
      },
      "effect": "upheld",
      "reason": "The monorepo solution now recovers every repository-owned source surface and keeps existing runtime responsibilities unchanged.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/repository-governance/monorepo-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260901-001-002",
      "fact_id": "FACT-20260901-001-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 47
      },
      "effect": "upheld",
      "reason": "Existing Arckit and ArcOrbit paths remain stable while new product sources receive explicit monorepo ownership.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/repository-governance/monorepo-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260901-001-003",
      "fact_id": "FACT-20260901-001-005",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "security_privacy_compliance",
        "revision": 6
      },
      "effect": "threatened",
      "reason": "Current public source is clean and the boundary is complete, but all 17 provider-side statuses remain pending, one removed ArcOrbit credential remains history-reachable, and relicensing and publication authority remain owner-controlled.",
      "gap_ids": [
        "GAP-20260901-001-005"
      ],
      "evidence": [
        "docs/monorepo/VALIDATION.md",
        "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
        "../arckit-ops/runbooks/credential-rotation.md"
      ]
    },
    {
      "id": "IMPACT-20260901-001-004",
      "fact_id": "FACT-20260901-001-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 9
      },
      "effect": "upheld",
      "reason": "The public distribution now has explicit directory licenses, source provenance, and archive authority rules.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/repository-governance/monorepo-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260901-001-001",
      "status": "resolved",
      "goal": "Establish and persist the exact monorepo directory, licensing, history-preservation, and public/private classification that governs the migration.",
      "reason": "Code movement and extraction cannot be safely accepted until source destinations, licensing defaults, retained history, and private operational boundaries are explicit and auditable.",
      "derived_from": [
        "FACT-20260901-001-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "dependency": "blocks all repository migration work",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Accepted technical architecture in arckit/tech",
        "Auditable source-to-destination and license matrix"
      ],
      "resolution": {
        "id": "GAP-20260901-001-001",
        "status": "resolved",
        "outcome": "The source-to-destination map, directory-priority license matrix, filtered-history policy, public configuration contract, arckit-ops boundary, and security gates are durably specified.",
        "reason": "The technical fact source now determines every classification needed before source mutation.",
        "evidence": [
          "arckit/tech/repository-governance/monorepo-solution.md",
          "arckit/tech/INDEX.md",
          "arckit/tech/_map/RELATIONS.md",
          "arckit/tech/_map/feature-matrix.md"
        ],
        "occurred_at": "2026-09-01T04:19:45.213Z"
      }
    },
    {
      "id": "GAP-20260901-001-002",
      "status": "resolved",
      "goal": "Audit the current source trees and complete Git histories, classify every non-public or non-redistributable path, and produce sanitized import sets plus an arckit-ops extraction inventory.",
      "reason": "The accepted public/private architecture cannot safely govern actual imports until real source and history evidence proves what may enter the public repository and what must be isolated or revoked.",
      "derived_from": [
        "FACT-20260901-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "risk": "high",
        "dependency": "blocks all source import and license publication"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Current-tree secret and sensitive-path audit",
        "Complete-history secret audit",
        "Source provenance and third-party license audit",
        "Sanitized path mapping",
        "arckit-ops extraction inventory"
      ],
      "resolution": {
        "id": "GAP-20260901-001-002",
        "status": "resolved",
        "outcome": "All refs of the three source repositories and their current worktrees were scanned with redacted output; sensitive and non-product paths, license provenance, import sets, and arckit-ops extraction targets are classified.",
        "reason": "The audit report and machine-readable manifest provide sufficient repeatable evidence to govern the next private extraction step without exposing matched values.",
        "evidence": [
          "tools/scripts/audit-monorepo-sources.mjs",
          "docs/monorepo/SOURCE_AUDIT.md",
          "tools/monorepo/import-manifest.json",
          "audit report credential redaction: ok"
        ],
        "occurred_at": "2026-09-01T04:29:57.341Z"
      }
    },
    {
      "id": "GAP-20260901-001-003",
      "status": "resolved",
      "goal": "Create the sibling private arckit-ops workspace, extract and quarantine every current non-public value or file without Git-tracking plaintext secrets, and establish a credential rotation handoff plus sanitized public replacements.",
      "reason": "The audit proved actual current credential-bearing sources exist, so public history import cannot begin until non-public material has an explicit private owner and the public HEAD inputs no longer contain those values.",
      "derived_from": [
        "FACT-20260901-001-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "risk": "high",
        "dependency": "blocks sanitized public history import"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Sibling arckit-ops structure and private git policy",
        "Ignored secret/quarantine extraction with no value leakage",
        "Credential rotation runbook and human handoff",
        "Sanitized public source staging inputs",
        "Repeat scan proving current import inputs contain no blocked fingerprints"
      ],
      "resolution": {
        "id": "GAP-20260901-001-003",
        "status": "resolved",
        "outcome": "The sibling arckit-ops repository now tracks only private policy/configuration contracts while plaintext imports and quarantine copies remain Git ignored; the generated 701-file public stage contains none of the 13 blocked fingerprints and the owner rotation gate is documented.",
        "reason": "Private extraction, file permissions, Git-ignore enforcement, redacted rotation handoff, deterministic sanitization, and repeat scanning all produced the required evidence without emitting secret values.",
        "evidence": [
          "../arckit-ops/.gitignore",
          "../arckit-ops/runbooks/credential-rotation.md",
          "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
          "docs/monorepo/SANITIZED_STAGE_REPORT.json",
          "tools/scripts/bootstrap-arckit-ops.mjs",
          "tools/scripts/prepare-monorepo-import.mjs",
          "ops ignore policy: ok"
        ],
        "occurred_at": "2026-09-01T05:17:55.900Z"
      }
    },
    {
      "id": "GAP-20260901-001-004",
      "status": "resolved",
      "goal": "Import the three source repositories with filtered provenance into the accepted monorepo destinations, apply the license boundary and workspace governance, prove the resulting current tree and reachable imported history are free of blocked material, and prepare the exact human public-release gate.",
      "reason": "The sanitized inputs and private boundary are now accepted, so the authorized local consolidation can be realized without importing forbidden history and can establish the final evidence scope owners must approve before publication.",
      "derived_from": [
        "FACT-20260901-001-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "case completion",
        "risk": "high",
        "user_impact": "delivers requested monorepo"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Filtered source provenance in destination paths",
        "Root workspace and directory governance",
        "Per-surface license files and package metadata",
        "Current-tree and reachable-history secret scan",
        "Build and test evidence for imported components",
        "Final public-release handoff for credential and relicensing owners"
      ],
      "resolution": {
        "id": "GAP-20260901-001-004",
        "status": "resolved",
        "outcome": "The three filtered source histories are merged into the governed Arckit monorepo destinations, root workspace and per-surface license boundaries are active, all supported builds and tests pass, and the final scan found zero sensitive paths and zero blocked fingerprints across 5,861 reachable text blobs.",
        "reason": "The imported commits, provenance record, directory and licensing changes, build/test results, and reachable-history scan satisfy every required item for the local consolidation.",
        "evidence": [
          "docs/monorepo/IMPORT_PROVENANCE.md",
          "docs/monorepo/VALIDATION.md",
          "commits b8cda68, 2f6a299, eb08eee, bdce54f, e14f3f4, c4dad71",
          "final history scan: 5,861 reachable text blobs, 0 sensitive paths, 0 blocked fingerprints"
        ],
        "occurred_at": "2026-09-01T05:50:21.160Z"
      }
    },
    {
      "id": "GAP-20260901-001-005",
      "status": "open",
      "goal": "Confirm every credential runbook entry is rotated, revoked, expired, or otherwise invalid; confirm rights to apply the selected licenses; and decide whether to publish the merged history and archive the old source repositories.",
      "reason": "Credential-provider state, legal relicensing authority, remote publication, and repository archival are owner-controlled facts that cannot be established through local code or history inspection.",
      "derived_from": [
        "FACT-20260901-001-005"
      ],
      "blocked_by": [],
      "priority_basis": {
        "risk": "high",
        "dependency": "blocks public push and source repository archival"
      },
      "responsibility": "human",
      "evidence_required": [
        "Completed ../arckit-ops/runbooks/credential-rotation.md with non-secret provider references",
        "Owner confirmation of Apache-2.0 and PolyForm Perimeter 1.0.1 relicensing rights",
        "Explicit authorization for remote push and source repository archival if desired"
      ],
      "resolution": null
    },
    {
      "id": "GAP-20260901-001-006",
      "goal": "Correct the incomplete credential inventory, remove the ArcOrbit credential from current public source, complete arckit-ops coverage, and make the audit gate detect the full known boundary.",
      "reason": "The prior security acceptance evidence covered only 13 fingerprints and overclaimed that all reachable history was clean.",
      "responsibility": "agent",
      "derived_from": [
        "FACT-20260901-001-005"
      ],
      "blocked_by": [],
      "priority_basis": {
        "risk": "critical",
        "user_impact": "prevents publishing an embedded credential"
      },
      "evidence_required": [
        "ArcOrbit current source contains no embedded Feedback credential",
        "Complete blocked-fingerprint catalog and corrected sensitive-path matching",
        "arckit-ops rotation and environment-contract coverage",
        "Current-tree, history, sanitized-stage, and product regression evidence"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-20260901-001-006",
        "status": "resolved",
        "outcome": "ArcOrbit now receives Feedback credentials only through explicit operator configuration and fails closed when absent; the catalog covers 17 fingerprints, source staging excludes all 16 inherited fingerprints, arckit-ops covers all five product surfaces and all 17 rotation entries, and the corrected scan reports zero blocked fingerprints in current HEAD with exactly one ArcOrbit fingerprint remaining history-only.",
        "reason": "Public code, private contracts, audit tooling, regenerated staging evidence, focused and full regression evidence, and post-commit history scanning agree on the corrected boundary.",
        "evidence": [
          "commit 27d8e48",
          "arckit-ops commit b318717",
          "tools/monorepo/blocked-secret-fingerprints.json",
          "docs/monorepo/VALIDATION.md",
          "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
          "sanitized stage: 707 files, 16 fingerprints checked, 0 found",
          "post-commit audit: 5,882 reachable text blobs, 0 current blocked, 1 history-only blocked",
          "ArcOrbit regression: 556 passed, 23 skipped, 0 functional failures"
        ],
        "occurred_at": "2026-09-01T07:10:53.678Z"
      }
    },
    {
      "id": "GAP-20260901-001-007",
      "goal": "Create the arckit-ops GitHub repository as private, connect the local repository, push main, and verify the remote contains only the approved tracked boundary.",
      "reason": "The established local private operations repository required a durable private remote under the Arckit organization.",
      "responsibility": "agent",
      "derived_from": [
        "FACT-20260901-001-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "establishes the required private remote",
        "risk": "high"
      },
      "evidence_required": [
        "GitHub visibility is PRIVATE",
        "main tracks origin/main",
        "remote commit equals local HEAD",
        "remote tree contains no ignored secret material"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-20260901-001-007",
        "status": "resolved",
        "outcome": "GitHub repository feitianchengzi/arckit-ops exists with PRIVATE visibility, default branch main, and local main tracking origin/main at commit b318717; its remote tree has 20 tracked files and only secrets/README.md below secrets/.",
        "reason": "GitHub metadata, local/remote commit equality, branch tracking, and remote tree inspection independently verify the requested private publication boundary.",
        "evidence": [
          "https://github.com/feitianchengzi/arckit-ops",
          "GitHub visibility: PRIVATE",
          "local HEAD and origin/main: b318717",
          "remote tracked files: 20",
          "remote secrets tree: secrets/README.md only"
        ],
        "occurred_at": "2026-09-01T09:31:16.887Z"
      }
    },
    {
      "id": "GAP-20260901-001-008",
      "goal": "Update the ArcOrbit GitHub packaging workflow to consume the monorepo root dependency lock and install from the workspace root, with regression coverage that prevents the stale child-lock path from returning.",
      "reason": "The Todo and Feedback consolidation removed per-workspace lockfiles, but both ArcOrbit packaging jobs still configured setup-node against runtime/arcorbit/package-lock.json.",
      "responsibility": "agent",
      "derived_from": [
        "FACT-20260901-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "prevents the governed packaging workflow from resolving its npm cache dependency",
        "user_impact": "restores ArcOrbit CI packaging after monorepo migration"
      },
      "evidence_required": [
        "Both workflow jobs cache against the root package-lock.json",
        "Both workflow jobs run npm ci from the repository root",
        "ArcOrbit package-distribution regression passes",
        "The workflow remains independent of arckit-ops and runtime feedback credentials"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-20260901-001-008",
        "status": "resolved",
        "outcome": "Both ArcOrbit workflow jobs now use package-lock.json for setup-node caching and execute npm ci from the repository root; the packaging regression explicitly verifies both occurrences and rejects runtime/arcorbit/package-lock.json and child-directory npm ci.",
        "reason": "The workflow diff matches the monorepo workspace contract, npm prefix resolves the root from runtime/arcorbit, the focused distribution test passes 4/4, and git diff --check reports no errors.",
        "evidence": [
          ".github/workflows/arcorbit-package.yml",
          "runtime/arcorbit/test/package-distribution.test.mjs",
          "node --test runtime/arcorbit/test/package-distribution.test.mjs: 4 passed, 0 failed",
          "git diff --check: passed",
          "npm prefix from runtime/arcorbit: repository root"
        ],
        "occurred_at": "2026-09-03T05:47:09.558Z"
      }
    },
    {
      "id": "GAP-20260901-001-009",
      "goal": "Determine whether the existing package:local command and its ArcOrbit-local.dmg copy step require changes after the monorepo and private-ops split.",
      "reason": "The command predates the completed repository consolidation and hard-codes the generated x64 artifact name.",
      "responsibility": "agent",
      "derived_from": [
        "FACT-20260901-001-002",
        "FACT-20260901-001-007"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "confirms the operator's established local build command",
        "uncertainty": "whether monorepo migration invalidated the script"
      },
      "evidence_required": [
        "Current host and selected package target",
        "Resolved Arckit and ArcForge repository roots",
        "Expected shellfix artifact filename acceptance",
        "Monorepo workspace dependency resolution",
        "Focused local-distribution regression result",
        "No arckit-ops dependency"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-20260901-001-009",
        "status": "resolved",
        "outcome": "No migration-driven local packaging script change is required. On the current darwin/x64 host, build-id shellfix selects package:mac:x64 and accepts ArcOrbit-0.1.0-local.shellfix-local-shellfix-mac-x64.dmg; the command resolves Arckit and sibling ArcForge correctly, uses the installed root workspace dependencies, and never reads arckit-ops. The final cp is valid now but remains intentionally coupled to version, build ID, and architecture.",
        "reason": "Pure build-plan evaluation, npm workspace inspection, the script's explicit repository boundaries, help invocation, and four passing local-distribution tests agree on the current behavior without requiring a full installer build.",
        "evidence": [
          "runtime/arcorbit/scripts/build-local-distribution.mjs",
          "runtime/arcorbit/test/local-distribution-build.test.mjs",
          "runtime/arcorbit/README.md",
          "node --test runtime/arcorbit/test/local-distribution-build.test.mjs: 4 passed, 0 failed",
          "host probe: x86_64 and darwin/x64",
          "build plan: macos-x64 and expected shellfix artifact accepted",
          "npm ls --workspace @arckit/arcorbit --depth=0: passed"
        ],
        "occurred_at": "2026-09-03T05:54:52.452Z"
      }
    }
  ],
  "content_revision": 8,
  "completion_review": {
    "status": "pending",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Arckit default completion-review policy",
      "snapshotted_at": "2026-09-01T04:12:15.983Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 0,
    "reviewed_content_revision": null,
    "dimensions": {
      "implementation_correctness": "unknown",
      "problem_resolution": "unknown",
      "verification_credibility": "unknown",
      "regression_risk": "unknown",
      "minimality": "unknown"
    },
    "findings": [],
    "cycles": [],
    "evidence": [],
    "escalation": null,
    "human_authorizations": []
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Persist the accepted monorepo, license, history, and private-operations architecture as the authoritative migration boundary.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The migration boundary is the only ready Case gap and is prerequisite to source auditing, private extraction, history import, licensing changes, and build verification.",
        "snapshot_token": "588370ba07d46e757a7ceb6f0d1d2c98ca90416b035d7f5d2af19f4133e044b0",
        "selected_ref": "case-gap:CASE-20260901-001:GAP-20260901-001-001",
        "comparison_summary": "Four unrelated Project gaps require separate Cases and were deferred; the selected Case gap is ready and blocks every authorized migration action.",
        "fresh_discovery_summary": "No additional candidate was known at selection time; the architecture work exposed a downstream source-history audit obligation, which is persisted without being executed in this round.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "uncertainty": "high"
            },
            "reason": "Scenario evaluation is independent of the authorized monorepo migration."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Runtime resilience is not a prerequisite for repository consolidation."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "The migration produces security evidence but does not subsume the separate real-project validation objective."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record auditing is unrelated to deciding the source and license boundary."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks all repository migration work"
            },
            "reason": "It is the sole ready Case obligation and every downstream mutation depends on its accepted classification."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-001",
        "responsibility": "agent",
        "goal": "Establish and persist the exact monorepo directory, licensing, history-preservation, and public/private classification that governs the migration.",
        "reason": "Code movement and extraction cannot be safely accepted until source destinations, licensing defaults, retained history, and private operational boundaries are explicit and auditable.",
        "derived_from": [
          "FACT-20260901-001-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "dependency": "blocks all repository migration work"
        },
        "evidence_required": [
          "Accepted technical architecture in arckit/tech",
          "Auditable source-to-destination and license matrix"
        ]
      },
      "planned_transition": {
        "goal": "Persist the accepted monorepo, license, history, and private-operations architecture as the authoritative migration boundary.",
        "expected_state_change": "The architecture gap is resolved by a durable technical solution and Project decisions are updated; source auditing remains an explicit next gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-001",
          "status": "resolved",
          "outcome": "The source-to-destination map, directory-priority license matrix, filtered-history policy, public configuration contract, arckit-ops boundary, and security gates are durably specified.",
          "reason": "The technical fact source now determines every classification needed before source mutation.",
          "evidence": [
            "arckit/tech/repository-governance/monorepo-solution.md",
            "arckit/tech/INDEX.md",
            "arckit/tech/_map/RELATIONS.md",
            "arckit/tech/_map/feature-matrix.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Arckit is the public source monorepo for Arckit, ArcOrbit, Workshop Todo, and Workshop Feedback; product sources are organized as apps, services, packages, examples, and public docs, while a sibling arckit-ops workspace exclusively owns private environment, infrastructure, secret, and customer material under an explicit multi-license and filtered-history policy.",
            "basis": "The repository owner authorized consolidation and the accepted technical solution defines a coherent, auditable boundary that preserves existing Arckit/ArcOrbit paths.",
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260901-001-001",
            "fact_id": "FACT-20260901-001-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "runtime_surfaces",
              "revision": 5
            },
            "effect": "upheld",
            "reason": "The monorepo solution now recovers every repository-owned source surface and keeps existing runtime responsibilities unchanged.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260901-001-002",
            "fact_id": "FACT-20260901-001-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 47
            },
            "effect": "upheld",
            "reason": "Existing Arckit and ArcOrbit paths remain stable while new product sources receive explicit monorepo ownership.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260901-001-003",
            "fact_id": "FACT-20260901-001-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "security_privacy_compliance",
              "revision": 6
            },
            "effect": "threatened",
            "reason": "The safe boundary is defined, but source trees and histories have not yet proven free of secrets, customer material, or non-redistributable content.",
            "gap_ids": [
              "GAP-20260901-001-002"
            ],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260901-001-004",
            "fact_id": "FACT-20260901-001-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "The public distribution now has explicit directory licenses, source provenance, and archive authority rules.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260901-001-002",
            "status": "open",
            "goal": "Audit the current source trees and complete Git histories, classify every non-public or non-redistributable path, and produce sanitized import sets plus an arckit-ops extraction inventory.",
            "reason": "The accepted public/private architecture cannot safely govern actual imports until real source and history evidence proves what may enter the public repository and what must be isolated or revoked.",
            "derived_from": [
              "FACT-20260901-001-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks all source import and license publication"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Current-tree secret and sensitive-path audit",
              "Complete-history secret audit",
              "Source provenance and third-party license audit",
              "Sanitized path mapping",
              "arckit-ops extraction inventory"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [
          {
            "area_ref": "runtime_surfaces",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "The repository-owned software surfaces are Arckit skills and ledger CLIs, ArcOrbit Electron Desktop/Runtime, the Workshop Todo browser application, the Workshop Feedback developer console, the shared Workshop Todo/Feedback Go service, the embeddable Feedback Web SDK, and the iOS integration example. These sources live in one public Arckit monorepo while preserving existing Arckit and ArcOrbit paths; Workshop web clients remain optional administration and source surfaces rather than requirements for ArcOrbit daily work.",
              "reason": "The repository owner authorized consolidating the previously separate Todo and Feedback sources without changing their runtime responsibilities.",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit if a new server, mobile, or hosted surface becomes repository-owned or a current surface leaves the monorepo."
            },
            "gap_refs": [],
            "reason": "The accepted monorepo architecture expands the repository-owned surface inventory while preserving product responsibility boundaries.",
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 46,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit and ArcOrbit retain their existing ledger, skill, Electron, Runtime, Platform Coordinator, Work Sync, Chat, Setup Readiness, trusted case-control, and repository-relative path boundaries. The public Arckit monorepo additionally owns Todo Web under apps, Feedback Console under apps, the Feedback Web SDK under packages, the shared Workshop API under services, and integration examples under examples. JavaScript surfaces use one root workspace with independent build and release entries; the Workshop API remains an independently testable Go module. Public builds and tests never require the sibling private arckit-ops workspace.",
              "reason": "The accepted source layout provides coherent ownership without nesting or relocating the established Arckit skill and ArcOrbit runtime foundations.",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when workspace tooling, repository-relative capability paths, or source ownership boundaries change."
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The monorepo layout is now a durable part of the technical foundation.",
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          },
          {
            "area_ref": "security_privacy_compliance",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime, Workshop, Codex, deployment, signing, infrastructure, and customer secrets remain outside Renderer and outside the public Arckit source history. The public monorepo contains only invalid example configuration and explicit environment contracts. The sibling private arckit-ops workspace owns environment-specific topology, encrypted secret references, ignored local secret material, private runbooks, and customer overlays; private Git visibility does not authorize committing plaintext secrets. Every imported current tree and complete history is scanned and filtered before publication, and any discovered real credential is revoked or rotated rather than merely deleted.",
              "reason": "Consolidating previously separate repositories into a public monorepo expands the publication boundary and requires an explicit private operational and history-sanitization contract.",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when secret storage, customer delivery ownership, infrastructure repositories, or publication scope changes."
            },
            "gap_refs": [
              "GAP-security-real-project-validation"
            ],
            "reason": "The public/private repository boundary is now a durable security decision.",
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          },
          {
            "area_ref": "delivery_and_distribution",
            "observed_revision": 8,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit is a public source monorepo containing Apache-2.0 open-source protocol, skill, SDK, example, and public-documentation components together with PolyForm Perimeter 1.0.1 source-available ArcOrbit, Todo Web, Feedback Console, and Workshop API product components. The nearest component LICENSE and manifest metadata override the root default. Imported source history preserves provenance only after forbidden paths are filtered from complete history. Arckit is the sole source authority after verification; former Todo and Feedback repositories become read-only archives, while private operational and customer distribution remains in arckit-ops.",
              "reason": "A single source repository requires unambiguous component licensing, provenance, publication, and legacy-repository authority.",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md",
                "LICENSING.md",
                "runtime/arcorbit/LICENSE"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when a component changes license, release ownership, or source authority."
            },
            "gap_refs": [],
            "reason": "The accepted monorepo license and provenance model changes the durable source distribution boundary.",
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/tech/repository-governance/monorepo-solution.md",
          "arckit/tech/INDEX.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 330,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This gap establishes source ownership and repository governance without changing product behavior, business rules, or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No user journey, interaction state, feedback, navigation, or recovery behavior changes in this architecture gap.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Repository layout and licensing do not establish or revise visual-language rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The authoritative technical solution records the source map, license priority, history policy, workspace boundary, ops isolation, rationale, and affected relationships.",
            "fact_refs": [
              "FACT-20260901-001-002"
            ],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md",
              "arckit/tech/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The selected gap claims only that the governing architecture is established, and the indexed technical fact source directly realizes that claim.",
            "fact_refs": [
              "FACT-20260901-001-002"
            ],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md",
              "arckit/tech/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The architecture identifies publication, secret, customer-data, provenance, and third-party-license risks, but actual source trees and complete histories have not yet been audited.",
            "fact_refs": [
              "FACT-20260901-001-002"
            ],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md"
            ],
            "gap_refs": [
              "GAP-20260901-001-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/tech/repository-governance/monorepo-solution.md",
        "arckit/tech/INDEX.md",
        "arckit/tech/_map/RELATIONS.md",
        "arckit/tech/_map/feature-matrix.md",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T04:19:45.213Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Produce a repeatable redacted source/history audit, sanitized import manifest, and private extraction inventory for all three source repositories.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The source and history audit is the sole ready Case gap and the mandatory safety gate before any private extraction or public history import.",
        "snapshot_token": "6dc07777fdb1a3130d8ba663a85f19a839730bdd17429174b40f6243e0e6e7ad",
        "selected_ref": "case-gap:CASE-20260901-001:GAP-20260901-001-002",
        "comparison_summary": "Four Project gaps require independent Cases; the selected migration audit is ready and blocks every remaining repository mutation.",
        "fresh_discovery_summary": "No additional candidate was known at selection time; the audit discovered current and historical credential material that creates a subsequent private extraction and rotation-handoff obligation.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "uncertainty": "high"
            },
            "reason": "It does not determine the source publication set."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Runtime resilience is independent of source sanitization."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This audit contributes evidence but does not subsume the broader real-project security validation."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record auditing is not part of source provenance or secret scanning."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks all source import and license publication"
            },
            "reason": "It is the only ready Case gap and directly controls the safety of the authorized public migration."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-002",
        "responsibility": "agent",
        "goal": "Audit the current source trees and complete Git histories, classify every non-public or non-redistributable path, and produce sanitized import sets plus an arckit-ops extraction inventory.",
        "reason": "The accepted public/private architecture cannot safely govern actual imports until real source and history evidence proves what may enter the public repository and what must be isolated or revoked.",
        "derived_from": [
          "FACT-20260901-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "dependency": "blocks all source import and license publication"
        },
        "evidence_required": [
          "Current-tree secret and sensitive-path audit",
          "Complete-history secret audit",
          "Source provenance and third-party license audit",
          "Sanitized path mapping",
          "arckit-ops extraction inventory"
        ]
      },
      "planned_transition": {
        "goal": "Produce a repeatable redacted source/history audit, sanitized import manifest, and private extraction inventory for all three source repositories.",
        "expected_state_change": "The audit gap is resolved with exact source HEADs and classifications; discovered current secrets become a separate private extraction and rotation obligation."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-002",
          "status": "resolved",
          "outcome": "All refs of the three source repositories and their current worktrees were scanned with redacted output; sensitive and non-product paths, license provenance, import sets, and arckit-ops extraction targets are classified.",
          "reason": "The audit report and machine-readable manifest provide sufficient repeatable evidence to govern the next private extraction step without exposing matched values.",
          "evidence": [
            "tools/scripts/audit-monorepo-sources.mjs",
            "docs/monorepo/SOURCE_AUDIT.md",
            "tools/monorepo/import-manifest.json",
            "audit report credential redaction: ok"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "The clean main HEADs 633b779 (Workshop API), ddbb99a (Todo Web), and 447e168 (Workshop Feedbacks) contain separable product sources, but Workshop API and Todo Web current/history include credential material that must not enter Arckit history; all three repositories lack top-level licenses, and non-product Agent/tool/gitlink/generated paths are explicitly excluded by the sanitized import manifest.",
            "basis": "A repeatable redacted scan covered all refs, current worktrees, path provenance, license markers, gitlinks, generated assets, and current credential-bearing sources.",
            "evidence": [
              "docs/monorepo/SOURCE_AUDIT.md",
              "tools/monorepo/import-manifest.json",
              "tools/scripts/audit-monorepo-sources.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260901-001-003",
            "fact_id": "FACT-20260901-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "security_privacy_compliance",
              "revision": 6
            },
            "effect": "threatened",
            "reason": "The audit identified current hardcoded Feedback/API/OSS/database credentials and historical cloud access material; private extraction, public-source sanitization, and credential-owner rotation evidence remain required.",
            "gap_ids": [
              "GAP-20260901-001-003"
            ],
            "evidence": [
              "docs/monorepo/SOURCE_AUDIT.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260901-001-003",
            "status": "open",
            "goal": "Create the sibling private arckit-ops workspace, extract and quarantine every current non-public value or file without Git-tracking plaintext secrets, and establish a credential rotation handoff plus sanitized public replacements.",
            "reason": "The audit proved actual current credential-bearing sources exist, so public history import cannot begin until non-public material has an explicit private owner and the public HEAD inputs no longer contain those values.",
            "derived_from": [
              "FACT-20260901-001-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks sanitized public history import"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Sibling arckit-ops structure and private git policy",
              "Ignored secret/quarantine extraction with no value leakage",
              "Credential rotation runbook and human handoff",
              "Sanitized public source staging inputs",
              "Repeat scan proving current import inputs contain no blocked fingerprints"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 331,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The audit classifies source publication safety and does not revise product behavior or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No interaction decision or state is changed by source auditing.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The audit does not establish or revise visual-language facts.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The audit report and import manifest trace every source HEAD, destination, exclusion, history treatment, and private extraction target back to the accepted monorepo architecture.",
            "fact_refs": [
              "FACT-20260901-001-003"
            ],
            "evidence": [
              "docs/monorepo/SOURCE_AUDIT.md",
              "tools/monorepo/import-manifest.json",
              "arckit/tech/repository-governance/monorepo-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The selected audit claim is realized by a repeatable scanner, exact redacted report, validated manifest, and credential non-leak assertion.",
            "fact_refs": [
              "FACT-20260901-001-003"
            ],
            "evidence": [
              "tools/scripts/audit-monorepo-sources.mjs",
              "docs/monorepo/SOURCE_AUDIT.md",
              "tools/monorepo/import-manifest.json",
              "audit report credential redaction: ok"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The audit credibly proves where sensitive material exists, but that material is not yet extracted, sanitized, or covered by credential-owner rotation evidence.",
            "fact_refs": [
              "FACT-20260901-001-003"
            ],
            "evidence": [
              "docs/monorepo/SOURCE_AUDIT.md"
            ],
            "gap_refs": [
              "GAP-20260901-001-003"
            ]
          }
        ]
      },
      "evidence": [
        "tools/scripts/audit-monorepo-sources.mjs",
        "docs/monorepo/SOURCE_AUDIT.md",
        "tools/monorepo/import-manifest.json",
        "jq empty tools/monorepo/import-manifest.json",
        "node --check tools/scripts/audit-monorepo-sources.mjs",
        "audit report credential redaction: ok",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T04:29:57.341Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Establish the private operational workspace and sanitized public import boundary defined by the accepted source audit.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The private extraction gap is the sole ready Case obligation and remains the mandatory security gate before filtered public history import.",
        "snapshot_token": "932d83cc8026df2c1bea0b2462aae2e0d0acc6d789d3a75cb8be681162d33a5c",
        "selected_ref": "case-gap:CASE-20260901-001:GAP-20260901-001-003",
        "comparison_summary": "Four unrelated Project gaps still require their own Cases; the selected migration security gap is ready, high risk, and directly blocks the authorized consolidation.",
        "fresh_discovery_summary": "The extraction confirmed 27 current assignment values needing isolation or owner review; the repeatable sanitized stage contains 701 files and no known blocked fingerprint, which exposes separate downstream obligations for filtered import and human credential/relicensing confirmation.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "uncertainty": "high"
            },
            "reason": "It is outside the repository consolidation Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Runtime resilience does not establish the private/public source boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This extraction supplies useful evidence but does not complete the broader independent Project validation."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record auditing is unrelated to private configuration extraction."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks sanitized public history import"
            },
            "reason": "It is the only ready Case gap and the accepted audit already defines its exact inputs and evidence gate."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-003",
        "responsibility": "agent",
        "goal": "Create the sibling private arckit-ops workspace, extract and quarantine every current non-public value or file without Git-tracking plaintext secrets, and establish a credential rotation handoff plus sanitized public replacements.",
        "reason": "The audit proved actual current credential-bearing sources exist, so public history import cannot begin until non-public material has an explicit private owner and the public HEAD inputs no longer contain those values.",
        "derived_from": [
          "FACT-20260901-001-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "dependency": "blocks sanitized public history import"
        },
        "evidence_required": [
          "Sibling arckit-ops structure and private git policy",
          "Ignored secret/quarantine extraction with no value leakage",
          "Credential rotation runbook and human handoff",
          "Sanitized public source staging inputs",
          "Repeat scan proving current import inputs contain no blocked fingerprints"
        ]
      },
      "planned_transition": {
        "goal": "Establish the private operational workspace and sanitized public import boundary defined by the accepted source audit.",
        "expected_state_change": "Current sensitive material is isolated in ignored private storage, owner rotation obligations are explicit, and deterministic public staging inputs contain no known blocked fingerprint."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-003",
          "status": "resolved",
          "outcome": "The sibling arckit-ops repository now tracks only private policy/configuration contracts while plaintext imports and quarantine copies remain Git ignored; the generated 701-file public stage contains none of the 13 blocked fingerprints and the owner rotation gate is documented.",
          "reason": "Private extraction, file permissions, Git-ignore enforcement, redacted rotation handoff, deterministic sanitization, and repeat scanning all produced the required evidence without emitting secret values.",
          "evidence": [
            "../arckit-ops/.gitignore",
            "../arckit-ops/runbooks/credential-rotation.md",
            "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
            "docs/monorepo/SANITIZED_STAGE_REPORT.json",
            "tools/scripts/bootstrap-arckit-ops.mjs",
            "tools/scripts/prepare-monorepo-import.mjs",
            "ops ignore policy: ok"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-004",
            "revision": 1,
            "status": "accepted",
            "statement": "A separate local arckit-ops Git workspace now owns private environment contracts, credential rotation records, and Git-ignored plaintext/quarantine material; a repeatable sanitized staging build mapped 701 current source files and found zero occurrences of all 13 known blocked fingerprints.",
            "basis": "The bootstrap and staging tools completed against the three audited source HEADs, verified representative secret targets with git check-ignore, enforced secret file mode 0600, emitted no secret values, and produced durable redacted reports.",
            "evidence": [
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "docs/monorepo/SANITIZED_STAGE_REPORT.json",
              "tools/scripts/bootstrap-arckit-ops.mjs",
              "tools/scripts/prepare-monorepo-import.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260901-001-003",
            "fact_id": "FACT-20260901-001-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "security_privacy_compliance",
              "revision": 6
            },
            "effect": "threatened",
            "reason": "Private extraction and current-source sanitization are now evidenced, but final reachable-history scanning and credential-owner rotation/invalidity confirmation remain mandatory before public push.",
            "gap_ids": [
              "GAP-20260901-001-004"
            ],
            "evidence": [
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "docs/monorepo/SANITIZED_STAGE_REPORT.json"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260901-001-004",
            "status": "open",
            "goal": "Import the three source repositories with filtered provenance into the accepted monorepo destinations, apply the license boundary and workspace governance, prove the resulting current tree and reachable imported history are free of blocked material, and prepare the exact human public-release gate.",
            "reason": "The sanitized inputs and private boundary are now accepted, so the authorized local consolidation can be realized without importing forbidden history and can establish the final evidence scope owners must approve before publication.",
            "derived_from": [
              "FACT-20260901-001-004"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "case completion",
              "risk": "high",
              "user_impact": "delivers requested monorepo"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Filtered source provenance in destination paths",
              "Root workspace and directory governance",
              "Per-surface license files and package metadata",
              "Current-tree and reachable-history secret scan",
              "Build and test evidence for imported components",
              "Final public-release handoff for credential and relicensing owners"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 331,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Private extraction changes publication safety and does not revise product behavior or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No interaction contract is changed by isolating operational material.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language fact or asset is decided in this gap.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The implemented private workspace, public staging generator, and reports directly realize the accepted monorepo public/private architecture.",
            "fact_refs": [
              "FACT-20260901-001-004"
            ],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md",
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "docs/monorepo/SANITIZED_STAGE_REPORT.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The claimed isolation is realized by a separate Git workspace, ignored mode-0600 secret files, deterministic sanitization, and zero blocked staging fingerprints.",
            "fact_refs": [
              "FACT-20260901-001-004"
            ],
            "evidence": [
              "tools/scripts/bootstrap-arckit-ops.mjs",
              "tools/scripts/prepare-monorepo-import.mjs",
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "docs/monorepo/SANITIZED_STAGE_REPORT.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Private and current-source controls are evidenced, but public reachable history still requires import-time proof and provider/owner-side rotation and relicensing evidence remains human responsibility.",
            "fact_refs": [
              "FACT-20260901-001-004"
            ],
            "evidence": [
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "docs/monorepo/SANITIZED_STAGE_REPORT.json"
            ],
            "gap_refs": [
              "GAP-20260901-001-004"
            ]
          }
        ]
      },
      "evidence": [
        "node --check tools/scripts/bootstrap-arckit-ops.mjs",
        "node --check tools/scripts/prepare-monorepo-import.mjs",
        "arckit-ops bootstrap: 3 ignored targets verified, 27 extracted values, zero secret values emitted",
        "sanitized stage: 701 files, 13 blocked fingerprints checked, zero found",
        "ops ignore policy: ok",
        "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
        "docs/monorepo/SANITIZED_STAGE_REPORT.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T05:17:55.900Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Accept the completed local monorepo migration and hand the final public-release gate to the repository and credential owners.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The monorepo import gap is the only ready Case obligation and the final Agent-owned result before the owner-controlled public release gate.",
        "snapshot_token": "4cc97262a1afc34df767cf4e8262b1ca958864c1878ea0c0c3b6991b68517692",
        "selected_ref": "case-gap:CASE-20260901-001:GAP-20260901-001-004",
        "comparison_summary": "Four unrelated Project gaps still require their own Cases; the selected migration gap is ready, high risk, directly required for Case completion, and now has complete local implementation and verification evidence.",
        "fresh_discovery_summary": "The local migration is complete and clean; the remaining credential-provider state, relicensing authority, remote publication, and source-repository archival decisions are a distinct human-owned release gate.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "It is outside the repository consolidation Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Runtime resilience is unrelated to completing the authorized source consolidation."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This migration supplies useful evidence but does not complete the broader independent Project validation."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record auditing is unrelated to the requested monorepo import."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "case completion",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "delivers requested monorepo"
            },
            "reason": "It is the sole ready Case gap and its implementation, provenance, security scan, licenses, builds, and tests are complete."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-004",
        "responsibility": "agent",
        "goal": "Import the three source repositories with filtered provenance into the accepted monorepo destinations, apply the license boundary and workspace governance, prove the resulting current tree and reachable imported history are free of blocked material, and prepare the exact human public-release gate.",
        "reason": "The sanitized inputs and private boundary are now accepted, so the authorized local consolidation can be realized without importing forbidden history and can establish the final evidence scope owners must approve before publication.",
        "derived_from": [
          "FACT-20260901-001-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "case completion",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "delivers requested monorepo"
        },
        "evidence_required": [
          "Filtered source provenance in destination paths",
          "Root workspace and directory governance",
          "Per-surface license files and package metadata",
          "Current-tree and reachable-history secret scan",
          "Build and test evidence for imported components",
          "Final public-release handoff for credential and relicensing owners"
        ]
      },
      "planned_transition": {
        "goal": "Accept the completed local monorepo migration and hand the final public-release gate to the repository and credential owners.",
        "expected_state_change": "The Agent-owned import gap is resolved with durable provenance, build, test, license, and security evidence; only explicit owner confirmations remain open."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-004",
          "status": "resolved",
          "outcome": "The three filtered source histories are merged into the governed Arckit monorepo destinations, root workspace and per-surface license boundaries are active, all supported builds and tests pass, and the final scan found zero sensitive paths and zero blocked fingerprints across 5,861 reachable text blobs.",
          "reason": "The imported commits, provenance record, directory and licensing changes, build/test results, and reachable-history scan satisfy every required item for the local consolidation.",
          "evidence": [
            "docs/monorepo/IMPORT_PROVENANCE.md",
            "docs/monorepo/VALIDATION.md",
            "commits b8cda68, 2f6a299, eb08eee, bdce54f, e14f3f4, c4dad71",
            "final history scan: 5,861 reachable text blobs, 0 sensitive paths, 0 blocked fingerprints"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-005",
            "revision": 1,
            "status": "accepted",
            "statement": "The Workshop API, Todo Web, and Workshop Feedback histories were filtered and merged into their accepted Arckit monorepo destinations; root workspace governance and per-surface license boundaries are applied, supported builds and tests pass, and the final scan of 5,861 reachable text blobs reports zero sensitive paths and zero blocked credential fingerprints.",
            "basis": "Six local migration commits preserve filtered provenance, integrate all public product surfaces, centralize JavaScript workspace locking, document the license boundary, and record successful JavaScript, Go, Electron, and iOS validation plus the final reachable-history security scan.",
            "evidence": [
              "docs/monorepo/IMPORT_PROVENANCE.md",
              "docs/monorepo/VALIDATION.md",
              "commits b8cda68, 2f6a299, eb08eee, bdce54f, e14f3f4, c4dad71"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260901-001-003",
            "fact_id": "FACT-20260901-001-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "security_privacy_compliance",
              "revision": 6
            },
            "effect": "threatened",
            "reason": "The local repository is sanitized and verified, but provider-side credential rotation, revocation, expiry or invalidity and the owners' relicensing and publication authority cannot be proven from the workspace.",
            "gap_ids": [
              "GAP-20260901-001-005"
            ],
            "evidence": [
              "docs/monorepo/VALIDATION.md",
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "../arckit-ops/runbooks/credential-rotation.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260901-001-005",
            "status": "open",
            "goal": "Confirm every credential runbook entry is rotated, revoked, expired, or otherwise invalid; confirm rights to apply the selected licenses; and decide whether to publish the merged history and archive the old source repositories.",
            "reason": "Credential-provider state, legal relicensing authority, remote publication, and repository archival are owner-controlled facts that cannot be established through local code or history inspection.",
            "derived_from": [
              "FACT-20260901-001-005"
            ],
            "blocked_by": [],
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks public push and source repository archival"
            },
            "responsibility": "human",
            "evidence_required": [
              "Completed ../arckit-ops/runbooks/credential-rotation.md with non-secret provider references",
              "Owner confirmation of Apache-2.0 and PolyForm Perimeter 1.0.1 relicensing rights",
              "Explicit authorization for remote push and source repository archival if desired"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 331,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The migration preserves the imported products' existing behavior and establishes no new product semantics.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Repository consolidation does not change an interaction contract.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Repository consolidation does not establish or revise visual-language facts.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The accepted monorepo architecture is realized with deterministic destination paths, filtered-history provenance, root workspace governance, explicit operator separation, and directory-level license boundaries.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "arckit/tech/repository-governance/monorepo-solution.md",
              "docs/monorepo/IMPORT_PROVENANCE.md",
              "package.json",
              "LICENSING.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted migration claim is realized by the imported commits, current directory tree, workspace lock, license files, successful supported builds/tests, and clean history scan.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "commits b8cda68, 2f6a299, eb08eee, bdce54f, e14f3f4, c4dad71",
              "docs/monorepo/VALIDATION.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Local source and history safety have strong evidence, while credential-provider invalidity, relicensing rights, and publication authorization remain owner-controlled and explicitly gated.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "docs/monorepo/VALIDATION.md",
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "../arckit-ops/runbooks/credential-rotation.md"
            ],
            "gap_refs": [
              "GAP-20260901-001-005"
            ]
          }
        ]
      },
      "evidence": [
        "commits b8cda68, 2f6a299, eb08eee, bdce54f, e14f3f4, c4dad71",
        "docs/monorepo/IMPORT_PROVENANCE.md",
        "docs/monorepo/VALIDATION.md",
        "final history scan: clean=true, 5,861 reachable text blobs, 0 sensitive paths, 0 blocked fingerprints",
        "root npm workspace install and three production builds passed",
        "Todo tests passed 7/7 and ArcOrbit tests passed 555 with 23 skipped",
        "go test ./... passed",
        "iOS simulator xcodebuild passed with code signing disabled"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T05:50:21.160Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Accept the corrected public/private credential boundary while preserving the human release gate.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "A completeness re-audit of the accepted security claim found one public-runtime credential and three source-history credentials omitted from the original catalog, making the bounded remediation the highest-risk Agent-owned work in the active Case.",
        "snapshot_token": "6c85c1d9bed41e7397e3483687f3040a1fc7c0b1997d82f28b8fca6f6b1b0ae8",
        "selected_ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-006",
        "comparison_summary": "Four Project gaps require separate Cases and the persisted release gap is human-owned; the fresh security remediation was immediately actionable, directly corrected an overstrong accepted claim, and reduced current-source exposure without taking owner-controlled release actions.",
        "fresh_discovery_summary": "The audit catalog and ops coverage omitted four credentials, ArcOrbit embedded one of them in its current public source, and the sensitive-path matcher failed to classify files below secrets and credentials directories.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "It is outside this repository-consolidation Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "General Runtime resilience is unrelated to correcting this migration security boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This Case contributes evidence but cannot close the broader cross-project security-validation obligation."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The independent cross-record audit still requires its own Case."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "It is human-owned and still requires provider, legal, publication, and archival decisions."
          },
          {
            "ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-006",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "risk": "critical",
              "user_impact": "prevents publishing an embedded credential"
            },
            "reason": "It was immediately actionable and removed the only cataloged credential from the current public tree while completing ops and scanner coverage."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-006",
        "goal": "Correct the incomplete credential inventory, remove the ArcOrbit credential from current public source, complete arckit-ops coverage, and make the audit gate detect the full known boundary.",
        "reason": "The prior security acceptance evidence covered only 13 fingerprints and overclaimed that all reachable history was clean.",
        "responsibility": "agent",
        "derived_from": [
          "FACT-20260901-001-005"
        ],
        "blocked_by": [],
        "priority_basis": {
          "risk": "critical",
          "user_impact": "prevents publishing an embedded credential"
        },
        "evidence_required": [
          "ArcOrbit current source contains no embedded Feedback credential",
          "Complete blocked-fingerprint catalog and corrected sensitive-path matching",
          "arckit-ops rotation and environment-contract coverage",
          "Current-tree, history, sanitized-stage, and product regression evidence"
        ]
      },
      "planned_transition": {
        "goal": "Accept the corrected public/private credential boundary while preserving the human release gate.",
        "expected_state_change": "The incomplete security claims are superseded by precise current-tree and history evidence; Agent-owned remediation is resolved and the remaining provider, legal, publication, archival, and optional history-rewrite decisions stay human-owned."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-006",
          "status": "resolved",
          "outcome": "ArcOrbit now receives Feedback credentials only through explicit operator configuration and fails closed when absent; the catalog covers 17 fingerprints, source staging excludes all 16 inherited fingerprints, arckit-ops covers all five product surfaces and all 17 rotation entries, and the corrected scan reports zero blocked fingerprints in current HEAD with exactly one ArcOrbit fingerprint remaining history-only.",
          "reason": "Public code, private contracts, audit tooling, regenerated staging evidence, focused and full regression evidence, and post-commit history scanning agree on the corrected boundary.",
          "evidence": [
            "commit 27d8e48",
            "arckit-ops commit b318717",
            "tools/monorepo/blocked-secret-fingerprints.json",
            "docs/monorepo/VALIDATION.md",
            "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
            "sanitized stage: 707 files, 16 fingerprints checked, 0 found",
            "post-commit audit: 5,882 reachable text blobs, 0 current blocked, 1 history-only blocked",
            "ArcOrbit regression: 556 passed, 23 skipped, 0 functional failures"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-004",
            "revision": 2,
            "status": "accepted",
            "statement": "The sibling arckit-ops repository has a clean 20-file tracked policy surface with 15 environment contracts and a 17-entry redacted rotation gate; four plaintext or quarantine targets remain Git ignored with mode 0600, and the regenerated 707-file sanitized stage contains none of the 16 source-import blocked fingerprints.",
            "basis": "The corrected private extraction inventory, committed ops contracts, ignore and permission checks, tracked-tree scan, and regenerated source stage provide repeatable redacted evidence.",
            "evidence": [
              "../arckit-ops commit b318717",
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "docs/monorepo/SANITIZED_STAGE_REPORT.json",
              "tools/scripts/bootstrap-arckit-ops.mjs",
              "tools/scripts/prepare-monorepo-import.mjs"
            ]
          },
          {
            "id": "FACT-20260901-001-005",
            "revision": 2,
            "status": "accepted",
            "statement": "The merged monorepo current HEAD contains none of the 17 cataloged blocked credential fingerprints, ArcOrbit obtains its Feedback credential only from explicit operator configuration and fails closed when unconfigured, and one removed ArcOrbit credential remains reachable only through pre-existing local history pending owner rotation or revocation and any separately authorized history rewrite.",
            "basis": "The security remediation commit, full catalog scan, product regression evidence, and corrected validation report distinguish current-tree safety from the remaining history and owner gates.",
            "evidence": [
              "commit 27d8e48",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/env.example",
              "tools/monorepo/blocked-secret-fingerprints.json",
              "docs/monorepo/VALIDATION.md",
              "post-commit audit: 0 current blocked, 1 history-only blocked"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260901-001-004",
            "revision": 1,
            "reason": "The original private extraction inventory counted only 13 fingerprints, 27 assignments, 701 files, and three ignored targets; the completeness audit established broader exact counts.",
            "evidence": [
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "docs/monorepo/SANITIZED_STAGE_REPORT.json"
            ]
          },
          {
            "id": "FACT-20260901-001-005",
            "revision": 1,
            "reason": "The original claim that no blocked fingerprint remained reachable was too strong because one ArcOrbit credential existed in current source and remains in pre-existing history after current-source remediation.",
            "evidence": [
              "commit 27d8e48",
              "docs/monorepo/VALIDATION.md",
              "post-commit audit: 0 current blocked, 1 history-only blocked"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260901-001-003",
            "fact_id": "FACT-20260901-001-005",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "security_privacy_compliance",
              "revision": 6
            },
            "effect": "threatened",
            "reason": "Current public source is clean and the boundary is complete, but all 17 provider-side statuses remain pending, one removed ArcOrbit credential remains history-reachable, and relicensing and publication authority remain owner-controlled.",
            "gap_ids": [
              "GAP-20260901-001-005"
            ],
            "evidence": [
              "docs/monorepo/VALIDATION.md",
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
              "../arckit-ops/runbooks/credential-rotation.md"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 331,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "ArcOrbit's Feedback capability remains available under an explicit operator contract and its unconfigured behavior is durably documented and regression tested.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "runtime/arcorbit/README.md",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/test/product-feedback-service.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The normal configured Feedback journey is unchanged; this round changes only the operator-owned credential source and fail-closed deployment boundary.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language or presentation rule changed.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The public/private boundary now has one shared fingerprint catalog, explicit operator injection, fail-closed runtime behavior, complete ops contracts, and precise current-versus-history evidence.",
            "fact_refs": [
              "FACT-20260901-001-004",
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "commit 27d8e48",
              "arckit-ops commit b318717",
              "runtime/arcorbit/README.md",
              "tools/monorepo/blocked-secret-fingerprints.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The corrected accepted facts are realized by both local commits, the clean current-tree audit, the exact history-only result, private ignore and permission checks, and passing regressions.",
            "fact_refs": [
              "FACT-20260901-001-004",
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "commit 27d8e48",
              "arckit-ops commit b318717",
              "docs/monorepo/VALIDATION.md",
              "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The local exposure boundary is now measured precisely, while provider invalidity, history publication, relicensing rights, remote push, and archival still require owner evidence and decisions.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "docs/monorepo/VALIDATION.md",
              "../arckit-ops/runbooks/credential-rotation.md",
              "post-commit audit: 0 current blocked, 1 history-only blocked"
            ],
            "gap_refs": [
              "GAP-20260901-001-005"
            ]
          }
        ]
      },
      "evidence": [
        "commit 27d8e48",
        "arckit-ops commit b318717",
        "docs/monorepo/VALIDATION.md",
        "docs/monorepo/PRIVATE_EXTRACTION_REPORT.md",
        "sanitized stage: 707 files, 16 fingerprints checked, 0 found",
        "post-commit audit: 5,882 reachable text blobs, 0 current blocked, 1 history-only blocked",
        "ArcOrbit focused regression: 73 passed",
        "ArcOrbit aggregate regression: 556 passed, 23 skipped, 0 functional failures"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T07:10:53.678Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Accept the verified private arckit-ops remote without changing the remaining public-release gate.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "The repository owner explicitly authorized creating a private remote for the already-established arckit-ops boundary, making remote creation and verified private publication the only actionable work in scope.",
        "snapshot_token": "a2228877ca7da5d0a153663d167824e2928b7a99c9d9c2acd7c17f14e04e5f6d",
        "selected_ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-007",
        "comparison_summary": "Four Project gaps require separate Cases and GAP-005 still contains broader human credential, legal, public-release, and archival decisions; the fresh private-remote gap was explicitly authorized, bounded, and independently verifiable.",
        "fresh_discovery_summary": "The owner required arckit-ops to exist as a private remote repository; GitHub authentication was restored and the organization namespace, permissions, target availability, and local tracked boundary were verified before creation.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Outside this consolidation Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Unrelated to private repository publication."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This action contributes evidence but does not close the broader Project validation gap."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Requires its own Case."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "Private ops publication is only one bounded part; credential, licensing, public push, and archival decisions remain unresolved."
          },
          {
            "ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-007",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "user_impact": "establishes the required private remote",
              "risk": "high"
            },
            "reason": "It was directly authorized and could be accepted through independent GitHub visibility, branch, commit, and tree verification."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-007",
        "goal": "Create the arckit-ops GitHub repository as private, connect the local repository, push main, and verify the remote contains only the approved tracked boundary.",
        "reason": "The established local private operations repository required a durable private remote under the Arckit organization.",
        "responsibility": "agent",
        "derived_from": [
          "FACT-20260901-001-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "user_impact": "establishes the required private remote",
          "risk": "high"
        },
        "evidence_required": [
          "GitHub visibility is PRIVATE",
          "main tracks origin/main",
          "remote commit equals local HEAD",
          "remote tree contains no ignored secret material"
        ]
      },
      "planned_transition": {
        "goal": "Accept the verified private arckit-ops remote without changing the remaining public-release gate.",
        "expected_state_change": "The private operations repository has a verified GitHub remote and synchronized main branch; credential, licensing, public Arckit publication, and archival obligations remain open."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-007",
          "status": "resolved",
          "outcome": "GitHub repository feitianchengzi/arckit-ops exists with PRIVATE visibility, default branch main, and local main tracking origin/main at commit b318717; its remote tree has 20 tracked files and only secrets/README.md below secrets/.",
          "reason": "GitHub metadata, local/remote commit equality, branch tracking, and remote tree inspection independently verify the requested private publication boundary.",
          "evidence": [
            "https://github.com/feitianchengzi/arckit-ops",
            "GitHub visibility: PRIVATE",
            "local HEAD and origin/main: b318717",
            "remote tracked files: 20",
            "remote secrets tree: secrets/README.md only"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-006",
            "revision": 1,
            "status": "accepted",
            "statement": "The repository owner explicitly authorized private publication of arckit-ops, and feitianchengzi/arckit-ops now exists on GitHub with PRIVATE visibility; main is synchronized at b318717 and the 20-file remote tracked tree excludes all ignored plaintext and quarantine material.",
            "basis": "Direct owner authorization plus GitHub visibility metadata, branch synchronization, commit equality, and remote tree inspection.",
            "evidence": [
              "Current user instruction, 2026-09-01",
              "https://github.com/feitianchengzi/arckit-ops",
              "GitHub visibility: PRIVATE",
              "local HEAD and origin/main: b318717",
              "remote secrets tree: secrets/README.md only"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 331,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Creating the private operations remote does not change product capability or behavior.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No user journey or interaction contract changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual expectation changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The accepted sibling-private-repository boundary is now durably realized on GitHub with verified visibility, branch, commit, and tracked-tree evidence.",
            "fact_refs": [
              "FACT-20260901-001-006"
            ],
            "evidence": [
              "https://github.com/feitianchengzi/arckit-ops",
              "GitHub visibility: PRIVATE",
              "remote tracked files: 20"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The private remote claim is realized exactly by the synchronized GitHub repository and excludes ignored secret material.",
            "fact_refs": [
              "FACT-20260901-001-006"
            ],
            "evidence": [
              "local HEAD and origin/main: b318717",
              "remote secrets tree: secrets/README.md only"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Private repository exposure is controlled and verified, but provider invalidity, relicensing rights, public Arckit publication, history handling, and archival still require owner evidence and decisions.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "GitHub visibility: PRIVATE",
              "../arckit-ops/runbooks/credential-rotation.md"
            ],
            "gap_refs": [
              "GAP-20260901-001-005"
            ]
          }
        ]
      },
      "evidence": [
        "https://github.com/feitianchengzi/arckit-ops",
        "GitHub visibility: PRIVATE",
        "main tracks origin/main",
        "local HEAD and origin/main: b318717",
        "remote tracked files: 20",
        "remote secrets tree: secrets/README.md only"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T09:31:16.887Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Accept the monorepo-aware ArcOrbit packaging workflow without changing the private operations or release-authorization boundary.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "The repository owner authorized the bounded ArcOrbit packaging-workflow correction after the monorepo migration; the stale dependency-lock path was immediately actionable and could be verified without consuming the human release gate.",
        "snapshot_token": "c01b880f5a764186f2198e2e24c9688540cd6eee88c89f0fe35c66a5cb3cc2da",
        "selected_ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-008",
        "comparison_summary": "Four Project gaps require separate Cases and GAP-005 remains human-owned; the fresh packaging repair directly completes a migration follow-up, is isolated to the governed workflow and its regression test, and does not authorize release or secret handling changes.",
        "fresh_discovery_summary": "The ArcOrbit workflow referenced runtime/arcorbit/package-lock.json in both jobs even though the monorepo has one root package-lock.json; root npm workspace resolution confirmed that dependency installation belongs to the repository root.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "It requires a separate Case and is unrelated to the packaging lockfile repair."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "General Runtime resilience and adapters are outside this monorepo packaging correction."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "The workflow preserves the existing secret boundary but does not perform the broader real-project security validation."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The independent cross-record audit requires its own Case."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "It remains human-owned and covers credential, licensing, public publication, history, and archival decisions that this packaging repair must not consume."
          },
          {
            "ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-008",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "prevents the governed packaging workflow from resolving its npm cache dependency",
              "user_impact": "restores ArcOrbit CI packaging after monorepo migration"
            },
            "reason": "The owner explicitly authorized it, its scope was already established, and focused regression evidence can prove the correction."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-008",
        "goal": "Update the ArcOrbit GitHub packaging workflow to consume the monorepo root dependency lock and install from the workspace root, with regression coverage that prevents the stale child-lock path from returning.",
        "reason": "The Todo and Feedback consolidation removed per-workspace lockfiles, but both ArcOrbit packaging jobs still configured setup-node against runtime/arcorbit/package-lock.json.",
        "responsibility": "agent",
        "derived_from": [
          "FACT-20260901-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "prevents the governed packaging workflow from resolving its npm cache dependency",
          "user_impact": "restores ArcOrbit CI packaging after monorepo migration"
        },
        "evidence_required": [
          "Both workflow jobs cache against the root package-lock.json",
          "Both workflow jobs run npm ci from the repository root",
          "ArcOrbit package-distribution regression passes",
          "The workflow remains independent of arckit-ops and runtime feedback credentials"
        ]
      },
      "planned_transition": {
        "goal": "Accept the monorepo-aware ArcOrbit packaging workflow without changing the private operations or release-authorization boundary.",
        "expected_state_change": "The validate and package jobs use the single root lockfile and root workspace installation; a focused test rejects the removed child lockfile and child-directory npm ci configuration."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-008",
          "status": "resolved",
          "outcome": "Both ArcOrbit workflow jobs now use package-lock.json for setup-node caching and execute npm ci from the repository root; the packaging regression explicitly verifies both occurrences and rejects runtime/arcorbit/package-lock.json and child-directory npm ci.",
          "reason": "The workflow diff matches the monorepo workspace contract, npm prefix resolves the root from runtime/arcorbit, the focused distribution test passes 4/4, and git diff --check reports no errors.",
          "evidence": [
            ".github/workflows/arcorbit-package.yml",
            "runtime/arcorbit/test/package-distribution.test.mjs",
            "node --test runtime/arcorbit/test/package-distribution.test.mjs: 4 passed, 0 failed",
            "git diff --check: passed",
            "npm prefix from runtime/arcorbit: repository root"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-007",
            "revision": 1,
            "status": "accepted",
            "statement": "The governed ArcOrbit packaging workflow is monorepo-aware: both jobs cache the root package-lock.json and perform the workspace installation from the repository root, while ArcOrbit-specific checks and packaging continue under runtime/arcorbit and no arckit-ops checkout or feedback credential embedding is introduced.",
            "basis": "The workflow implementation, root npm workspace resolution, explicit regression assertions, and passing package-distribution tests establish the current packaging boundary.",
            "evidence": [
              ".github/workflows/arcorbit-package.yml",
              "runtime/arcorbit/test/package-distribution.test.mjs",
              "node --test runtime/arcorbit/test/package-distribution.test.mjs: 4 passed, 0 failed",
              "npm prefix from runtime/arcorbit: repository root"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 336,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This correction changes CI dependency installation only and does not establish or revise an ArcOrbit product capability or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No user action, application state, feedback, navigation, or recovery semantics change.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language or presentation rule changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The workflow now directly follows the repository's single-root-lock workspace contract and preserves the explicit runtime-only private configuration boundary.",
            "fact_refs": [
              "FACT-20260901-001-007"
            ],
            "evidence": [
              ".github/workflows/arcorbit-package.yml",
              "package.json",
              "package-lock.json",
              "runtime/arcorbit/README.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted packaging fact is realized by both workflow job definitions and guarded by focused regression assertions that pass.",
            "fact_refs": [
              "FACT-20260901-001-007"
            ],
            "evidence": [
              ".github/workflows/arcorbit-package.yml",
              "runtime/arcorbit/test/package-distribution.test.mjs",
              "node --test runtime/arcorbit/test/package-distribution.test.mjs: 4 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The CI lockfile regression is controlled by focused tests, but the pre-existing credential-provider, relicensing, public publication, history, and archival risks remain owner-controlled and unresolved.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/package-distribution.test.mjs",
              "../arckit-ops/runbooks/credential-rotation.md"
            ],
            "gap_refs": [
              "GAP-20260901-001-005"
            ]
          }
        ]
      },
      "evidence": [
        ".github/workflows/arcorbit-package.yml",
        "runtime/arcorbit/test/package-distribution.test.mjs",
        "node --test runtime/arcorbit/test/package-distribution.test.mjs: 4 passed, 0 failed",
        "git diff --check: passed",
        "npm prefix from runtime/arcorbit: repository root"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-03T05:47:09.558Z"
    },
    {
      "round": 8,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Accept an evidence-backed compatibility conclusion for the owner's existing local packaging command.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "The owner asked whether the established local ArcOrbit packaging command still needs migration changes; a bounded compatibility check was immediately actionable and precedes any optional convenience enhancement.",
        "snapshot_token": "670729ac06aac15f955c172e86b873219ac67ff80aaf8641fe4aa6226096bbc0",
        "selected_ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-009",
        "comparison_summary": "Four Project gaps require separate Cases and GAP-005 remains human-owned; the fresh local-packaging compatibility check directly verifies the migrated repository's operator workflow without changing secrets, release authorization, or unrelated Runtime behavior.",
        "fresh_discovery_summary": "The exact command relies on the host-native target and a hard-coded generated filename; the current host, build plan, workspace dependency tree, source boundaries, and focused tests were inspected to distinguish required migration work from an optional stable-alias improvement.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "It requires a separate Case and is unrelated to local packaging compatibility."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "General Runtime resilience and adapters are outside this packaging command check."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "The check confirms no arckit-ops dependency but does not complete broader security validation."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The independent cross-record audit requires its own Case."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "It remains human-owned and is not altered by validating an unsigned local development package."
          },
          {
            "ref": "fresh-gap:CASE-20260901-001:GAP-20260901-001-009",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "user_impact": "confirms the operator's established local build command",
              "uncertainty": "whether monorepo migration invalidated the script"
            },
            "reason": "It was explicitly requested and could be resolved through read-only host, plan, dependency, source, and regression evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-001-009",
        "goal": "Determine whether the existing package:local command and its ArcOrbit-local.dmg copy step require changes after the monorepo and private-ops split.",
        "reason": "The command predates the completed repository consolidation and hard-codes the generated x64 artifact name.",
        "responsibility": "agent",
        "derived_from": [
          "FACT-20260901-001-002",
          "FACT-20260901-001-007"
        ],
        "blocked_by": [],
        "priority_basis": {
          "user_impact": "confirms the operator's established local build command",
          "uncertainty": "whether monorepo migration invalidated the script"
        },
        "evidence_required": [
          "Current host and selected package target",
          "Resolved Arckit and ArcForge repository roots",
          "Expected shellfix artifact filename acceptance",
          "Monorepo workspace dependency resolution",
          "Focused local-distribution regression result",
          "No arckit-ops dependency"
        ]
      },
      "planned_transition": {
        "goal": "Accept an evidence-backed compatibility conclusion for the owner's existing local packaging command.",
        "expected_state_change": "The Case records whether migration requires a script change and clearly separates any optional stable-output convenience from required compatibility work."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-001-009",
          "status": "resolved",
          "outcome": "No migration-driven local packaging script change is required. On the current darwin/x64 host, build-id shellfix selects package:mac:x64 and accepts ArcOrbit-0.1.0-local.shellfix-local-shellfix-mac-x64.dmg; the command resolves Arckit and sibling ArcForge correctly, uses the installed root workspace dependencies, and never reads arckit-ops. The final cp is valid now but remains intentionally coupled to version, build ID, and architecture.",
          "reason": "Pure build-plan evaluation, npm workspace inspection, the script's explicit repository boundaries, help invocation, and four passing local-distribution tests agree on the current behavior without requiring a full installer build.",
          "evidence": [
            "runtime/arcorbit/scripts/build-local-distribution.mjs",
            "runtime/arcorbit/test/local-distribution-build.test.mjs",
            "runtime/arcorbit/README.md",
            "node --test runtime/arcorbit/test/local-distribution-build.test.mjs: 4 passed, 0 failed",
            "host probe: x86_64 and darwin/x64",
            "build plan: macos-x64 and expected shellfix artifact accepted",
            "npm ls --workspace @arckit/arcorbit --depth=0: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-001-008",
            "revision": 1,
            "status": "accepted",
            "statement": "The local ArcOrbit package:local flow remains valid after consolidation: it resolves the Arckit root and sibling ArcForge root from runtime/arcorbit, builds only the current host-native unsigned target, consumes the monorepo-installed workspace dependencies, and has no arckit-ops dependency. On the current darwin/x64 host with version 0.1.0 and build ID shellfix, the generated DMG name is ArcOrbit-0.1.0-local.shellfix-local-shellfix-mac-x64.dmg; copying that file to ArcOrbit-local.dmg works but is coupled to those three naming inputs.",
            "basis": "The implementation, host and plan probes, npm workspace tree, exact filename matcher, and focused regression tests establish both compatibility and the bounded hard-coding risk.",
            "evidence": [
              "runtime/arcorbit/scripts/build-local-distribution.mjs",
              "runtime/arcorbit/test/local-distribution-build.test.mjs",
              "node --test runtime/arcorbit/test/local-distribution-build.test.mjs: 4 passed, 0 failed",
              "host probe: x86_64 and darwin/x64",
              "build plan: expected shellfix artifact accepted",
              "npm ls --workspace @arckit/arcorbit --depth=0: passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 336,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This round verifies an operator build command and does not establish or revise product capability or acceptance behavior.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No application interaction, navigation, state, feedback, or recovery semantics change.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language or presentation rule changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The local build boundary is directly recoverable from code and documentation: Arckit and ArcForge are explicit inputs, host-native unsigned output is deliberate, and arckit-ops remains outside the build graph.",
            "fact_refs": [
              "FACT-20260901-001-008"
            ],
            "evidence": [
              "runtime/arcorbit/scripts/build-local-distribution.mjs",
              "runtime/arcorbit/README.md",
              "package.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted compatibility fact is realized by the current host plan, exact artifact matcher, resolved workspace tree, and passing focused tests.",
            "fact_refs": [
              "FACT-20260901-001-008"
            ],
            "evidence": [
              "runtime/arcorbit/test/local-distribution-build.test.mjs",
              "node --test runtime/arcorbit/test/local-distribution-build.test.mjs: 4 passed, 0 failed",
              "build plan: expected shellfix artifact accepted"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The local filename coupling is bounded and evidenced, but the pre-existing credential-provider, relicensing, public publication, history, and archival risks remain owner-controlled and unresolved.",
            "fact_refs": [
              "FACT-20260901-001-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/local-distribution-build.test.mjs",
              "../arckit-ops/runbooks/credential-rotation.md"
            ],
            "gap_refs": [
              "GAP-20260901-001-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/scripts/build-local-distribution.mjs",
        "runtime/arcorbit/test/local-distribution-build.test.mjs",
        "runtime/arcorbit/README.md",
        "node --test runtime/arcorbit/test/local-distribution-build.test.mjs: 4 passed, 0 failed",
        "host probe: x86_64 and darwin/x64",
        "build plan: expected shellfix artifact accepted",
        "npm ls --workspace @arckit/arcorbit --depth=0: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-03T05:54:52.452Z"
    }
  ],
  "case_resolution": {
    "status": "unresolved",
    "stage": "working",
    "satisfied": [
      "GAP-20260901-001-001",
      "GAP-20260901-001-002",
      "GAP-20260901-001-003",
      "GAP-20260901-001-004",
      "GAP-20260901-001-006",
      "GAP-20260901-001-007",
      "GAP-20260901-001-008",
      "GAP-20260901-001-009"
    ],
    "remaining": [
      "GAP-20260901-001-005",
      "impact:IMPACT-20260901-001-003"
    ],
    "blocked": [],
    "reason": "2 Case obligation(s) remain.",
    "candidate_gaps": [
      {
        "id": "GAP-20260901-001-005",
        "responsibility": "human",
        "goal": "Confirm every credential runbook entry is rotated, revoked, expired, or otherwise invalid; confirm rights to apply the selected licenses; and decide whether to publish the merged history and archive the old source repositories.",
        "reason": "Credential-provider state, legal relicensing authority, remote publication, and repository archival are owner-controlled facts that cannot be established through local code or history inspection.",
        "derived_from": [
          "FACT-20260901-001-005"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "dependency": "blocks public push and source repository archival"
        },
        "evidence_required": [
          "Completed ../arckit-ops/runbooks/credential-rotation.md with non-secret provider references",
          "Owner confirmation of Apache-2.0 and PolyForm Perimeter 1.0.1 relicensing rights",
          "Explicit authorization for remote push and source repository archival if desired"
        ]
      }
    ],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "needs_human",
      "next_responsibility": "human",
      "agent_continuation_available": false,
      "human_decision_required": true,
      "trigger_mode": "user_decision",
      "responsibility_reason": "Credential-provider state, legal relicensing authority, remote publication, and repository archival are owner-controlled facts that cannot be established through local code or history inspection.",
      "next_prompt": "",
      "human_gate": {
        "required": true,
        "reason": "Credential-provider state, legal relicensing authority, remote publication, and repository archival are owner-controlled facts that cannot be established through local code or history inspection.",
        "decision_needed": "Confirm every credential runbook entry is rotated, revoked, expired, or otherwise invalid; confirm rights to apply the selected licenses; and decide whether to publish the merged history and archive the old source repositories."
      }
    },
    "updated_at": "2026-09-03T05:54:52.452Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
