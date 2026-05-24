# PDF Annotations Plan

## Status

Branch: `feat/pdf-annotations`

The branch introduces the first slice of PDF annotations: text highlight creation and rendering for PDFs through Thorium's existing PDF event bus. The feature is application-level only. It does not write native annotations back into the PDF file.

The local PDF.js source checkout used for reference work belongs under `vendor/pdf.js`. The `vendor/` directory is intentionally ignored.

Project policy: PDF annotation support is scoped to the active PDF context. Multi-PDF publication support is not part of this project.

## Goal

Implement PDF text annotations in Thorium while keeping the parent reader process as the source of truth.

The parent reader owns:

- note identity;
- persistence;
- creator metadata;
- timestamps;
- default color policy;
- future annotation panel and editing workflows.

The PDF.js webview owns:

- text selection capture;
- page hit testing;
- viewport-to-PDF coordinate conversion;
- passive overlay rendering;
- PDF.js geometry lifecycle events.

## Architecture

All host-to-webview and webview-to-host annotation messages use Thorium's dedicated PDF event bus.

Do not add a second bridge for this feature:

- no `postMessage`;
- no direct host DOM access into the PDF webview;
- no direct Redux, React, or persistence imports inside the PDF webview bundle.

Transport path:

```text
Reader.tsx / Redux note state
  -> createOrGetPdfEventBus().dispatch(...)
  -> driver.ts
  -> webview.send("pdf-eventbus", data)
  -> index_pdf.ts
  -> PDF annotation controller

PDF annotation controller
  -> ipcRenderer.sendToHost("pdf-eventbus", data)
  -> driver.ts
  -> createOrGetPdfEventBus()
  -> Reader.tsx / Redux note state
```

## Slice 1 - Minimal Creation Loop

Implemented scope:

1. Add persisted PDF annotation geometry on `INoteState.pdfAnnotation`.
2. Add first-slice PDF event bus messages.
3. Capture the current text selection inside the PDF webview when requested by the host.
4. Reject empty, invalid, or multi-page selections.
5. Convert selection rectangles from screen coordinates to PDF coordinates.
6. Send a creation draft from the webview to the host.
7. Create a canonical Thorium note with normal note persistence.
8. Send a full canonical annotation snapshot back to the webview with `annotations:sync`.
9. Render passive solid highlight overlays.
10. Rehydrate persisted PDF annotations when the PDF webview reports readiness.

Out of scope for slice 1:

- annotation panel UI for PDF annotations;
- go-to-annotation;
- overlay click selection or focus;
- editing;
- deletion;
- search;
- print support;
- export/import changes;
- hide/show visibility mode;
- parent-facing toast/error handling for failed selections;
- native PDF annotation writing.

## Slice 2 - Read-Only Interactions

Implemented scope:

1. Show PDF annotations in the annotation panel.
2. Display quote, page, color, creator, and date metadata.
3. Add a PDF-specific display path that does not require `locatorExtended`.
4. Implement parent-to-webview navigation with `viewer:go-to-annotation`.
5. Keep annotations read-only in this slice.

Key dependency: the panel must preserve `pdfAnnotation` on every note mutation before editing can be enabled.

## Slice 3 - Editing and Deletion

Implemented scope:

1. Edit PDF annotation comments.
2. Edit PDF annotation color.
3. Edit PDF annotation draw type and tags.
4. Preserve `pdfAnnotation` when saving comments, colors, tags, and metadata.
5. Delete PDF annotations from the parent UI.
6. Send updated canonical state back to the webview with refreshed `annotations:sync`.

Potential patch events:

```ts
"annotations:upsert": (payload: { annotations: TPdfAnnotationTransport[] }) => any;
"annotations:delete": (payload: { ids: string[] }) => any;
```

Use a full snapshot until annotation counts or interaction latency justify patch semantics.

## Slice 4 - Overlay Click Selection

Implemented scope:

1. Keep PDF highlight overlays passive with `pointer-events: none`.
2. Hit-test document clicks against rendered highlight geometry.
3. Emit `annotation:selected` from the webview to the host.
4. Open and focus the matching Thorium annotation panel card.
5. Use `Shift+click` to open the existing edit form for editable PDF annotations.

Still out of scope:

- keyboard focus directly on PDF highlight overlays;
- new persistence events for selection state;
- native PDF annotation interaction.

## Later Phases

Search:

- distinguish PDF text search, Thorium application annotation search, and native PDF annotation search;
- index PDF annotation quote/comment/tags in the parent UI first;
- decide later whether the webview needs native annotation search events.

Export and import:

- do not force PDF annotations into Readium DOM selectors;
- add a PDF-specific target representation;
- include page, rects, quote, color, draw type, comment, creator, and timestamps.

Print:

- treat print as its own phase;
- viewer overlays are not automatically part of PDF.js print rendering;
- decide whether print rendering belongs in PDF.js print services or in a Thorium-specific print overlay path.

Hardening:

- add automated tests for converters and geometry helpers;
- add regression tests for EPUB annotations, bookmarks, PDF navigation, search, copy, TOC, thumbnails, and preferences.

## Current File Map

State and transport:

- `src/common/redux/states/renderer/pdfAnnotation.ts`
- `src/common/redux/states/renderer/note.ts`
- `src/renderer/reader/pdf/common/pdfReader.type.ts`

Host orchestration:

- `src/renderer/reader/pdf/pdfAnnotationConverters.ts`
- `src/renderer/reader/components/Reader.tsx`
- `src/renderer/reader/components/ReaderHeader.tsx`

Webview:

- `src/renderer/reader/pdf/webview/annotations.ts`
- `src/renderer/reader/pdf/webview/index_pdf.ts`

Known follow-up area:

- `src/renderer/reader/components/ReaderMenu.tsx`

## Manual Test Plan

Slice 1:

- Open a PDF.
- Select one line and create a highlight.
- Select multiple lines on one page and create a highlight.
- Select across pages and confirm no annotation is created.
- Change zoom and confirm highlight alignment.
- Rotate pages and confirm highlight alignment.
- Reopen the PDF and confirm persisted highlights are restored.
- Confirm PDF copy, TOC, thumbnails, search, page navigation, and preferences still work.
- Confirm EPUB annotation creation still follows the existing flow.

Slice 2:

- Open the annotation panel with PDF notes present.
- Confirm PDF annotations show quote/page metadata without requiring `locatorExtended`.
- Navigate from the panel to a PDF annotation.
- Confirm panel interactions do not mutate or drop `pdfAnnotation`.

Slice 3:

- Edit comment, color, draw type, and tags on a PDF annotation.
- Confirm `pdfAnnotation` survives every save path.
- Delete a PDF annotation and confirm the webview overlay disappears.

## Decisions

- PDF annotations are application-level annotations.
- Persisted PDF geometry lives in `INoteState.pdfAnnotation`.
- Coordinates are stored in PDF page space, not screen pixels.
- First-slice selections are single-page only.
- The webview emits drafts without canonical ids.
- The host creates canonical notes and synchronizes official state back to the webview.
- First-slice rendering started as a fixed solid highlight; slice 3 transports color and PDF-supported draw type for webview overlay rendering.
- PDF annotations are scoped to the active PDF context; multi-PDF publication support is not included.
- Annotation panel display/navigation, editing, and deletion are implemented slices; overlay selection/focus, search, export/import, and print support remain later slices.
