# PDF Annotations

Project notes for PDF annotations in Thorium Reader.

This project tracks application-level PDF text highlights. Thorium remains the source of truth for note identity, metadata, and persistence; the PDF.js webview captures selections, converts geometry, and renders highlight overlays through the existing PDF event bus.

## Documents

- [PLAN.md](PLAN.md) - product and engineering rollout plan.
- [SPEC.md](SPEC.md) - first-slice implementation contract and algorithms.
- [REVIEW.md](REVIEW.md) - static review notes, risks, and follow-up gates.
- [TODO.md](TODO.md) - developer-centric task list from current branch to finished project.
- [UNIT_TESTS.md](UNIT_TESTS.md) - unit-test strategy, required coverage, priorities, and proposed test files.
- [harness/README.md](harness/README.md) - standalone PDF.js browser harness for manual annotation testing outside Thorium.

## Technical Decision Rule

Agents must demonstrate and critique every technical or algorithmic choice that affects this project.

A valid technical decision includes:

- Context: the problem being solved.
- Decision: the chosen approach.
- Demonstration: why the approach works, using data flow, invariants, examples, complexity notes, or tests when relevant.
- Critique: tradeoffs, limitations, failure modes, and risks.
- Alternatives: meaningful options rejected or deferred, with reasons.
- Revisit trigger: the future condition that should make the team reconsider the choice.

No implementation-facing change is complete until its technical choices are demonstrated and critiqued in the relevant project document or changelog entry.

## PDF.js Reference Checkout

The local PDF.js source checkout belongs under `vendor/pdf.js`. The `vendor/` directory is intentionally ignored so references to the packaged `pdf.js` dependency do not require tracking a copy from `node_modules`.
