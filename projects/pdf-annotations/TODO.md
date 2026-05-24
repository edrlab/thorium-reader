# PDF Annotations TODO

## Tracking Rule

This list tracks the whole PDF annotations project, not only the first MVP slice.

Use the checkboxes as delivery state:

- `[x]` means the task is already present in the current branch.
- `[ ]` means the task is still needed before the project can be considered complete.
- Keep tasks goal-oriented: every item should either unlock user value, reduce integration risk, or prepare a later capability.

## Done In This Branch

### Project Setup

- [x] Create `projects/pdf-annotations` as the project documentation home.
- [x] Ignore `vendor/` so the local `vendor/pdf.js` reference checkout is not tracked.
- [x] Consolidate project documentation into `PLAN.md`, `SPEC.md`, and `REVIEW.md`.
- [x] Add `CHANGELOG.md` to track project decisions, actions, and scope changes.
- [x] Add `UNIT_TESTS.md` to define the required unit-test strategy and coverage list.
- [x] Add a standalone PDF.js browser harness for manual annotation testing outside Thorium.
- [x] Add a local harness build script and static HTTP server.
- [x] Add Playwright as the browser regression test runner for the standalone harness.
- [x] Fix the Jest module mapper so PDF annotation geometry tests run in the normal Jest runner.
- [x] Document that PDF annotations are application-level Thorium annotations, not native PDF writes.
- [x] Document that all PDF annotation communication must use the existing `pdf-eventbus`.
- [x] Document that PDF annotations are scoped to the active PDF context; multi-PDF publication support is not part of this project.

### Persisted State And Transport

- [x] Add `src/common/redux/states/renderer/pdfAnnotation.ts`.
- [x] Add `IPdfAnnotationRect`.
- [x] Add `IPdfTextAnnotationTarget`.
- [x] Extend `INoteState` with optional `pdfAnnotation`.
- [x] Add first-slice PDF annotation transport types to `pdfReader.type.ts`.
- [x] Add `annotations:sync`.
- [x] Add `highlight:create-from-selection`.
- [x] Add `annotations:ready`.
- [x] Add `annotation:create-requested`.

### Host-Side First Slice

- [x] Add `src/renderer/reader/pdf/pdfAnnotationConverters.ts`.
- [x] Add `src/renderer/reader/pdf/pdfAnnotationHost.ts`.
- [x] Add filtering for notes that contain `pdfAnnotation`.
- [x] Convert persisted notes to PDF annotation transport objects.
- [x] Convert webview drafts to canonical Thorium note payloads.
- [x] Extract host-side PDF annotation snapshot, create-request, and trigger routing helpers for unit testing.
- [x] Create PDF annotation notes through the existing note persistence path.
- [x] Synchronize the official host annotation snapshot back to the PDF webview.
- [x] Re-sync PDF annotations when the note list changes for an active PDF reader.
- [x] Route the annotation trigger to `highlight:create-from-selection` when the active publication is PDF.
- [x] Keep EPUB annotation creation on the existing EPUB path.

### Webview First Slice

- [x] Add `src/renderer/reader/pdf/webview/annotations.ts`.
- [x] Initialize the PDF annotation controller from the PDF webview preload path.
- [x] Subscribe to `annotations:sync`.
- [x] Subscribe to `highlight:create-from-selection`.
- [x] Emit `annotations:ready` when PDF geometry is available.
- [x] Capture current text selection on host request.
- [x] Reject empty selections.
- [x] Reject selections with no usable client rectangles.
- [x] Reject multi-page selections for the first slice.
- [x] Detect the PDF page for selected client rectangles.
- [x] Convert browser client rectangles to PDF coordinates with PDF.js viewport helpers.
- [x] Dispatch `annotation:create-requested` drafts without canonical ids.
- [x] Render passive highlight overlays from host snapshots.
- [x] Clear and redraw overlays on full sync.
- [x] Redraw overlays after page render, zoom changes, and rotation changes.
- [x] Keep highlight overlays non-interactive with `pointer-events: none`.
- [x] Extract PDF annotation geometry helpers into `annotationGeometry.ts` for PDF.js-independent tests.
- [x] Add unit tests for PDF annotation geometry helpers.
- [x] Add P0 unit tests for PDF annotation webview controller behavior with fake DOM, fake event buses, and fake viewport objects.
- [x] Add P0 unit tests for PDF annotation overlay rendering.

### Known First-Slice Safeguards

- [x] Keep annotation ids host-owned.
- [x] Keep timestamps host-owned.
- [x] Keep creator metadata host-owned.
- [x] Keep first-slice highlights solid and read-only.
- [x] Avoid native PDF file mutation.

## Needed To Finish Slice 1 Properly

### Verification

- [ ] Run TypeScript checks for the touched renderer/common code.
- [ ] Run lint checks for the touched files.
- [ ] Build the PDF renderer bundle.
- [ ] Manually test single-line PDF highlight creation.
- [ ] Manually test multi-line same-page PDF highlight creation.
- [ ] Manually test cross-page selection rejection.
- [ ] Manually test highlight persistence after closing and reopening a PDF.
- [ ] Manually test zoom alignment.
- [ ] Manually test rotation alignment.
- [x] Manually test PDF highlight creation and overlay alignment in the standalone PDF.js harness.
- [ ] Manually test that EPUB annotations still work.
- [ ] Manually test that PDF copy, TOC, thumbnails, search, page navigation, and preferences still work.

### First-Slice Hardening

- [ ] Gate verbose PDF annotation debug logs behind an explicit debug flag.
- [ ] Validate `annotations:sync` payload shape before rendering.
- [ ] Validate draft rect/page values before creating a note.
- [ ] Decide whether failed first-slice selections should remain silent or emit a typed internal diagnostic event.
- [x] Add unit tests for `pdfAnnotationDraftToNote`.
- [x] Add unit tests for `noteToPdfAnnotation`.
- [x] Add unit tests for `filterPdfAnnotationNotes`.
- [x] Add unit tests for host-side PDF annotation snapshot and create-request orchestration.
- [x] Wire the PDF annotation geometry tests into normal Jest runs after the existing global Jest module mapper issue is fixed.
- [x] Automate the standalone PDF.js harness with a browser regression smoke test.
- [ ] Expand standalone harness automation to cover zoom, rotation, and cross-page selection rejection.
- [ ] Add a regression test that a PDF annotation note keeps `pdfAnnotation` after creation.

## Needed For A Stable Core Architecture

### Data Model

- [ ] Version the PDF annotation persisted shape if migrations become necessary.
- [ ] Define validation rules for page numbers and rectangle bounds.

### Transport Contract

- [ ] Add color to `TPdfAnnotationTransport`.
- [ ] Add draw type/style to `TPdfAnnotationTransport`.
- [ ] Decide whether opacity is transported, derived from draw type, or kept as a rendering constant.
- [ ] Keep transport payloads JSON-compatible.
- [ ] Add compatibility handling for older persisted notes during transport conversion.

## Needed For Read-Only User Interactions

### Annotation Panel Display

- [ ] Add a PDF-specific annotation card path for notes with `pdfAnnotation`.
- [ ] Display selected quote from `pdfAnnotation.quote`.
- [ ] Display PDF page number.
- [ ] Display note color.
- [ ] Display creator and date metadata when available.
- [ ] Avoid assuming `locatorExtended` exists for PDF annotations.
- [ ] Sort PDF annotations predictably by page and rectangle position.
- [ ] Keep PDF annotations read-only until editing is implemented.

### Navigation

- [ ] Add a host-to-webview navigation command such as `viewer:go-to-annotation`.
- [ ] Define navigation payload by annotation id plus page/rect fallback.
- [ ] Scroll the PDF viewer to the target page.
- [ ] Align the target rectangle into view.
- [ ] Optionally focus or flash the target highlight after navigation.
- [ ] Add a regression test for panel-to-PDF navigation.

### Overlay Interaction

- [ ] Decide whether PDF highlight overlays should become pointer-interactive.
- [ ] If interactive, preserve text selection ergonomics.
- [ ] Emit `annotation:selected` from the webview to the host when a PDF highlight is selected.
- [ ] Reflect selected annotation state in the annotation panel.
- [ ] Add keyboard-accessible focus behavior for selected PDF annotations.

## Needed For Editing And Deletion

### Editing

- [ ] Preserve `pdfAnnotation` in every annotation edit path.
- [ ] Enable editing comment text for PDF annotations.
- [ ] Enable editing color for PDF annotations.
- [ ] Enable editing tags for PDF annotations.
- [ ] Sync edited color/style back to the PDF webview.
- [ ] Add tests proving comment edits do not remove `pdfAnnotation`.
- [ ] Add tests proving color edits update the webview rendering.
- [ ] Add tests proving tag edits do not remove `pdfAnnotation`.

### Deletion

- [ ] Enable deletion of PDF annotations from the parent UI.
- [ ] Ensure deleted PDF notes are removed from persistence.
- [ ] Ensure deleted PDF annotations disappear from the PDF webview.
- [ ] Decide whether deletion uses full `annotations:sync` or a narrower `annotations:delete` event.
- [ ] Add regression tests for deleting one PDF annotation without removing unrelated PDF annotations.

## Needed For Multi-Page Support

### Multi-Page Selection

- [ ] Design a persisted target shape that can represent multiple pages.
- [ ] Decide whether to use one annotation with multiple page targets or one note per page.
- [ ] Update selection capture to group rectangles by page.
- [ ] Update rendering to support multi-page annotation targets.
- [ ] Update panel display to describe multi-page annotations.
- [ ] Update navigation to choose a primary target.
- [ ] Add migration or compatibility behavior for single-page first-slice annotations.

## Needed For Search

- [ ] Define the difference between PDF text search, Thorium application annotation search, and native PDF annotation search.
- [ ] Add parent-side search over PDF annotation quote text.
- [ ] Add parent-side search over PDF annotation comments.
- [ ] Add parent-side search over PDF annotation tags.
- [ ] Decide whether webview overlays need search result highlighting.
- [ ] Decide whether native PDF annotations are included in the same search UI.
- [ ] Add tests for PDF annotation search results and navigation.

## Needed For Export And Import

- [ ] Define a PDF-specific export target model.
- [ ] Include page and rectangle geometry in export.
- [ ] Include quote, comment, color, draw type, tags, creator, created date, and modified date.
- [ ] Import PDF annotations without forcing them into EPUB DOM selector shapes.
- [ ] Validate imported rectangle/page/resource data before persistence.
- [ ] Add export/import compatibility tests.

## Needed For Print

- [ ] Decide where PDF annotation print rendering belongs: PDF.js print service or Thorium print preparation.
- [ ] Prototype rendering application highlights in the PDF print path.
- [ ] Preserve color and style in printed output.
- [ ] Avoid printing stale or hidden annotations.
- [ ] Add manual print QA for one-page and multi-page annotated PDFs.
- [ ] Add automated coverage if the PDF print path can be tested reliably.

## Needed For Accessibility And UX Polish

- [ ] Add user-facing feedback for invalid selections.
- [ ] Add localized messages for unsupported multi-page selections if still unsupported.
- [ ] Add accessible names or panel equivalents for PDF annotation entries.
- [ ] Ensure keyboard users can create PDF annotations from selected text.
- [ ] Ensure future overlay selection is keyboard accessible.
- [ ] Respect high-contrast or theme constraints for highlight rendering.
- [ ] Confirm highlight color contrast does not obscure PDF text.

## Needed For Release Readiness

- [ ] Document the final supported PDF annotation capabilities.
- [ ] Document unsupported cases and known limitations.
- [ ] Add a migration note for existing PDF annotations if the data model changes.
- [ ] Add release notes for PDF annotation creation.
- [ ] Add QA scenarios for Windows, macOS, and Linux.
- [ ] Add QA scenarios for zoom, rotation, high-DPI display, and reopened sessions.
- [ ] Confirm no tracked files are added from `vendor/pdf.js`.
- [ ] Confirm packaged builds include the PDF annotation webview bundle.
