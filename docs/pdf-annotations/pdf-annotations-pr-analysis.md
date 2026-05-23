# PDF Annotations PR Analysis

## Scope

This document summarizes the current `feat/pdf-annotations` branch. It focuses on the code that adds a first PDF text annotation flow inside the existing Thorium PDF reader webview.

The branch introduces:

- a PDF-specific annotation target stored on `INoteState`;
- a parent-reader to PDF-webview event flow for annotation synchronization;
- a PDF.js webview controller that converts text selections into PDF-space rectangles;
- passive highlight overlays rendered over PDF.js pages;
- a toolbar path that reuses the existing annotation button for PDF selections.

The goal is not to replace the existing EPUB annotation system. The current implementation is an initial PDF-specific slice that reuses Thorium notes as the persistence and UI container.

## Main Files

- `src/common/redux/states/renderer/pdfAnnotation.ts`
  Defines the persisted PDF annotation target shape: page number, PDF-space rectangles, and selected quote.

- `src/common/redux/states/renderer/note.ts`
  Adds `pdfAnnotation?: IPdfTextAnnotationTarget` to `INoteState`.

- `src/renderer/reader/pdf/common/pdfReader.type.ts`
  Extends the PDF event bus contract with annotation sync, readiness, and create-request events.

- `src/renderer/reader/pdf/pdfAnnotationConverters.ts`
  Converts between Thorium notes and the transport payload consumed by the PDF webview.

- `src/renderer/reader/pdf/webview/index_pdf.ts`
  Wires the PDF annotation controller into the PDF.js webview bundle.

- `src/renderer/reader/pdf/webview/annotations.ts`
  Implements selection extraction, PDF coordinate conversion, and overlay rendering.

- `src/renderer/reader/components/Reader.tsx`
  Owns PDF annotation note creation and synchronization from the parent renderer.

- `src/renderer/reader/components/ReaderHeader.tsx`
  Routes the existing annotation toolbar button to PDF selection annotation when reading a PDF.

- `src/renderer/reader/components/ReaderMenu.tsx`
  Currently contains TODO comments for known integration gaps in the existing annotation panel/export flow.

## Build And Runtime Shape

The PDF reader is split across two renderer contexts:

1. The parent Thorium reader renderer, where `Reader.tsx`, `ReaderHeader.tsx`, Redux, notes, and the reader menu live.
2. The PDF webview, where PDF.js `viewer.html` is loaded and `index_pdf.js` runs as the PDF-specific bundle.

`driver.ts` creates the `<webview>` and loads PDF.js viewer content. The PDF bundle is built from `src/renderer/reader/pdf/webview/index_pdf.ts` through `webpack.config.renderer-pdf.js`, producing `dist/index_pdf.js`.

The parent and the webview communicate through the existing `pdf-eventbus` IPC bridge:

- parent to webview: `webview.send("pdf-eventbus", data)`;
- webview to parent: `ipcRenderer.sendToHost("pdf-eventbus", data)`;
- both sides serialize an event key and payload as JSON.

The annotation controller is therefore not a direct React or Redux component. It is a PDF.js-side controller that receives snapshots and emits creation requests through the PDF event bus.

## Purpose

The branch aims to support a minimal PDF annotation workflow:

1. The user selects text inside the PDF.js webview.
2. The user triggers the annotation command from the reader toolbar or keyboard shortcut.
3. The PDF webview converts the current browser selection into PDF coordinates.
4. The parent reader creates a Thorium note with a PDF-specific target.
5. The parent syncs PDF annotation notes back into the PDF webview.
6. The webview renders highlight overlays on the corresponding PDF.js page DOM.

The key design choice is to persist PDF annotations as normalized PDF-space geometry rather than DOM positions. This is important because PDF.js page DOM is generated, scaled, rotated, and recycled by the viewer.

## Data Model

The new persisted PDF annotation payload is:

```ts
interface IPdfTextAnnotationTarget {
    type: "pdf-text-highlight";
    page: number;
    rects: IPdfAnnotationRect[];
    quote?: string;
}

interface IPdfAnnotationRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
```

This is attached to a standard `INoteState`:

```ts
interface INoteState {
    locatorExtended?: MiniLocatorExtended;
    pdfAnnotation?: IPdfTextAnnotationTarget;
    // existing note fields...
}
```

For PDF annotations created by this branch, `locatorExtended` is currently absent and `pdfAnnotation` carries the location. This has consequences for existing annotation list, navigation, import, and export features because most of them were designed around `locatorExtended`.

## Event Flow

### Initial synchronization

1. `Reader.tsx` mounts a PDF through `pdfMount()`.
2. `Reader.tsx` subscribes to PDF annotation events:
   - `annotations:ready`;
   - `annotation:create-requested`.
3. `index_pdf.ts` creates a `PdfAnnotationController` inside the webview.
4. `PdfAnnotationController.init()` subscribes to:
   - Thorium PDF bus events: `annotations:sync`, `highlight:create-from-selection`;
   - PDF.js events: `pagesinit`, `documentloaded`, `pagerendered`, `scalechanging`, `rotationchanging`.
5. When PDF.js geometry is available, the controller emits `annotations:ready`.
6. `Reader.tsx` responds by sending `annotations:sync` with all notes that contain `pdfAnnotation`.

### Creating an annotation

1. The toolbar or keyboard path dispatches `highlight:create-from-selection`.
2. The PDF webview reads `window.getSelection()`.
3. The controller extracts the selected range client rectangles.
4. Each rectangle is mapped to a PDF.js page element.
5. Multi-page selections are rejected by design in this first implementation.
6. Each client rectangle is converted to page-local viewport coordinates.
7. PDF.js `viewport.convertToPdfPoint()` converts viewport pixels to PDF coordinates.
8. The controller emits `annotation:create-requested` with a draft.
9. `Reader.tsx` converts the draft into a Thorium note.
10. The note is dispatched through `readerActions.note.addUpdate`.
11. The newly-created note is immediately included in an annotation sync back to the webview.

### Rendering annotations

1. The webview receives `annotations:sync`.
2. The controller replaces its local `Map<id, annotation>` snapshot.
3. `renderAll()` removes existing overlay layers.
4. For every rendered PDF.js page, annotations matching that page are selected.
5. A passive overlay layer is appended to the page DOM.
6. Each PDF-space rectangle is converted back to a viewport rectangle through `convertToViewportRectangle()`.
7. A highlight `div` is absolutely positioned over the text.

The overlay uses `pointer-events: none`, so PDF selection and PDF.js controls remain reachable.

## Selection Algorithm

The selection algorithm is intentionally strict.

1. Read `window.getSelection()`.
2. Reject empty selections or selections without ranges.
3. Collect all `Range.getClientRects()` rectangles.
4. Ignore tiny rectangles below one CSS pixel in width or height.
5. For every rectangle, find the PDF page with the largest intersection area.
6. Reject the selection if any rectangle does not intersect a page.
7. Reject the selection if rectangles span more than one page.
8. For the selected page:
   - subtract the page DOM position;
   - subtract visible page border widths;
   - clamp to PDF.js viewport width and height;
   - convert both corners through `viewport.convertToPdfPoint()`.
9. Store normalized rectangle bounds with `min/max` x and y.

This avoids storing browser DOM information and lets the rendered overlay survive zoom, scale, and rotation changes.

## Current Strengths

- The implementation keeps PDF.js DOM details isolated in `webview/annotations.ts`.
- The parent renderer remains the owner of note creation and persistence.
- The webview receives annotation state as full snapshots, which simplifies correctness for the first slice.
- PDF-space coordinates are a reasonable persistence basis for PDF highlights.
- The controller redraws overlays after PDF.js page rendering and geometry changes.
- The feature is mostly contained to PDF reader code and note shape extension.
- TypeScript and ESLint currently pass on the branch.

## Current Risks

### PDF annotations can lose their PDF target when edited

The existing annotation edit card rebuilds an `INoteState` without preserving `pdfAnnotation`. Because the note reducer replaces the note object, editing a PDF annotation can remove the PDF-specific target. After that, the note is no longer included in PDF sync and disappears from the PDF overlay.

There is a TODO in `ReaderMenu.tsx` near the annotation save path.

### Existing annotation list is locator-centric

PDF annotations created by this branch do not currently have `locatorExtended`. The annotation card uses `locatorExtended` for:

- display text;
- progression;
- click navigation.

As a result, PDF annotations can appear in the list with a generic label, default-like progression, and no working navigation unless this path is adapted to `pdfAnnotation.quote` and `pdfAnnotation.page`.

There are TODOs in `ReaderMenu.tsx` near display and navigation.

### Export/import semantics are incomplete

The current export flow includes every note with `group === "annotation"`. PDF annotations therefore enter a converter that expects `locatorExtended` and Readium selectors. Without a specific PDF target mapping or exclusion, exported annotations can contain empty or invalid targets.

There is a TODO in `ReaderMenu.tsx` near the annotation list filtering.

### Rendered PDF highlights ignore note color and draw type

The note stores color and draw type, but the PDF webview transport and renderer currently draw every annotation as a fixed yellow translucent rectangle. This can diverge from user expectation and from the annotation list metadata.

There is a TODO in `webview/annotations.ts` near highlight style creation.

### PDF.js APIs are partly internal

The controller depends on:

- `window.PDFViewerApplication`;
- `PDFViewerApplication.eventBus`;
- `pdfViewer.getPageView()`;
- fallback access to `pdfViewer._pages`;
- PDF.js page DOM shape: `.page[data-page-number]`.

These are practical for the embedded PDF.js fork, but they should be treated as integration points that require runtime validation after PDF.js updates.

### Logging volume

The PDF annotation controller logs many lifecycle and render events through direct `console.log` and `console.warn`. This is helpful while stabilizing the slice but may be noisy in production reader sessions.

### Full snapshot redraw may become expensive

The snapshot model is correct and simple for small annotation sets. For very large PDF documents or many annotations, repeated full redraws on sync or geometry changes may become expensive.

## Validation Notes

Validated locally on this branch:

- `tsc --project ./tsconfig-cli.json --noEmit`
- `npm.cmd --force run lint:ts`

The local environment used `npm 10.9.4`, while the project requires `>=11.15.0`, so `npm.cmd --force` was needed for npm script execution in this environment.

Runtime validation still matters because the critical integration points depend on Electron webview behavior and PDF.js runtime APIs.

Suggested manual checks:

1. Open a PDF.
2. Select text on one page.
3. Trigger the annotation command from the toolbar.
4. Verify a highlight appears on the selected text.
5. Zoom in/out and verify the overlay remains aligned.
6. Rotate the page if supported and verify the overlay is redrawn correctly.
7. Navigate away and back to the page, verifying the annotation persists visually.
8. Open the annotation list and verify how the PDF annotation is displayed.
9. Try editing the PDF annotation and verify whether it remains visible in the PDF.
10. Try exporting annotations and inspect the output target for PDF annotations.

## Possible Evolution

### Short term

- Preserve `pdfAnnotation` when editing annotations in `ReaderMenu.tsx`.
- Display `pdfAnnotation.quote` and page number in the annotation list.
- Navigate PDF annotations by dispatching `pageNumber` when `locatorExtended` is missing.
- Include color and draw type in the PDF annotation transport.
- Render PDF annotations with the note color and selected draw type.
- Gate annotation debug logs behind `debug` or a development flag.

### Medium term

- Define a formal import/export representation for PDF annotation targets.
- Decide whether PDF annotations should be exported through the current Readium annotation set format, a PDF-specific extension, or excluded until a compatible format exists.
- Add focused tests for converter behavior:
  - draft to note;
  - note to transport;
  - filtering PDF annotation notes;
  - editing without dropping PDF targets.
- Add integration tests or manual QA scripts around zoom, rotation, and page recycling.

### Longer term

- Support multi-page selections by splitting a selection into one annotation target per page or one target with multiple page groups.
- Support interactive PDF overlays, for example selecting a rendered annotation and opening the existing annotation edit UI.
- Consider storing enough metadata to recover or validate annotations when the PDF text layer changes.
- Revisit the boundary between Thorium note state and PDF-specific state if PDF annotations gain richer behavior than EPUB annotations.

## Architectural Summary

The current PR is a good first vertical slice: it connects the parent Thorium reader, Redux notes, the PDF webview bundle, and PDF.js page geometry. The core algorithm is sound for single-page text highlights because it stores PDF-space rectangles rather than fragile DOM positions.

The main unfinished work is not the PDF coordinate algorithm itself. The main risk is integration with the existing annotation ecosystem, which assumes `locatorExtended` and Readium selectors. Until those paths are adapted, PDF annotations can be created and rendered, but editing, list navigation, export, and visual styling remain incomplete.
