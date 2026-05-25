# PDF Annotations Review

## Scope

Review date: 2026-05-24

Observed branch: `feat/pdf-annotations`

This review covers the current PDF annotations slices: application-level PDF text highlights created from PDF.js selections, persisted as Thorium notes, rendered back into the PDF webview as overlays, listed in the annotation panel, navigated from the panel back to the PDF highlight, edited or deleted from the panel, and selected from a click on the rendered PDF highlight.

No Electron runtime test was performed during this review. The notes below are based on static reading of the branch and the project documentation.

## Manual Validation

2026-05-24: The standalone PDF.js annotation harness was manually validated by the project owner and reported as working. This confirms the external harness entry point can exercise PDF highlight creation and overlay rendering outside Thorium. This does not replace the remaining Thorium runtime checks for persistence, Electron webview behavior, annotation panel integration, EPUB regression, zoom/rotation QA, or cross-page selection rejection.

## Automated Validation

2026-05-24: Implemented and ran the P0 PDF annotation unit-test set through the repository Jest config. Covered geometry edge cases, note/transport converters, extracted host orchestration helpers, PDF-vs-EPUB trigger routing, webview selection rejection and draft creation, snapshot sync, invalid sync payload rejection, overlay rendering, geometry-change redraws, and teardown with fakes. Result: 4 PDF annotation test suites passed, 55 tests passed. A full `tsc --noEmit --project tsconfig.jest.json` check was attempted but remains blocked by existing repository-wide CommonJS/ESM diagnostics outside the P0 unit-test slice.

2026-05-24: Added and ran the Playwright standalone harness smoke test. The test builds and serves the harness, opens `standalone.html`, waits for the injected PDF.js harness panel, creates a real browser selection in the PDF.js text layer, creates a highlight, verifies an in-memory annotation and non-zero overlay, clears it, and verifies removal. Result: passed locally with Playwright Chromium.

2026-05-24: Fixed Jest module resolution for the PDF annotation geometry unit tests. `annotationGeometry.test.ts` now runs through the repository Jest config and passes with 8 tests. A representative existing Jest test, `test/utils/iso8601.test.ts`, also passes after the mapper fix.

2026-05-24: Fixed the R1 annotation panel `locatorExtended` assumption. Added `pdfAnnotationPanel.ts` helpers and unit tests for PDF quote/page display, PDF page/rectangle sorting, and edit-save payloads preserving `pdfAnnotation`. Result: 5 PDF annotation Jest suites passed, 61 tests passed. A full `tsc --noEmit --project tsconfig.jest.json` check was attempted again but remains blocked by existing repository-wide CommonJS/ESM diagnostics outside this PDF annotation slice.

2026-05-24: Implemented the slice 2 read-only interaction path. PDF annotations are shown as read-only cards, panel clicks dispatch `viewer:go-to-annotation`, the webview scrolls to the target page/rect and flashes the rendered highlight, and the PDF panel hides Readium annotation import/export controls. Result: 5 PDF annotation Jest suites passed, 70 tests passed. A full `tsc --noEmit --project tsconfig.jest.json` check was attempted again but remains blocked by existing repository-wide CommonJS/ESM diagnostics outside this PDF annotation slice.

2026-05-24: Implemented the slice 3 editing and deletion path. PDF annotations now transport color and draw type, panel save payloads edit comment/color/style/tags while preserving `pdfAnnotation`, panel deletion uses the existing note removal path, and the webview redraws edited or deleted overlays from full `annotations:sync` snapshots. Result: 5 PDF annotation Jest suites passed, 76 tests passed. The standalone Playwright harness test reported `ok` for create/style/navigate/delete; the wrapper process timed out after the passing result while waiting on harness server shutdown, and no Node harness server remained afterward.

2026-05-24: Fixed the standalone Playwright harness server lifecycle by exporting explicit start/close helpers from `serve.mjs` and owning the server from the Playwright test `beforeAll`/`afterAll` hooks instead of relying on implicit `webServer` teardown. Result: the create/style/navigate/delete harness test passed and the Playwright command exited cleanly.

2026-05-24: Implemented the slice 4 overlay click selection path. PDF highlights remain passive with `pointer-events: none`; the webview hit-tests click geometry and emits `annotation:selected`, `Reader.tsx` opens/focuses the matching annotation panel card, and `Shift+click` enters the existing edit surface. Result: 5 PDF annotation Jest suites passed, 82 tests passed. The standalone Playwright harness also passed after clicking a rendered highlight and verifying `annotation:selected`.

2026-05-24: Hardened the slice 4 review findings. Overlay click selection now requires the click target or point to originate from a PDF page element before geometry matching, and host panel routing validates `annotation:selected` source, rect index, rect shape, and modifier-state fields before opening the panel. Result: 5 PDF annotation Jest suites passed, 82 tests passed; standalone Playwright harness passed.

2026-05-25: Implemented slice 5 runtime stabilization. Draft validation now rejects invalid page, type, rect, and quote values before note persistence; failed selection capture emits `annotation:selection-error`; validation failures trigger a static error toast; non-quick PDF annotation creation opens the header annotation edit popover before persistence; normal PDF annotation logs are gated behind explicit debug flags/namespaces; the harness covers controlled invalid selection, zoom visibility, rotation visibility, click selection, deletion, and no selection after deletion. Result: 6 PDF annotation Jest suites passed, 91 tests passed; standalone Playwright harness passed.

2026-05-25: Added the UX-only clickable cursor hint for rendered PDF highlights. The webview now uses document-level pointermove hit-testing to apply a temporary pointer cursor over highlights while keeping overlay elements passive with `pointer-events: none`. Result: 6 PDF annotation Jest suites passed, 92 tests passed.

2026-05-25: Fixed the `Shift+click` edit regression when PDF.js still exposes an active text selection. The webview now confirms a highlight hit before applying the active-selection guard, lets `Shift+click` dispatch `annotation:selected`, and still rejects simple clicks during active selection. Result: Jest PDF coverage added for this regression.

2026-05-25: Corrected the PDF instant/quick creation split. `ReaderMenu.tsx` still forwards the existing `advancedMode` state to the PDF webview, and the controller still debounces PDF.js `selectionchange`, reuses `selectionToDraft()`, deduplicates unchanged selections, and dispatches `source: "instant-selection"`. The host now treats instant mode as automatic creation only: when quick creation is disabled, instant and explicit PDF creation open the header editor before persistence; when quick creation is enabled, both persist silently. Result: unit coverage now locks instant and quick as independent checkboxes.

2026-05-25: Connected the annotation panel hide checkbox to PDF overlay visibility. `Reader.tsx` now maps `annotation_defaultDrawView === "hide"` to `annotations:set-visibility`, and the PDF.js controller removes or restores overlay layers from the current snapshot without mutating persisted notes. Hidden overlays cannot be selected and do not show the clickable cursor hint. Result: targeted Jest and harness checks cover hide/show behavior.

2026-05-25: Applied the latest review decisions. Host creation now rejects `annotation:create-requested` payloads that carry a draft with missing or unknown `source`, reports the invalid source through explicit host debug diagnostics, and avoids persistence. The hide checkbox remains overlay-only and does not filter annotation panel cards. PDF annotation progression sort now follows visual reading order: page, visual top, left, then id. Result: 6 PDF annotation Jest suites passed, 99 tests passed; modified source files passed targeted ESLint; direct ESLint on the two touched Jest files still reports pre-existing Prettier formatting across those files.

2026-05-25: Fixed the complete test-suite review findings. Reader-level PDF create/visibility decisions are now extracted into tested helpers consumed by `Reader.tsx`; `ReaderMenu.tsx` uses a tested progression comparator; webview tests cover private PDF.js EventBus compatibility, invalid instant/visibility payloads, and navigation marker alignment/fallback; the Playwright harness is split into six independent scenarios; touched Jest files are Prettier-formatted. Result: 7 PDF annotation Jest suites passed, 109 tests passed; targeted ESLint passed for modified source and touched Jest files; harness TypeScript passed; standalone Playwright harness passed with 6 tests.

2026-05-25: Additional slice 5 checks were attempted without `npm run` because local `npm` is 10.9.4 while `package.json` requires npm `>=11.15.0` through `devEngines`. Direct checks passed for PDF sources with `eslint --no-ignore`, `Reader.tsx` lint, harness TypeScript lint, the standalone harness Playwright command, and `webpack --config webpack.config.renderer-pdf.js`. A repository-wide `tsc --noEmit --project tsconfig.jest.json` check still fails on existing CommonJS/ESM diagnostics in dependencies such as `inversify`, `node-fetch`, `debounce`, `pdf.js`, and other non-PDF files; after fixing the slice-local narrowing issue, the filtered TypeScript output no longer reports PDF annotation files.

## Summary

The first-slice architecture is sound:

- Thorium remains the source of truth for notes and persistence.
- The PDF.js webview handles selection, coordinate conversion, and rendering.
- Communication uses the existing `pdf-eventbus`.
- The webview sends drafts, selection events, and typed selection diagnostics only; the host validates drafts, creates canonical notes, and owns panel state.
- `annotations:sync` gives the webview a replace-all snapshot, which keeps the first slice simple.

The main follow-up risks are not in the basic creation, navigation, editing, deletion, overlay click loop, or runtime draft validation. They sit around keyboard-accessible overlay focus, overlapping highlight policy, PDF.js integration assumptions, true cross-page browser selection automation, localized selection-error microcopy, and real Electron/PDF.js runtime coverage.

## Fixed Review Findings

### F1 - Invalid `annotations:sync` Payload Guard

Status: fixed in slice 1.

The webview controller now rejects missing or non-array `annotations:sync` payloads before clearing the current snapshot. Invalid payloads are logged with `console.error` and ignored, so existing overlays remain intact.

Why this fix is in scope:

- It protects the first-slice snapshot contract without introducing full P1 transport validation.
- It prevents malformed runtime messages from clearing valid rendered annotations.
- It is covered by a unit test using the existing fake Thorium bus and fake DOM setup.

### F2 - Host Create-Request Return Shape

Status: fixed in slice 1.

`handlePdfAnnotationCreateRequested()` now returns `noteDraft` for the pre-persistence note payload and `createdNote` for the canonical note returned by `action.payload.newNote`.

Why this fix is in scope:

- The host helper is exported and covered by P0 unit tests, so its return shape should not mislead future callers.
- Thorium remains the source of truth for `uuid`, identity, and canonical note metadata.
- The sync path already uses the canonical created note; the fix makes the helper contract match that behavior.

### F3 - Host Inversion-Of-Control Naming

Status: fixed in slice 1.

`pdfAnnotationHost.ts` now names its host boundary `IPdfAnnotationCreateRequestHostAdapter`, split into `state` and `ports`. `Reader.tsx` provides the current publication/note metadata as state, then adapts Redux and the PDF event bus into `persistNoteInRedux` and `syncAnnotationsToPdfWebview`, so the helper contract names the side-effect boundary rather than hiding it behind a generic `dependencies` object.

Why this fix is in scope:

- The host helper is the boundary between deterministic PDF annotation logic and Thorium host side effects.
- Clear port names make it explicit that Redux persistence and PDF webview sync are provided by `Reader.tsx`.
- The change keeps `pdfAnnotationHost.ts` testable without importing Redux, the store, or the PDF event bus.

### F4 - Annotation Panel PDF Target Branch

Status: fixed in slice 1.

`ReaderMenu.tsx` now uses a PDF-aware panel helper for annotation card text, page metadata, location sorting, and future edit-save payload construction. PDF annotation cards can render from `note.pdfAnnotation.quote` and `note.pdfAnnotation.page` when `locatorExtended` is absent, and save-payload helpers preserve the `pdfAnnotation` target instead of rebuilding an EPUB-only note.

Why this fix is in scope:

- The first slice creates persisted PDF notes, so the existing annotation panel must tolerate notes without EPUB locator data.
- PDF annotation identity and target geometry live in `pdfAnnotation`; losing that field during a future panel save would orphan the note from the PDF overlay synchronization path.
- The logic is extracted into `pdfAnnotationPanel.ts` so the PDF-vs-EPUB branching can be unit-tested without mounting the reader UI.

Known residual limits:

- PDF annotation cards are intentionally read-only until editing and deletion have their own preservation and synchronization contracts.
- Edited color/style still do not affect the PDF overlay until R2 extends the transport contract.

### F5 - Read-Only Panel Navigation

Status: fixed in slice 2.

`ReaderMenu.tsx` now builds a validated PDF navigation target from `note.uuid`, `note.pdfAnnotation.page`, and the first normalized rectangle. `Reader.tsx` dispatches that target as `viewer:go-to-annotation`, and `PdfAnnotationController` resolves the target by id with page/rect fallback, scrolls the PDF viewer, aligns the target rectangle, and briefly flashes matching overlays.

Why this fix is in scope:

- The first slice made PDF annotations persistent and visible; slice 2 needs a read-only way to return from the panel to the PDF evidence.
- Using id plus page/rect keeps Thorium identity canonical while still allowing navigation if the webview has not rendered the matching id yet.
- Keeping edit/delete controls hidden for PDF notes prevents panel actions from mutating or removing PDF targets before those contracts are designed.

Known residual limits:

- The flash is a visual locator, not an accessible selected state.
- The navigation test uses JSDOM and fake PDF.js APIs; real scroll behavior still needs Electron/PDF.js runtime QA.
- The fallback uses the first rectangle only, which is acceptable for one-page first-slice highlights but will need revision for multi-page or richer annotation targets.

### F6 - PDF Panel Readium Import/Export Leak

Status: fixed in slice 2.

`ReaderMenu.tsx` now hides the Readium annotation import/export controls when the active reader is PDF. The decision is centralized through `canUseReadiumAnnotationImportExport()` in `pdfAnnotationPanel.ts`, with a unit test proving the PDF context is excluded while non-PDF readers keep the existing exchange path.

Why this fix is in scope:

- Slice 2 makes the PDF annotation panel visible, so it must not expose EPUB/Readium exchange actions for page/rectangle PDF targets.
- The existing export converter expects locator/selector-oriented annotations and currently emits EPUB-oriented metadata.
- Hiding the controls preserves the read-only PDF panel contract without designing the later PDF-specific export/import format prematurely.

Known residual limits:

- PDF annotation export/import remains a future slice.
- This test proves the decision helper, not the full React toolbar rendering.

### F7 - Panel Interaction Decision Coverage

Status: fixed in slice 2 and updated for slice 3.

`ReaderMenu.tsx` now delegates annotation panel navigation, edit/delete availability, and bulk-delete filtering to pure helpers in `pdfAnnotationPanel.ts`. The unit tests cover PDF edit/delete action decisions, EPUB edit/delete preservation, bulk delete inclusion for PDF annotations, EPUB-vs-PDF navigation routing, and invalid PDF navigation rejection before panel dispatch.

Why this fix is in scope:

- Slice 2 and slice 3 behavior depends on panel clicks and edit/delete controls, not only on lower-level PDF geometry.
- The existing test stack has no React Testing Library or Enzyme pattern, so pure decision helpers give deterministic coverage without pulling in Redux/Electron component mounting.
- Using the helpers in `ReaderMenu.tsx` keeps the tested model connected to the panel implementation.

Known residual limits:

- These are still model-level tests, not full rendered DOM tests.
- A future React component test should be added if the project introduces a standard React test harness.

### F8 - Event Contract Documentation Drift

Status: fixed in slice 2.

`SPEC.md` now documents all nine PDF annotation event-bus extensions: `annotations:sync`, `annotations:set-instant-mode`, `annotations:set-visibility`, `highlight:create-from-selection`, `annotations:ready`, `annotation:create-requested`, `viewer:go-to-annotation`, `annotation:selected`, and `annotation:selection-error`. The spec also includes `TPdfAnnotationNavigationTarget`, `TPdfAnnotationSelectionTarget`, `TPdfAnnotationSelectionErrorPayload`, the host/webview event directions, and the id-first then page/rect fallback rule for panel navigation.

Why this fix is in scope:

- Slice 2 added a new event contract, so the implementation spec must not describe only the first-slice four-event surface.
- The PDF event bus is the architectural boundary between `Reader.tsx` and the PDF.js webview.
- Keeping the event contract complete prevents future agents from treating `viewer:go-to-annotation` as an undocumented local convention.

Known residual limits:

- The spec mirrors the current TypeScript types and draft validation helper, but it does not validate every `annotations:sync` transport field yet.

### F9 - Runtime Draft Validation And Debug Log Gating

Status: fixed in slice 5.

`pdfAnnotationValidation.ts` now validates host creation drafts before persistence. The host also rejects draft-bearing create requests with missing or unknown `source` values before persistence and sends those diagnostics through explicit `debug` namespaces. The webview reuses the rectangle validation rule after coordinate conversion, validation failures trigger a static error toast from `Reader.tsx`, explicit and instant non-quick creation open the header annotation edit popover before persistence, and normal controller logs are hidden unless `window.__THORIUM_PDF_ANNOTATIONS_DEBUG` is enabled.

Why this fix is in scope:

- Runtime bus payloads can be malformed even when TypeScript types are correct at compile time.
- The `source` value controls whether creation is explicit or instant, so accepting an unknown source would make editor-opening behavior ambiguous.
- Rejecting invalid drafts before `readerActions.note.addUpdate` keeps Thorium note state canonical.
- Gating verbose logs reduces PDF annotation noise while keeping host contract rejections behind explicit debug namespaces.

Known residual limits:

- `annotations:sync` still has only a minimal payload guard plus per-annotation id guard; a full runtime transport schema remains a later hardening task.
- The host shows a static validation error toast, but localized product microcopy remains a later UX task.

## Out-Of-Scope Review Findings

### OOS1 - Late `annotations:ready` After Controller Destruction

Scope status: out of scope for slice 1.

Severity if addressed later: low to medium.

`PdfAnnotationController.init()` can schedule `onPdfReady` with `window.setTimeout()` when the PDF document is already available. `destroy()` currently removes bus subscriptions, PDF.js listeners, scheduled animation-frame renders, overlays, and local state, but it does not track or cancel that zero-delay ready timeout.

Why this is out of scope:

- The first slice focuses on annotation creation, note persistence handoff, snapshot sync, and passive overlay rendering.
- The P0 tests already cover the normal `annotations:ready` path and teardown of subscriptions, overlays, local state, and animation-frame renders.
- Fixing late ready dispatch after destroy belongs to broader webview/controller lifecycle hardening, not to the first-slice annotation data path.

Known residual risk:

- A PDF webview destroyed immediately after initialization could still dispatch a late `annotations:ready`.

Revisit trigger:

- Revisit when the project takes on lifecycle hardening, repeated PDF webview mount/unmount stress tests, or observed duplicate/late ready events in Thorium runtime QA.

## Major Risks

### R2 - Color and style transport

Status: fixed in slice 3 for application-owned PDF overlays.

Severity: medium to high

Thorium notes persist `color` and `drawType`; slice 3 now sends them through `TPdfAnnotationTransport` and renders `solid_background`, `underline`, `strikethrough`, and `outline` in the PDF webview.

Impact:

- Color and style edits are reflected in application overlays after snapshot sync.
- Native PDF annotation style, print rendering, and export/import style remain separate future contracts.

Mitigation:

- Keep note-to-transport conversion centralized.
- Keep unsupported draw types falling back to `solid_background`.
- Revisit native PDF style, print, and export/import separately.

### R3 - PDF.js internal dependencies

Severity: high

The controller depends on PDF.js page DOM shape, `data-page-number`, viewport conversion APIs, and a compatibility fallback to `_pages`.

Impact:

- A PDF.js fork update can break selection capture or rendering without TypeScript errors.

Mitigation:

- Keep all PDF.js-specific assumptions isolated in `webview/annotations.ts`.
- Add geometry tests around conversion helpers where practical.
- Add a manual upgrade checklist for PDF.js changes.

### R4 - Multi-page selection is rejected, but future data is not ready

Severity: medium

Rejecting multi-page selection is correct for slice 1 because the target stores a single page. Future support needs either multiple page targets or grouped rectangles by page.

Mitigation:

- Design a future `targets` shape before accepting cross-page selection.
- Do not silently reinterpret multi-page selections as one-page notes.

### R5 - Failed selection capture feedback is incomplete

Severity: low after slice 5

Status: reduced in slice 5.

Empty, invalid, or multi-page selections no longer fail silently at the integration boundary. The webview emits `annotation:selection-error` with a typed reason, and the host logs it as a dedicated PDF annotation diagnostic while showing a static error toast.

Impact:

- Users get a visible generic error, but product copy still needs to map these reasons to localized toast or status text.

Mitigation:

- Keep the typed reasons stable: `empty`, `no-usable-rects`, `multi-page`, `missing-page`, `missing-viewport`, and `invalid-rects`.
- Map invalid selection reasons to localized UI feedback in a later UX slice.
- Preserve the current diagnostic event as feedback plumbing, not as a lifecycle event bus.

### R6 - Overlay click selection is pointer-light, not keyboard-complete

Severity: medium

Slice 4 deliberately keeps PDF highlight DOM passive and uses document-level hit-testing for mouse/pointer clicks. This preserves text selection ergonomics but does not make the overlay itself focusable or keyboard-operable.

Mitigation:

- Keep panel focus as the accessible destination after a click.
- Add explicit keyboard-accessible overlay focus behavior before treating PDF highlights as fully interactive controls.
- Revisit overlap policy if users report ambiguous clicks on stacked highlights.

### R6 - Export/import remains PDF-specific work

Severity: medium

Readium annotation export/import is selector-oriented. PDF annotations are page/rectangle based.

Mitigation:

- Add a PDF-specific target representation.
- Include page, rects, quote, color, draw type, comment, creator, and timestamps.

### R7 - Print support is not covered by viewer overlays

Severity: medium

Viewer overlay DOM does not automatically apply to PDF.js print rendering.

Mitigation:

- Treat print as a separate phase.
- Decide whether print support belongs in PDF.js print services or Thorium-specific print preparation.

### R8 - Full snapshot synchronization

Severity: low to medium

`annotations:sync` replaces the entire webview map. This is simple and correct for the MVP, but may become inefficient for large annotation sets.

Mitigation:

- Keep snapshot sync for correctness now.
- Add patch events only when interaction volume justifies it.

### R9 - Missing automated tests

Severity: high

The first slice touches cross-process events, persisted state, and PDF geometry. Manual checks are not enough for long-term stability.

Mitigation:

- Unit-test converters.
- Add synchronization tests around repeated sync and note changes where feasible.
- Add a manual PDF geometry checklist until browser-level tests are available.

### R10 - Search domains are separate

Severity: medium

PDF text search, native PDF annotations, and Thorium application annotations are separate systems.

Mitigation:

- Start with parent-side application annotation search.
- Keep native PDF annotation search as a separate design decision.

## Evolution Gates

Read-only panel gate completed in slice 2:

- PDF annotation cards must render from `pdfAnnotation`, not `locatorExtended`.
- Sorting and labels must tolerate missing EPUB locators.

Navigation gate completed in slice 2:

- Added `viewer:go-to-annotation`.
- Navigation targets the annotation id first, then falls back to page/rect and aligns the first rectangle.

Editing gate completed in slice 3:

- Transport color/style to the webview.
- Preserve `pdfAnnotation` in every note update path.
- Add tests for comment/color/tag edits.

Deletion gate completed in slice 3:

- Use full snapshot refresh instead of a delete patch event.
- Ensure deleted overlays disappear after note state changes.

Before multi-page selection:

- Extend persisted geometry to support multiple pages.
- Extend rendering and panel display accordingly.

Before export/import:

- Define a PDF target format.

Before print:

- Prototype a print path separately from the viewer overlay path.

## Review Checklist

First-slice checks:

- `INoteState` includes `pdfAnnotation?: IPdfTextAnnotationTarget`.
- `pdfAnnotation` lives in common persisted state.
- Event payloads are wired into `IPdfPlayerEvent`, not detached helper types.
- `annotation:create-requested` carries a draft without id or metadata.
- The host creates the canonical note and echoes official state.
- `annotations:sync` clears webview overlays when sent an empty list.
- Selection capture rejects empty and multi-page selections.
- Coordinate conversion uses PDF.js viewport helpers.
- Overlay rendering is passive and does not block text selection or PDF controls.
- Zoom and rotation clear stale overlays before redraw.
- PDF-specific code does not alter the EPUB annotation flow.

Follow-up checks:

- PDF annotations remain editable only through save paths that preserve `pdfAnnotation`.
- Color/style transport exists before color editing.
