# Running Example Player Implementation Plan

**Goal:** Preview one concrete example evolving continuously from input through an LLM prompt and response to a calculated output, with a draggable playhead.

**Architecture:** An independent prototype under `prototypes/running-example/` on `ipo-run-example`. Persistent HTML/SVG objects are animated by one paused GSAP timeline; all visible state is derived from the playhead. A local build script packages the page into a standalone HTML. The current skill and renderer remain unchanged.

**Tech Stack:** HTML/CSS, GSAP 3.15.0 (vendored with its license), plain JavaScript, Node built-in tests and local HTTP server.

## Design

- Pale work surface #f4f6f9, paper #ffffff, ink #243348, source blue #4568bc, eligible teal #237d6e, excluded clay #aa6545.
- Use existing system Chinese fonts with tabular numerals and Bahnschrift for amounts. Left-aligned titles and current-action copy; a large central illustration and quiet transport dock.
- Subject: a short expense note containing lunch 38, taxi 46, coffee 22. Show the exact prompt, an explicitly illustrative model extraction, filtering to meals/transport, and calculation 38 + 46 = 84.
- Treat inputs as tangible note lines that travel into the prompt, become categorized records, then become operands and the final receipt. Avoid a generic grid of I/P/O boxes.
- Continuous drag seeks the shared timeline directly. Play/pause/replay and named cue buttons share that playhead. Static hold regions allow reading; reverse and random seeks must reproduce the same state.
- Prompt/data drawer is available without leaving the canvas. No model API calls, new skill installation, or changes to existing annotations.

## Tasks

1. Add example data, exact prompt and scene metadata; test arithmetic, categorization, cue ordering and clamping.
2. Build the persistent-object stage and GSAP timeline, responsive layouts, keyboard/screen-reader controls and reduced-motion behavior.
3. Add a local-only preview server and portable HTML build script. Verify vendor integrity against npm SHA-512 and preserve the license.
4. Test desktop/mobile layouts, intermediate scrubbing, backward/random seeking, playback lifecycle and drawer interactions. Capture the actual UI and synchronize only this prototype into the branch; no commit/push requested.
