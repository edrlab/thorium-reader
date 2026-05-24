# PDF Annotations First-Slice Specification

## Purpose

This document is the implementation contract for the first PDF annotations slice in Thorium.

The first slice implements the smallest useful loop:

1. The user selects text inside the PDF.js webview.
2. The host asks the webview to create a highlight from the current selection.
3. The webview converts the selection into PDF coordinates.
4. The webview sends an annotation creation draft to the host.
5. The host creates a canonical Thorium note.
6. The host sends the persisted annotation snapshot back to the webview.
7. The webview renders the official highlight overlay.
8. When the PDF is reopened, the host re-synchronizes persisted PDF annotations.

The host is the only source of truth for identity, persistence, timestamps, creator metadata, and default color. The webview is responsible only for selection capture, coordinate conversion, and overlay rendering.

## Scope

Included:

- solid text highlights;
- single-page selections;
- multi-line selections on one page;
- webview-to-host creation drafts;
- host-side canonical note creation through existing note persistence;
- host-to-webview rendering through `annotations:sync`;
- persisted annotation rehydration on PDF readiness;
- overlay alignment after zoom and rotation changes.

Excluded:

- annotation panel display and navigation;
- overlay click selection/focus;
- editing;
- deletion;
- search;
- print support;
- export/import changes;
- failed-selection toast handling;
- native PDF annotation writing.

## Persisted Model

PDF annotations are stored as normal Thorium notes with an additional `pdfAnnotation` field.

```ts
export interface IPdfAnnotationRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface IPdfTextAnnotationTarget {
    type: "pdf-text-highlight";
    page: number;
    rects: IPdfAnnotationRect[];
    quote?: string;
}
```

First-slice PDF note shape:

- `group: "annotation"`;
- `drawType: EDrawType.solid_background`;
- `textualValue: ""`;
- `tags: []`;
- no `locatorExtended`;
- no `readiumAnnotation`;
- `pdfAnnotation.quote` stores the selected text.

`textualValue` is reserved for user comments in a later editing slice.

## Event Contract

The first slice extends `IPdfPlayerEvent` with four events.

```ts
export interface TPdfAnnotationRectTransport {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface TPdfAnnotationDraftTransport {
    type: "pdf-text-highlight";
    page: number;
    rects: TPdfAnnotationRectTransport[];
    quote?: string;
}

export interface TPdfAnnotationTransport extends TPdfAnnotationDraftTransport {
    id: string;
}

export interface IPdfPlayerEvent {
    "annotations:sync": (payload: {
        annotations: TPdfAnnotationTransport[];
    }) => any;

    "highlight:create-from-selection": () => any;

    "annotations:ready": () => any;

    "annotation:create-requested": (payload: {
        draft: TPdfAnnotationDraftTransport;
    }) => any;
}
```

Directions:

- host to webview: `highlight:create-from-selection`;
- webview to host: `annotation:create-requested`;
- webview to host: `annotations:ready`;
- host to webview: `annotations:sync`.

Payload rules:

- events carrying data use exactly one JSON-compatible object payload;
- payloadless events are dispatched without arguments;
- the webview never sends canonical ids, timestamps, creator metadata, document identity, color, or draw type in the first slice.

## Data Mapping

Draft to note:

- `draft.type` -> `note.pdfAnnotation.type`;
- `draft.page` -> `note.pdfAnnotation.page`;
- `draft.rects` -> `note.pdfAnnotation.rects`;
- `draft.quote` -> `note.pdfAnnotation.quote`;
- host default annotation color -> `note.color`;
- host creator -> `note.creator`;
- host note counter -> `note.index`;
- `Date.now()` -> `note.created`;
- fixed values: `group: "annotation"`, `drawType: EDrawType.solid_background`, `textualValue: ""`, `tags: []`.

Note to transport:

- `note.uuid` -> `annotation.id`;
- `note.pdfAnnotation.type` -> `annotation.type`;
- `note.pdfAnnotation.page` -> `annotation.page`;
- `note.pdfAnnotation.rects` -> `annotation.rects`;
- `note.pdfAnnotation.quote` -> `annotation.quote`.

The first-slice transport intentionally omits color and draw type. The webview renders a fixed solid highlight until color/style editing is introduced.

## Host Algorithm

`pdfAnnotationHost.ts` uses inversion of control for host side effects. It builds
deterministic payloads, but it does not import Redux, the store, or the PDF
event bus. `Reader.tsx` provides `IPdfAnnotationCreateRequestHostAdapter`, split
into:

- `state`: publication id, current notes, default annotation metadata, and
  creation timestamp read from `Reader.tsx` props/runtime.
- `ports`: host side-effect functions adapted by `Reader.tsx`.

The current ports are:

- `persistNoteInRedux` calls the existing Redux note add/update path.
- `syncAnnotationsToPdfWebview` dispatches `annotations:sync` through the PDF
  event bus.

On `annotations:ready`:

```text
build the list of current notes with pdfAnnotation
convert each note to TPdfAnnotationTransport
dispatch annotations:sync({ annotations })
```

On `annotation:create-requested`:

```text
validate payload.draft
convert draft to Omit<INoteState, "uuid">
dispatch readerActions.note.addUpdate
read action.payload.newNote
build the current PDF annotation transport list, including the new note
deduplicate by annotation id
dispatch annotations:sync({ annotations })
```

On notes change while the active reader is PDF:

```text
build the current PDF annotation transport list
dispatch annotations:sync({ annotations })
```

The host sends snapshots, not optimistic partial updates. The webview replaces its render map on every `annotations:sync`.

## Webview Initialization

`index_pdf.ts` creates the annotation controller and passes:

- the local Thorium PDF event bus;
- a lookup for `window.PDFViewerApplication`.

The controller:

1. subscribes to `annotations:sync`;
2. subscribes to `highlight:create-from-selection`;
3. listens to PDF.js geometry lifecycle events:
   - `pagesinit`;
   - `documentloaded`;
   - `pagerendered`;
   - `scalechanging`;
   - `rotationchanging`;
4. sends `annotations:ready` once PDF geometry is available.

`destroy()` removes bus subscriptions, PDF.js listeners, scheduled renders, overlay DOM, and in-memory annotation state.

## Selection Capture

The webview captures selection only when the host dispatches `highlight:create-from-selection`.

Algorithm:

```text
selection = window.getSelection()
reject if selection is missing, empty, or has no ranges
collect client rects from all ranges
drop rects smaller than 1px by 1px
for each rect:
    find the PDF page with the largest intersection area
    reject if no page is found
    reject if more than one page is involved
get the PDF.js page view and viewport
convert each page-local rect to PDF coordinates
reject if no valid converted rect remains
dispatch annotation:create-requested({ draft })
```

The multi-page rejection is intentional. The persisted first-slice target has one `page` field, so accepting cross-page selections would create ambiguous data.

## Coordinate Conversion

Selection rectangles start as browser client coordinates. Before conversion, the controller:

1. subtracts the PDF page element's client position;
2. subtracts visible page border widths;
3. clamps the rectangle to the current PDF viewport dimensions;
4. calls PDF.js `viewport.convertToPdfPoint()`.

Stored rectangles are normalized:

```ts
{
    x1: Math.min(pdfX1, pdfX2),
    y1: Math.min(pdfY1, pdfY2),
    x2: Math.max(pdfX1, pdfX2),
    y2: Math.max(pdfY1, pdfY2),
}
```

PDF-space coordinates allow highlights to survive zoom, scroll, rotation, and high-DPI rendering.

## Rendering

On `annotations:sync`:

```text
clear the local annotation map
store every annotation by canonical id
remove existing overlay layers
render overlays for all currently rendered PDF pages
```

On `pagerendered`:

```text
render only the affected page when pageNumber is available
fall back to renderAll when the payload is version-specific or incomplete
```

On scale or rotation changes:

```text
remove all overlay layers immediately
schedule renderAll across two animation frames
```

Overlay behavior:

- one passive overlay layer per rendered page;
- `pointer-events: none`;
- fixed highlight color `#FEF3BD`;
- fixed opacity `0.35`;
- `mix-blend-mode: multiply`;
- annotation id stored in `data-annotation-id`.

## Acceptance Criteria

- A user can open a PDF, select text on one page, trigger annotation creation, and see the official persisted highlight rendered.
- Multi-line selections on one page create highlights with multiple rectangles.
- Multi-page selections do not create annotations in the first slice.
- Reopening a PDF restores persisted highlights.
- Zoom and rotation keep highlights aligned.
- EPUB annotation creation keeps its existing behavior.
- PDF copy, TOC, thumbnails, search, navigation, and preferences keep their existing behavior.
- PDF annotation panel display, navigation, editing, deletion, export/import, and print support remain outside first-slice acceptance.

## Known Follow-Up Requirements

- Transport color and draw type before enabling color/style editing.
- Add a PDF-specific annotation panel path that does not require `locatorExtended`.
- Preserve `pdfAnnotation` in every note mutation.
- Add automated tests for converters, annotation synchronization, and geometry edge cases.
