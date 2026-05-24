# PDF Annotations Specification

## Purpose

This document is the implementation contract for the current PDF annotations slices in Thorium.

The first slice implements the smallest useful loop:

1. The user selects text inside the PDF.js webview.
2. The host asks the webview to create a highlight from the current selection.
3. The webview converts the selection into PDF coordinates.
4. The webview sends an annotation creation draft to the host.
5. The host creates a canonical Thorium note.
6. The host sends the persisted annotation snapshot back to the webview.
7. The webview renders the official highlight overlay.
8. When the PDF is reopened, the host re-synchronizes persisted PDF annotations.

The host is the only source of truth for identity, persistence, timestamps, creator metadata, comments, tags, color, and draw type. The webview is responsible only for selection capture, coordinate conversion, navigation alignment, and overlay rendering.

## Scope

Included:

- PDF text highlight targets;
- single-page selections;
- multi-line selections on one page;
- webview-to-host creation drafts;
- host-side canonical note creation through existing note persistence;
- host-to-webview rendering through `annotations:sync`;
- persisted annotation rehydration on PDF readiness;
- overlay alignment after zoom and rotation changes;
- annotation panel display of PDF quote and page metadata for persisted PDF notes;
- annotation panel navigation to PDF highlights through `viewer:go-to-annotation`;
- annotation panel editing of PDF annotation comment, color, draw type, and tags;
- annotation panel deletion of PDF annotations through normal Thorium note removal;
- hiding Readium annotation import/export controls in PDF readers until a PDF-specific exchange format exists;
- preservation of `pdfAnnotation` when annotation panel helpers build save payloads.

Excluded:

- overlay click selection/focus;
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

The PDF annotations project extends `IPdfPlayerEvent` with five annotation-specific events across slices 1, 2, and 3.

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

export type TPdfAnnotationDrawType = Exclude<TDrawType, "bookmark">;

export interface TPdfAnnotationTransport extends TPdfAnnotationDraftTransport {
    id: string;
    color: IColor;
    drawType: TPdfAnnotationDrawType;
}

export interface TPdfAnnotationNavigationTarget {
    id: string;
    page: number;
    rect: TPdfAnnotationRectTransport;
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

    "viewer:go-to-annotation": (payload: TPdfAnnotationNavigationTarget) => any;
}
```

Directions:

- host to webview: `highlight:create-from-selection`;
- host to webview: `annotations:sync`;
- host to webview: `viewer:go-to-annotation`;
- webview to host: `annotation:create-requested`;
- webview to host: `annotations:ready`.

Payload rules:

- events carrying data use exactly one JSON-compatible object payload;
- payloadless events are dispatched without arguments;
- the webview never sends canonical ids, timestamps, creator metadata, document identity, color, or draw type in creation drafts;
- `annotations:sync` carries host-owned color and draw type for rendering;
- PDF annotation draw type supports `solid_background`, `underline`, `strikethrough`, and `outline`; `bookmark` is not a PDF highlight style;
- `viewer:go-to-annotation` carries the canonical annotation id plus page/rect fallback;
- the webview resolves `viewer:go-to-annotation` by id first when the annotation exists in its current snapshot, then falls back to the payload page/rect.

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
- `note.pdfAnnotation.quote` -> `annotation.quote`;
- `note.color` -> `annotation.color`;
- `note.drawType` -> `annotation.drawType` as a PDF-supported draw type, falling back to `solid_background` for unsupported note styles.

Transport compatibility:

- older runtime snapshots without color render with default yellow `rgb(254, 243, 189)`;
- older runtime snapshots without draw type render as `solid_background`;
- no persisted note migration is needed because color and draw type already live on `INoteState`.

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

## Editing And Deletion

PDF annotation editing uses the existing annotation panel edit form:

- comment edits update `note.textualValue`;
- color edits update `note.color`;
- style edits update `note.drawType`;
- tag edits update `note.tags`;
- save payloads must preserve `note.pdfAnnotation` unchanged except for defensive cloning;
- edited notes flow through the existing `readerActions.note.addUpdate` path.

PDF annotation deletion uses the existing Thorium note removal path:

- single-card deletion dispatches `readerActions.note.remove` for that note;
- bulk deletion includes PDF annotations in the deletion candidate list;
- `Reader.tsx` reacts to the changed note list and sends a fresh `annotations:sync` snapshot;
- no `annotations:delete`, `annotations:upsert`, or native PDF mutation is introduced in this slice.

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
- host-owned annotation color when present, defaulting to `rgb(254, 243, 189)`;
- `solid_background` uses background fill, opacity `0.35`, and `mix-blend-mode: multiply`;
- `underline` uses an opaque lower border stroke;
- `strikethrough` uses an opaque middle stroke;
- `outline` uses an opaque border stroke;
- annotation id stored in `data-annotation-id`.

## Acceptance Criteria

- A user can open a PDF, select text on one page, trigger annotation creation, and see the official persisted highlight rendered.
- Multi-line selections on one page create highlights with multiple rectangles.
- Multi-page selections do not create annotations in the first slice.
- Reopening a PDF restores persisted highlights.
- Zoom and rotation keep highlights aligned.
- EPUB annotation creation keeps its existing behavior.
- PDF copy, TOC, thumbnails, search, navigation, and preferences keep their existing behavior.
- PDF annotations render in the annotation panel without requiring `locatorExtended`.
- Clicking a PDF annotation card navigates to the page/rectangle target and flashes the rendered highlight.
- PDF annotation cards can edit comment, color, draw type, and tags without losing `pdfAnnotation`.
- Edited PDF annotation color and draw type update the webview overlay after snapshot sync.
- Deleting a PDF annotation removes the Thorium note and removes the webview overlay after snapshot sync.
- PDF reader annotation panels do not expose Readium annotation import/export controls.
- PDF annotation export/import and print support remain outside slice 3 acceptance.

## Known Follow-Up Requirements

- Add automated browser/Electron checks for real PDF.js navigation positioning.
- Add explicit overlay selection/focus behavior before making highlights pointer-interactive.
