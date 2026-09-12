# Engineering built-in Skills management verification

## Accepted boundary

- Engineering projects only trusted `builtin:*` entries from the installed ArcOrbit catalog.
- User-level, project-level, other catalog and local-directory Skills are absent from the snapshot, list, counts, search, errors and scene binding. Unrelated native Skills keep their Codex availability; non-trusted same-name copies remain subject only to the existing thread-level source-trust suppression and are never edited or exposed by Engineering.
- The main-process mutation boundary rejects non-built-in ids. Renderer filtering is a second defensive boundary, not the authority.
- Setup Readiness continues to own installation, updates and cleanup. Engineering owns only post-install Chat and Automation usage modes.

## Interaction result

- The first view includes scope, scene, activation timing, four comparable counts, search, status filter and a compact three-column inventory.
- Mode changes save in place; Automation core remains visible and locked. Search and status filters compose, and the no-match state clears both in one action.
- Refresh failure preserves the last successful inventory. Narrow windows collapse the summary and table without horizontal overflow.
- The Chat entry and return path preserve the existing session and draft.

## Verification

- `node --test runtime/arcorbit/test/engineering-surface.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs`: 68 passed, 0 failed.
- `node --test runtime/arcorbit/test/scene-skills.test.mjs`: 19 passed, 0 failed.
- Focused scene discovery and Codex integration were included in the combined focused run; the only conditional real-Codex tests remained skipped by their existing environment gate.
- `runtime/arcorbit/node_modules/.bin/electron runtime/arcorbit/test/fixtures/engineering-electron.mjs`: passed with 14 built-in Skills, user Skill hidden, forged non-built-in update rejected, core protected, Chat draft preserved and 800px layout free of horizontal overflow.
- `npm test --workspace @arckit/arcorbit`: 738 tests discovered; 705 passed, 31 conditionally skipped and 2 unrelated Electron tests could not launch a GUI inside the filesystem sandbox. Both were rerun with GUI authorization and passed 2/2.
- Changed JavaScript files passed `node --check`; `git diff --check` passed.

## Visual inspection

`/private/tmp/arcorbit-engineering.png` records the real Electron projection used for this round's inspection. The implementation follows the existing ArcOrbit visual strategy: neutral surfaces, 8px density rhythm, 36px controls, at least 11px visible metadata, compact status labels and a table-led hierarchy.
