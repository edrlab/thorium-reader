# PDF Annotations Unit Test Plan

## Purpose

This document defines the unit-test surface needed for the PDF annotations
project.

It focuses on tests that can run in Jest without launching Thorium, Electron,
PDF.js, or the standalone browser harness. Browser automation remains covered by
the harness Playwright tests; this document is for deterministic unit coverage.

## Unit-Test Boundary

Included as unit tests:

- pure geometry helpers;
- note and transport converters;
- host-side orchestration that can be extracted into pure helpers;
- webview controller behavior with fake DOM, fake PDF.js viewport objects, and a fake event bus;
- future pure helpers for panel display, navigation payloads, edit preservation, deletion, search, export/import, and print preparation.

Excluded from unit tests:

- real PDF.js viewer rendering;
- Playwright browser harness behavior;
- Electron webview lifecycle;
- Thorium IPC;
- Redux store integration beyond pure action/payload helpers;
- PDF event bus lifecycle hardening, which is out of scope for this project;
- multi-PDF publication behavior, which is not allowed by project policy.

## Priority Legend

- `P0` - required to finish the first slice safely.
- `P1` - required for stable core architecture before adding user-facing slices.
- `P2` - required when the corresponding future capability is implemented.

Status:

- `Existing` - already covered in the current branch.
- `Needed` - should be added.
- `Later` - add when the feature slice exists.

## Existing Unit Coverage

### Geometry Helpers

File:

- `test/renderer/reader/pdf/webview/annotationGeometry.test.ts`

Current coverage:

- `isUsableSelectionRect()` accepts visible rectangles and rejects too-small rectangles.
- `rectIntersectionArea()` computes partial overlap and no-overlap cases.
- `findBestPageForRect()` chooses the largest valid page intersection and ignores invalid page numbers.
- `clientRectToPageViewportRect()` subtracts page borders and clamps to viewport bounds.
- `clientRectToPageViewportRect()` rejects rectangles outside the page after clamping.
- `normalizePdfRect()` orders PDF coordinates.
- `pageViewportRectToPdfRect()` works with a fake viewport.
- `clientRectToPdfRect()` works without PDF.js by injecting a fake viewport.

### Converter Helpers

File:

- `test/renderer/reader/pdf/pdfAnnotationConverters.test.ts`

Current coverage:

- PDF annotation note filtering.
- Note-to-transport mapping.
- Draft-to-note mapping.
- Mutation safety for rects, color, and creator metadata.

### Host Helpers

File:

- `test/renderer/reader/pdf/pdfAnnotationHost.test.ts`

Current coverage:

- Snapshot construction and deduplication.
- Create-request payload handling.
- Create-request return value distinguishes the pre-persistence note draft from the canonical created note.
- Created-note sync snapshot behavior.
- PDF-vs-EPUB annotation trigger routing.

### Annotation Panel Helpers

File:

- `test/renderer/reader/pdf/pdfAnnotationPanel.test.ts`

Current coverage:

- PDF quote/page display without `locatorExtended`.
- EPUB locator text precedence.
- PDF page/rectangle sorting.
- PDF and EPUB panel navigation decision models.
- Invalid PDF navigation target rejection before panel dispatch.
- PDF read-only action availability.
- Bulk delete exclusion for PDF annotations.
- Readium annotation import/export exclusion in PDF reader context.
- Save payload preservation for `pdfAnnotation` and EPUB locator data.

### Webview Controller

File:

- `test/renderer/reader/pdf/webview/annotations.test.ts`

Current coverage:

- Thorium and PDF.js event subscriptions.
- Snapshot replacement.
- Invalid `annotations:sync` payload rejection without clearing the current snapshot.
- Selection rejection and draft creation.
- Ready, page-rendered, geometry-change, and destroy behavior.
- Passive overlay rendering.

## P0 Tests Implemented For First Slice

### Geometry Edge Cases

Target module:

- `src/renderer/reader/pdf/webview/annotationGeometry.ts`

Add or extend:

- `P0 Existing` `isUsableSelectionRect()` default minimum-size behavior.
- `P0 Existing` `rectWidth()` uses explicit `width` when present.
- `P0 Existing` `rectWidth()` derives width from `right - left` when `width` is absent.
- `P0 Existing` `rectHeight()` uses explicit `height` when present.
- `P0 Existing` `rectHeight()` derives height from `bottom - top` when `height` is absent.
- `P0 Existing` `isUsableSelectionRect()` supports a custom minimum size.
- `P0 Existing` `isUsableSelectionRect()` rejects zero, negative, and sub-minimum dimensions.
- `P0 Existing` `rectIntersectionArea()` returns expected area for partial overlap.
- `P0 Existing` `rectIntersectionArea()` returns zero when rectangles only touch at an edge.
- `P0 Existing` `rectIntersectionArea()` handles full containment.
- `P0 Existing` `findBestPageForRect()` ignores invalid page numbers.
- `P0 Existing` `findBestPageForRect()` returns `undefined` when every intersection is zero.
- `P0 Existing` `findBestPageForRect()` keeps deterministic behavior when two pages have equal area.
- `P0 Existing` `clamp()` returns the value inside bounds.
- `P0 Existing` `clamp()` returns the min below bounds.
- `P0 Existing` `clamp()` returns the max above bounds.
- `P0 Existing` `clientRectToPageViewportRect()` subtracts page position and border widths.
- `P0 Existing` `clientRectToPageViewportRect()` clamps overflow to viewport bounds.
- `P0 Existing` `clientRectToPageViewportRect()` preserves valid fractional coordinates.
- `P0 Existing` `clientRectToPageViewportRect()` rejects rectangles narrower than one viewport pixel after clamping.
- `P0 Existing` `clientRectToPageViewportRect()` rejects rectangles shorter than one viewport pixel after clamping.
- `P0 Existing` `normalizePdfRect()` normalizes reversed coordinates.
- `P0 Existing` `normalizePdfRect()` preserves already ordered coordinates.
- `P0 Existing` `pageViewportRectToPdfRect()` delegates conversion to `convertToPdfPoint()`.
- `P0 Existing` `pageViewportRectToPdfRect()` normalizes a fake rotated viewport where converted points are reversed.
- `P0 Existing` `clientRectToPdfRect()` returns a PDF rect for a valid client rect.
- `P0 Existing` `clientRectToPdfRect()` returns `undefined` when page-local conversion rejects the rect.

### PDF Annotation Converters

Target module:

- `src/renderer/reader/pdf/pdfAnnotationConverters.ts`

Proposed test file:

- `test/renderer/reader/pdf/pdfAnnotationConverters.test.ts`

Add:

- `P0 Existing` `filterPdfAnnotationNotes()` keeps notes where `group === "annotation"` and `pdfAnnotation` is present.
- `P0 Existing` `filterPdfAnnotationNotes()` rejects annotation notes without `pdfAnnotation`.
- `P0 Existing` `filterPdfAnnotationNotes()` rejects non-annotation notes even if they contain `pdfAnnotation`.
- `P0 Existing` `filterPdfAnnotationNotes()` preserves input order.
- `P0 Existing` `noteToPdfAnnotation()` maps `uuid` to transport `id`.
- `P0 Existing` `noteToPdfAnnotation()` maps type, page, rects, and quote exactly.
- `P0 Existing` `noteToPdfAnnotation()` maps note color and draw type to transport style.
- `P0 Existing` `noteToPdfAnnotation()` falls back to `solid_background` for unsupported PDF draw types.
- `P0 Existing` `noteToPdfAnnotation()` returns `undefined` for non-annotation notes.
- `P0 Existing` `noteToPdfAnnotation()` returns `undefined` for annotation notes without `pdfAnnotation`.
- `P0 Existing` `noteToPdfAnnotation()` deep-copies rects and color so later note mutation does not mutate transport output.
- `P0 Existing` `noteToPdfAnnotation()` preserves `quote: undefined` without inventing an empty string.
- `P0 Existing` `pdfAnnotationDraftToNote()` maps type, page, rects, and quote to `note.pdfAnnotation`.
- `P0 Existing` `pdfAnnotationDraftToNote()` sets first-slice defaults: `group: "annotation"`, `textualValue: ""`, `tags: []`, and `drawType: EDrawType.solid_background`.
- `P0 Existing` `pdfAnnotationDraftToNote()` maps context color, creator, index, and created timestamp.
- `P0 Existing` `pdfAnnotationDraftToNote()` deep-copies color, creator, and rects.
- `P0 Existing` `pdfAnnotationDraftToNote()` handles missing optional creator.
- `P0 Existing` `pdfAnnotationDraftToNote()` preserves multi-rect order.

### Host-Side PDF Annotation Orchestration

Current implementation surface:

- `src/renderer/reader/components/Reader.tsx`

Extraction implemented for unit testing:

- `src/renderer/reader/pdf/pdfAnnotationHost.ts`
- `src/renderer/reader/pdf/pdfAnnotationReader.ts`

Pure helpers:

- `buildPdfAnnotationTransportList(notes, extraNote?)`
- `createPdfAnnotationNoteDraft(payload, context)`
- `handlePdfAnnotationCreateRequested(payload, host)`
- `triggerPdfAnnotation(isPdf, fromKeyboard, dispatchPdfHighlightCreateFromSelection, triggerEpubAnnotation)`
- `getPdfAnnotationCreatePresentation(payload, options)`
- `buildPdfAnnotationDraftEditorTransport(payload, context)`
- `getPdfAnnotationVisibilityPayload(annotationDefaultDrawView)`
- `IPdfAnnotationCreateRequestHostState`
- `IPdfAnnotationCreateRequestHostPorts`
- `IPdfAnnotationCreateRequestHostAdapter`

Add:

- `P0 Existing` transport list includes only notes accepted by `filterPdfAnnotationNotes()`.
- `P0 Existing` transport list converts every accepted note with `noteToPdfAnnotation()`.
- `P0 Existing` transport list includes `extraNote` when provided.
- `P0 Existing` transport list deduplicates by annotation id.
- `P0 Existing` transport list gives `extraNote` precedence when it has the same id as an existing note.
- `P0 Existing` transport list preserves deterministic order for existing notes.
- `P0 Existing` transport list reflects edited color and draw type.
- `P0 Existing` transport list excludes deleted PDF notes because absent notes are absent from the next snapshot.
- `P0 Existing` create-request handling ignores missing payload or missing draft.
- `P0 Existing` create-request handling rejects missing or unknown runtime source values before persistence and reports the invalid source through host diagnostics.
- `P0 Existing` create-request handling passes default color, creator, next index, and current timestamp to `pdfAnnotationDraftToNote()`.
- `P0 Existing` create-request handling dispatches one `addUpdatePdfAnnotationNote` action with the publication id.
- `P0 Existing` create-request handling emits a sync snapshot that includes the newly created note returned by the action.
- `P0 Existing` annotation trigger dispatches `highlight:create-from-selection` when the active reader is PDF.
- `P0 Existing` annotation trigger calls the existing EPUB annotation path when the active reader is not PDF.
- `P0 Existing` Reader create presentation opens the header draft editor for non-quick explicit or instant PDF creation.
- `P0 Existing` Reader create presentation keeps quick PDF creation on the immediate persistence path independently from instant mode.
- `P0 Existing` Reader header draft transport validates source and defensively copies the PDF target.
- `P0 Existing` Reader visibility payload maps `hide` to `visible: false` and keeps `annotation` / `margin` visible.

Notes:

- Do not add unit tests for PDF event bus lifecycle hardening.
- Keep these tests focused on payload construction and routing decisions, not Electron IPC or actual Redux store behavior.

### Webview Controller With Fakes

Target module:

- `src/renderer/reader/pdf/webview/annotations.ts`

Proposed test file:

- `test/renderer/reader/pdf/webview/annotations.test.ts`

Test style:

- Use Jest with a fake event bus.
- Use a fake `PDFViewerApplication`.
- Use `document` fixtures only for small page elements and overlay nodes.
- Use fake PDF.js viewport objects with `convertToPdfPoint()` and `convertToViewportRectangle()`.

Add:

- `P0 Existing` `init()` subscribes to `annotations:sync` and `highlight:create-from-selection`.
- `P0 Existing` `init()` registers supported PDF.js event listeners when an event bus is present.
- `P0 Existing` `init()` and `destroy()` support private PDF.js EventBus `_on` / `_off` methods.
- `P0 Existing` `init()` is idempotent when called twice.
- `P0 Existing` `annotations:sync` replaces the local annotation snapshot rather than appending.
- `P0 Existing` `annotations:sync` ignores annotations without ids.
- `P0 Existing` `annotations:sync` ignores invalid payloads without clearing the current snapshot.
- `P0 Existing` empty `annotations:sync` removes existing overlay layers.
- `P0 Existing` `highlight:create-from-selection` does not dispatch a draft for an empty selection.
- `P0 Existing` `highlight:create-from-selection` does not dispatch a draft when all selection rects are too small.
- `P0 Existing` `highlight:create-from-selection` rejects a selection whose rect does not intersect any PDF page.
- `P0 Existing` `highlight:create-from-selection` rejects multi-page selections.
- `P0 Existing` `highlight:create-from-selection` rejects when page element or viewport is missing.
- `P0 Existing` `highlight:create-from-selection` dispatches `annotation:create-requested` with one-page PDF rects for a valid selection.
- `P0 Existing` explicit selection creation dispatches `annotation:create-requested` with source `highlight:create-from-selection`.
- `P0 Existing` valid selection draft preserves selected quote text.
- `P0 Existing` valid selection draft contains no id, timestamp, creator, color, or draw type.
- `P0 Existing` `annotations:ready` is dispatched once when PDF geometry is available.
- `P0 Existing` `pagerendered` renders only the reported page when `pageNumber` is present.
- `P0 Existing` `pagerendered` falls back to full render when payload has no page number.
- `P0 Existing` scale or rotation changes remove stale overlays before scheduled redraw.
- `P0 Existing` `destroy()` removes local bus subscriptions, clears overlay DOM, clears state, and cancels scheduled renders.
- `P0 Existing` instant mode creates a draft after a stable PDF text selection.
- `P0 Existing` instant mode dispatches `annotation:create-requested` with source `instant-selection`.
- `P0 Existing` instant mode suppresses duplicate drafts for an unchanged selection.
- `P0 Existing` invalid `annotations:set-instant-mode` payloads are logged and do not enable instant creation.
- `P0 Existing` instant mode emits `annotation:selection-error` with source `instant-selection` for invalid settled selections.
- `P0 Existing` `annotations:set-visibility` removes rendered overlays when `visible` is false.
- `P0 Existing` `annotations:set-visibility` keeps the current annotation snapshot while hidden.
- `P0 Existing` `annotations:set-visibility` restores overlays from the latest snapshot when `visible` is true.
- `P0 Existing` invalid `annotations:set-visibility` payloads are logged and do not change current visibility.
- `P0 Existing` hidden overlays cannot dispatch `annotation:selected` and do not activate the clickable cursor hint.

### Webview Overlay Rendering

Target module:

- `src/renderer/reader/pdf/webview/annotations.ts`

Add:

- `P0 Existing` rendering creates one annotation layer per rendered page.
- `P0 Existing` rendering removes an existing controller-owned layer before drawing a page again.
- `P0 Existing` rendering filters annotations by page number.
- `P0 Existing` rendering creates one highlight element per valid rect.
- `P0 Existing` highlight elements include `data-annotation-id`.
- `P0 Existing` highlight elements are absolutely positioned from viewport conversion output.
- `P0 Existing` highlight elements are skipped when converted viewport width or height is below `0.5`.
- `P0 Existing` overlay layer is `aria-hidden`.
- `P0 Existing` overlay layer and highlight elements keep `pointer-events: none`.
- `P0 Existing` overlay rendering applies transported PDF colors and draw types.
- `P0 Existing` overlay rendering falls back to default color and solid style for legacy snapshots.
- `P0 Existing` snapshot replacement updates edited overlay style and removes deleted annotations.
- `P0 Existing` overlay rendering stays disabled across page-render events while PDF annotation visibility is hidden.

## P1 Tests Needed For Stable Core Architecture

### Transport Validation

Target module:

- New helper module recommended, for example `src/renderer/reader/pdf/pdfAnnotationValidation.ts`.

Current draft validation coverage:

- `P1 Existing` validate draft payload before note creation.
- `P1 Existing` validate draft page numbers are 1-based integers.
- `P1 Existing` validate draft rect arrays are non-empty.
- `P1 Existing` validate draft rect coordinates are finite numbers.
- `P1 Existing` validate draft rects are non-zero.
- `P1 Existing` validation does not mutate accepted draft payloads.

Still needed when transport validation is expanded:

- `P1 Needed` validate `annotations:sync` accepts arrays of JSON-compatible annotation objects.
- `P1 Needed` validate `annotations:sync` rejects missing ids.
- `P1 Needed` validate `annotations:sync` rejects invalid page numbers.
- `P1 Needed` validate `annotations:sync` rejects empty rect arrays.
- `P1 Needed` validate rect coordinates are finite numbers.

### Persisted Shape Compatibility

Target modules:

- `src/common/redux/states/renderer/pdfAnnotation.ts`
- future migration/compatibility helpers.

Add when compatibility helpers exist:

- `P1 Needed` current persisted shape accepts `pdf-text-highlight`.
- `P1 Needed` unknown future versions are either rejected or safely ignored according to migration policy.
- `P1 Needed` compatibility helpers preserve known fields and drop unsupported fields intentionally.
- `P1 Needed` migrated rects remain normalized.

### Color And Style Transport

Target modules:

- `pdfAnnotationConverters.ts`
- future transport type helpers.

Existing coverage:

- `P1 Existing` note color maps to transport color.
- `P1 Existing` transport color maps back to overlay style.
- `P1 Existing` draw type maps to transport style.
- `P1 Existing` unsupported draw types fall back to a documented render style.
- `P1 Existing` opacity is derived by webview draw-type rendering policy.
- `P1 Existing` older runtime snapshots without color/style still render with defaults.

## P2 Tests For Future User-Facing Slices

### Annotation Panel Display

Target modules:

- `src/renderer/reader/pdf/pdfAnnotationPanel.ts`
- future PDF-specific annotation card helpers/components.

Add:

- `P2 Existing` PDF annotation cards read quote from `note.pdfAnnotation.quote`.
- `P2 Existing` PDF annotation cards display page number from `note.pdfAnnotation.page`.
- `P2 Existing` PDF annotation cards render without `locatorExtended`.
- `P2 Existing` PDF annotation sorting uses visual reading order: page number, visual top position, horizontal position, then id.
- `P2 Existing` annotation panel progression comparator uses PDF visual order before EPUB progression fallback.
- `P2 Existing` PDF annotation navigation targets are built from id, page, and the normalized first rect.
- `P2 Existing` invalid PDF annotation page or rect data is rejected before navigation dispatch.
- `P2 Existing` PDF annotation panel action model allows PDF cards to be edited and deleted.
- `P2 Existing` bulk delete includes PDF annotations in the deletion candidate list.
- `P2 Existing` Readium annotation import/export controls are unavailable in PDF reader context.
- `P2 Existing` PDF annotation cards display color, creator, and date metadata through existing panel metadata fields.
- `P2 Existing` EPUB annotation cards keep existing locator-based behavior.

### Navigation

Target modules:

- `src/renderer/reader/pdf/pdfAnnotationPanel.ts`
- `src/renderer/reader/pdf/webview/annotations.ts`

Add:

- `P2 Existing` navigation payload can target annotation id.
- `P2 Existing` navigation payload includes page and rect fallback.
- `P2 Existing` missing annotation id falls back to page/rect when allowed.
- `P2 Existing` invalid page or rect is rejected before dispatch.
- `P2 Existing` panel-to-PDF navigation does not assume EPUB `locatorExtended`.
- `P2 Existing` webview navigation scrolls to the target page and flashes the rendered highlight.
- `P2 Existing` webview navigation aligns a temporary marker from `convertToViewportRectangle()` before scrolling.
- `P2 Existing` webview navigation falls back to page scrolling when viewport rect alignment is unavailable.

### Editing

Target modules:

- `src/renderer/reader/pdf/pdfAnnotationPanel.ts`
- `ReaderMenu.tsx` save path or extracted annotation edit helper.

Add:

- `P2 Existing` future PDF comment edit payload preserves `pdfAnnotation`.
- `P2 Existing` future PDF color edit payload preserves `pdfAnnotation`.
- `P2 Existing` future PDF tag edit payload preserves `pdfAnnotation`.
- `P2 Existing` future PDF draw-type edit payload preserves `pdfAnnotation`.
- `P2 Later` editing EPUB annotations keeps the existing EPUB locator behavior.
- `P2 Later` edited PDF note syncs updated color/style transport back to the webview.

### Deletion

Target modules:

- future deletion helper and sync routing.

Add:

- `P2 Later` deleting one PDF annotation removes only that note.
- `P2 Later` deletion sync excludes the deleted annotation.
- `P2 Later` deletion does not remove unrelated PDF annotations.
- `P2 Later` deletion does not remove EPUB annotations.
- `P2 Later` if a future `annotations:delete` event exists, its payload contains only the deleted id and active PDF context.

### Multi-Page Selection

Target modules:

- future target-shape helpers and selection grouping helpers.

Add only if multi-page selection is implemented:

- `P2 Later` selection rects are grouped by page.
- `P2 Later` persisted target shape can represent multiple page groups.
- `P2 Later` rendering draws all page groups.
- `P2 Later` panel display chooses a primary page label.
- `P2 Later` navigation chooses a primary target and preserves all secondary targets.
- `P2 Later` single-page first-slice annotations migrate or remain compatible.

### Search

Target modules:

- future PDF annotation search helpers.

Add:

- `P2 Later` search matches `pdfAnnotation.quote`.
- `P2 Later` search matches user comment text.
- `P2 Later` search matches tags.
- `P2 Later` search returns page and annotation id for navigation.
- `P2 Later` PDF application annotation search remains separate from native PDF text search unless a later decision merges them.

### Export And Import

Target modules:

- future PDF annotation export/import helpers.

Add:

- `P2 Later` export includes page, rects, quote, comment, color, draw type, tags, creator, created date, and modified date.
- `P2 Later` import accepts valid PDF annotation targets without EPUB selector fields.
- `P2 Later` import rejects non-finite coordinates.
- `P2 Later` import rejects invalid page numbers.
- `P2 Later` import normalizes rect coordinates.
- `P2 Later` import preserves unknown allowed metadata according to the export contract.

### Print

Target modules:

- future print-preparation helpers.

Add:

- `P2 Later` print preparation includes only visible/current PDF annotations.
- `P2 Later` print preparation preserves color and style.
- `P2 Later` print preparation excludes deleted or stale annotations.
- `P2 Later` print model is deterministic for one-page and multi-page annotated PDFs.

## Recommended Test File Layout

Use focused files that match implementation ownership:

- `test/renderer/reader/pdf/webview/annotationGeometry.test.ts` - pure geometry helpers.
- `test/renderer/reader/pdf/pdfAnnotationConverters.test.ts` - note/transport conversion.
- `test/renderer/reader/pdf/pdfAnnotationHost.test.ts` - extracted host-side pure orchestration helpers.
- `test/renderer/reader/pdf/webview/annotations.test.ts` - controller behavior with fake bus, fake DOM, and fake viewport.
- `test/renderer/reader/components/pdfAnnotationTrigger.test.tsx` - PDF-vs-EPUB annotation trigger routing if not extracted.
- `test/renderer/reader/components/pdfAnnotationPanel.test.tsx` - future panel display behavior.
- `test/renderer/reader/pdf/pdfAnnotationValidation.test.ts` - draft validation helpers and future transport validation helpers.
- `test/renderer/reader/pdf/pdfAnnotationImportExport.test.ts` - future import/export helpers.

## Implementation Order

1. `Done` Complete P0 converter tests.
2. `Done` Extract and test host-side helper logic from `Reader.tsx`.
3. `Done` Add webview controller tests with fake bus, fake DOM, and fake viewport.
4. `Done` Expand geometry edge-case coverage.
5. `Done` Add draft validation helper tests when payload validation is implemented.
6. `Later` Add P2 tests alongside each future feature slice.

## Definition Of Done

P0 unit testing is complete when:

- all converter functions have mutation-safe mapping tests;
- host-side note creation and sync payload construction are unit-tested without mounting the whole reader;
- webview controller selection rejection, valid draft creation, snapshot sync, overlay rendering, and teardown are covered with fakes;
- geometry helpers cover edge, containment, clamping, and fake rotated viewport cases;
- tests run through the normal Jest config;
- tests do not require PDF.js, Electron, network access, Playwright, or a real browser.
