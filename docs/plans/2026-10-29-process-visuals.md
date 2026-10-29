# Process Visuals Implementation Plan

> Execute the agreed design in this session. Preserve existing uncommitted explanation rules; no commit or push requested.

**Goal:** Keep I/O unchanged while giving agents a free-form P canvas with smooth, controllable example playback and stable annotations.

**Architecture:** Add optional `visual` to an output derivation and to a running-example output. Each visual contains agent-authored HTML/SVG frames and isolated CSS. The existing template owns step/play/pause/replay controls, keyed-object transitions and frame annotations. Existing text-only models keep working. No new packages, video pipeline or task-code execution.

**Tech Stack:** Existing Node scripts/tests, native Shadow DOM and Web Animations.

## Design

- Retain current I/O DOM, styling, content and provenance. Only P changes.
- Reuse paper #ffffff, ink #1e3028, green #285b43, muted #58695f; add slate #3e6173 only in the example for a second data role. Keep existing typography.
- P uses a quiet white stage, one current caption, compact transport controls and frame annotations. Static visual = one frame. No prescribed chart/card shape.
- Agent-authored frames must show actual relationships or data changes. Stable `data-key` objects carry between frames; animate their position/size and fade arrivals/departures. Default paused; never loop automatically. Reduced motion skips tweening.
- Existing derivation/example-change notes remain accessible in folded text notes. New frame anchors are mode/output-specific.

## Tasks

1. Add model validation and feedback anchors; tests cover static/multi-frame visuals, bad identities and cross-output anchors.
   Files: `skills/ipo-dev/scripts/lib.mjs`, `tests/process-visual.test.mjs`.
2. Add free-form isolated visual rendering, playback lifecycle, smooth keyed transitions and annotations without changing I/O.
   File: `skills/ipo-dev/assets/review.html`.
3. Add a self-contained authoring reference and runnable example generator. Demonstrate filtering, aggregation and formatting with different visual expressions; retain the same underlying order case.
   Files: `skills/ipo-dev/assets/process-example.mjs`, `skills/ipo-dev/references/process-visuals.md`, `SKILL.md`, `references/format.md`.
4. Run Node tests and skill validation; inspect desktop/mobile, playback/pause/replay, mode navigation, drafts, frame-note persistence and legacy fallback in a browser. Synchronize only changed files to the real Desktop skill, after checking source hashes.

## Delivery

Provide preview URL and generated example HTML. Leave main demo and its feedback untouched. No Git commit/push in this request.
