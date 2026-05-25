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
8. A click on a rendered highlight selects the matching Thorium annotation in the panel.
9. When the PDF is reopened, the host re-synchronizes persisted PDF annotations.

The host is the only source of truth for identity, persistence, timestamps, creator metadata, comments, tags, color, draw type, and selected panel state. The webview is responsible only for selection capture, coordinate conversion, navigation alignment, overlay rendering, and passive highlight hit-testing.

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
- annotation panel editing of persisted PDF annotation comment, color, draw type, and tags;
- opening the existing header annotation edit popover before persistence after explicit header-triggered PDF annotation creation;
- annotation panel deletion of PDF annotations through normal Thorium note removal;
- overlay click selection through `annotation:selected`;
- instant PDF annotation creation from the annotation panel options checkbox;
- runtime draft validation before note creation;
- typed failed-selection diagnostics through `annotation:selection-error`;
- static error toast feedback for PDF annotation validation failures;
- hiding Readium annotation import/export controls in PDF readers until a PDF-specific exchange format exists;
- preservation of `pdfAnnotation` when annotation panel helpers build save payloads.

Excluded:

- keyboard focus directly on PDF highlight overlays;
- search;
- print support;
- export/import changes;
- final localized failed-selection toast UX;
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

The PDF annotations project extends `IPdfPlayerEvent` with nine annotation-specific events across slices 1 through 5.

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

export interface TPdfAnnotationSelectionTarget {
    id: string;
    page: number;
    rectIndex: number;
    rect: TPdfAnnotationRectTransport;
    source: "overlay-click";
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}

export type TPdfAnnotationSelectionErrorReason =
    | "empty"
    | "no-usable-rects"
    | "multi-page"
    | "missing-page"
    | "missing-viewport"
    | "invalid-rects";

export interface TPdfAnnotationSelectionErrorPayload {
    source: "highlight:create-from-selection" | "instant-selection";
    reason: TPdfAnnotationSelectionErrorReason;
}

export interface IPdfPlayerEvent {
    "annotations:sync": (payload: {
        annotations: TPdfAnnotationTransport[];
    }) => any;

    "annotations:set-instant-mode": (payload: {
        enabled: boolean;
    }) => any;

    "annotations:set-visibility": (payload: {
        visible: boolean;
    }) => any;

    "highlight:create-from-selection": () => any;

    "annotations:ready": () => any;

    "annotation:create-requested": (payload: {
        draft: TPdfAnnotationDraftTransport;
        source: "highlight:create-from-selection" | "instant-selection";
    }) => any;

    "viewer:go-to-annotation": (payload: TPdfAnnotationNavigationTarget) => any;

    "annotation:selected": (payload: TPdfAnnotationSelectionTarget) => any;

    "annotation:selection-error": (payload: TPdfAnnotationSelectionErrorPayload) => any;
}
```

Directions:

- host to webview: `highlight:create-from-selection`;
- host to webview: `annotations:sync`;
- host to webview: `annotations:set-instant-mode`;
- host to webview: `annotations:set-visibility`;
- host to webview: `viewer:go-to-annotation`;
- webview to host: `annotation:create-requested`;
- webview to host: `annotations:ready`;
- webview to host: `annotation:selected`;
- webview to host: `annotation:selection-error`.

Payload rules:

- events carrying data use exactly one JSON-compatible object payload;
- payloadless events are dispatched without arguments;
- the webview never sends canonical ids, timestamps, creator metadata, document identity, color, or draw type in creation drafts;
- `annotation:create-requested.source` is required and must be either `highlight:create-from-selection` or `instant-selection`;
- `annotation:create-requested.source` identifies whether the draft came from the explicit annotation trigger or instant selection mode;
- the host rejects and reports `annotation:create-requested` payloads that contain a draft with a missing or unknown source before note persistence;
- `annotations:sync` carries host-owned color and draw type for rendering;
- PDF annotation draw type supports `solid_background`, `underline`, `strikethrough`, and `outline`; `bookmark` is not a PDF highlight style;
- `viewer:go-to-annotation` carries the canonical annotation id plus page/rect fallback;
- the webview resolves `viewer:go-to-annotation` by id first when the annotation exists in its current snapshot, then falls back to the payload page/rect;
- `annotation:selected` carries the canonical annotation id, page, matching rectangle index, rectangle copy, source, and keyboard modifier state;
- the host ignores `annotation:selected` when the payload is incomplete, the source is not `overlay-click`, the rectangle is invalid, the id is unknown, or the id is not a persisted PDF annotation;
- `annotations:set-instant-mode` carries a boolean `enabled` flag and only changes the webview selection observer; it does not persist reader configuration;
- `annotations:set-visibility` carries a boolean `visible` flag derived from `readerConfig.annotation_defaultDrawView !== "hide"` and changes overlay visibility only; it does not remove notes, mutate annotation snapshots, or filter annotation panel cards;
- `annotation:selection-error` carries a typed reason for a failed webview selection capture. It is a diagnostic/user-feedback event, not a PDF lifecycle event and not a persistence command.

## Runtime Draft Validation

`pdfAnnotationValidation.ts` defines the runtime rules for creation drafts before the host creates a Thorium note.

A valid draft must:

- be an object;
- use `type: "pdf-text-highlight"`;
- use a 1-based integer `page`;
- include at least one rectangle;
- include only finite rectangle coordinates;
- include only non-zero rectangles, where `x1 !== x2` and `y1 !== y2`;
- omit `quote` or provide it as a string.

The helper returns a defensive copy of accepted rectangles. This prevents a caller from mutating the accepted draft after validation and before note conversion.

Invalid host create requests are rejected before `readerActions.note.addUpdate`. Missing drafts are ignored as no-op bus noise. Payloads that contain a draft but omit `source`, use an unknown `source`, or carry a malformed draft are reported through the explicit `readium-desktop:renderer:reader:pdf:annotations:host` debug namespace because they represent runtime contract diagnostics, not application failures.

When a malformed draft reaches the host, `Reader.tsx` also shows a static error toast: `Unable to create PDF annotation from this selection.`

Normal webview PDF annotation traces are gated behind `window.__THORIUM_PDF_ANNOTATIONS_DEBUG`. Webview invalid payloads and integration failures still use `console.error`; host-side diagnostics use explicit `debug` namespaces to avoid noisy production console output.

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
validate payload.source when a draft is present
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

Explicit PDF annotation creation from the header uses the existing header
`AnnotationEdit` popover before persistence:

- `highlight:create-from-selection` creates a validated local `pdfAnnotationDraft`
  in `Reader.tsx`;
- saving the popover converts that draft into the canonical Thorium note and
  dispatches the normal note add/update action;
- canceling the popover drops the draft without persisting a note;
- quick-annotation mode skips this editor and persists through the host
  create-request path silently.

## Webview Initialization

`index_pdf.ts` creates the annotation controller and passes:

- the local Thorium PDF event bus;
- a lookup for `window.PDFViewerApplication`.

The controller:

1. subscribes to `annotations:sync`;
2. subscribes to `annotations:set-instant-mode`;
3. subscribes to `annotations:set-visibility`;
4. subscribes to `highlight:create-from-selection`;
5. subscribes to `viewer:go-to-annotation`;
6. listens to document selection changes for optional instant annotation mode;
7. listens to document pointer/click events for passive overlay hit-testing;
8. listens to PDF.js geometry lifecycle events:
   - `pagesinit`;
   - `documentloaded`;
   - `pagerendered`;
   - `scalechanging`;
   - `rotationchanging`;
9. sends `annotations:ready` once PDF geometry is available.

`destroy()` removes bus subscriptions, PDF.js listeners, scheduled renders, overlay DOM, and in-memory annotation state.

## Selection Capture

The webview captures selection only when the host dispatches `highlight:create-from-selection`.

Algorithm:

```text
selection = window.getSelection()
dispatch annotation:selection-error(empty) if selection is missing, empty, or has no ranges
collect client rects from all ranges
drop rects smaller than 1px by 1px
dispatch annotation:selection-error(no-usable-rects) if no usable rect remains
for each rect:
    find the PDF page with the largest intersection area
    dispatch annotation:selection-error(missing-page) if no page is found
    dispatch annotation:selection-error(multi-page) if more than one page is involved
get the PDF.js page view and viewport
dispatch annotation:selection-error(missing-page) if the page element disappeared
dispatch annotation:selection-error(missing-viewport) if the PDF.js viewport is unavailable
convert each page-local rect to PDF coordinates
dispatch annotation:selection-error(invalid-rects) if no valid converted rect remains
dispatch annotation:create-requested({ draft, source: "highlight:create-from-selection" })
```

The multi-page rejection is intentional. The persisted first-slice target has one `page` field, so accepting cross-page selections would create ambiguous data.

## Instant Annotation Mode

The annotation panel option `reader.annotations.advancedMode` maps to PDF instant mode when the active reader is PDF. `ReaderMenu.tsx` keeps using the existing local serial-annotator state and sends it to the PDF webview with:

```ts
createOrGetPdfEventBus().dispatch("annotations:set-instant-mode", {
    enabled: serialAnnotator,
});
```

When enabled, the webview observes `selectionchange`, waits for a short stable-selection delay, converts the selection with the same `selectionToDraft()` algorithm used by the toolbar annotation action, and dispatches `annotation:create-requested` with the resulting draft and `source: "instant-selection"`.

Rules:

- disabled mode observes no creation side effects;
- empty selections clear the duplicate guard and do not show a toast;
- duplicate settled selections are ignored until the user changes or clears the selection;
- invalid settled selections emit `annotation:selection-error` with source `instant-selection`;
- the host still owns persistence, color, draw type, and whether an editor opens after creation;
- instant selection mode only controls automatic creation after selection;
- the existing `reader.annotations.quickAnnotations` checkbox independently controls whether the editor is skipped. When quick creation is disabled, explicit PDF creation and instant PDF creation open the same header editor before persistence; when quick creation is enabled, both flows persist silently, matching EPUB quick creation.

## Visibility Mode

The annotation panel option `reader.annotations.hide` maps to PDF overlay visibility when the active reader is PDF. Thorium already stores this preference as `readerConfig.annotation_defaultDrawView`; PDF uses the same value:

```ts
createOrGetPdfEventBus().dispatch("annotations:set-visibility", {
    visible: readerConfig.annotation_defaultDrawView !== "hide",
});
```

Rules:

- hidden mode removes rendered PDF annotation overlays from the webview;
- hidden mode keeps the host snapshot and persisted Thorium notes unchanged;
- hidden mode does not filter annotation panel cards, because the panel remains the note management surface;
- syncs received while hidden update the in-memory webview snapshot but do not render overlays until visibility is restored;
- page render, zoom, and rotation events do not restore overlays while hidden;
- panel navigation can still scroll to a PDF annotation target, but there is no visible highlight flash while overlays are hidden;
- hidden overlays cannot be selected by click and do not show the clickable cursor hint.

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

## Panel Reading Order

When the annotation panel sorts PDF annotations by progression, PDF targets use
visual reading order:

1. page number ascending;
2. visual top position descending, using `max(y1, y2)` from the first PDF-space
   rectangle because PDF.js viewport conversion stores higher PDF `y` values
   nearer the visual top of an unrotated page;
3. visual left position ascending, using `min(x1, x2)`;
4. canonical annotation id as a stable tie breaker.

The choice is deliberately based on visual position rather than raw `y1`
ascending. Raw PDF-space vertical coordinates are not the same as screen
reading order, so sorting by `y1` ascending can place lower highlights before
upper highlights.

## Rendering

On `annotations:sync`:

```text
clear the local annotation map
store every annotation by canonical id
remove existing overlay layers
stop when visibility is hidden
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
- annotation id stored in `data-annotation-id`;
- hovering a hit-tested highlight applies a temporary document-level `cursor: pointer` rule, while the overlay and highlight elements still keep `pointer-events: none`.
- when `annotations:set-visibility` is `visible: false`, overlay layers are removed and subsequent render events stay no-op until visibility is restored.

## Overlay Click Selection

Rendered highlights remain passive DOM (`pointer-events: none`). The controller
listens for document-level pointer/click events and hit-tests the pointer or click point
against currently rendered highlight rectangles.

Algorithm:

```text
record pointerdown button and coordinates
on pointermove:
    reject drag-like movement or active browser text selection
    if the pointer is over a rendered highlight inside a PDF page, show a pointer cursor
    otherwise restore the normal PDF.js cursor
on click:
    reject non-primary clicks
    reject drag-like movement
    reject clicks whose DOM target/point is outside a PDF page element
    find rendered highlight rectangles containing the click point
    reject simple click when browser text selection is active
    allow Shift+click on a rendered highlight even if browser text selection remains active
    choose the smallest matching rectangle, then nearest center, then latest rendered element
    dispatch annotation:selected with id, page, rectIndex, rect, source, and modifiers
```

The host maps a valid `annotation:selected` payload to the existing reader menu
state:

- simple click opens/focuses the annotation card without editing;
- `Shift+click` opens the same card in edit mode when panel editing is allowed;
- `Shift+click` remains available when a previous PDF.js text selection is still active, because it is the explicit edit gesture;
- invalid ids or non-PDF notes are logged and ignored;
- no note mutation, PDF mutation, export/import, or extra patch event is created.

The clickable cursor is a UX hint only. It is implemented as a transient class on the root document so it can override PDF.js text-layer cursors at the hovered point without making the overlay DOM receive pointer events.

When `annotation:selection-error` reaches the host, `Reader.tsx` shows the same static error toast: `Unable to create PDF annotation from this selection.`

Accessibility boundary for slice 5:

- overlay layers and highlight elements remain `aria-hidden` and are not focusable;
- after pointer selection, focus moves to the annotation card in the panel through existing menu state;
- direct keyboard focus on PDF overlays is a future slice because it would change the passive `pointer-events: none` interaction model.

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
- Header-triggered explicit PDF annotation creation opens the header annotation edit popover before the note is persisted.
- Missing or unknown PDF annotation creation sources are rejected and reported before note persistence.
- PDF instant mode triggers PDF annotation creation automatically after a stable PDF text selection.
- PDF quick creation independently skips the header annotation edit popover for explicit and instant PDF annotation creation.
- PDF annotations sort by visual reading order in the annotation panel progression sort: page, top, left, id.
- Edited PDF annotation color and draw type update the webview overlay after snapshot sync.
- Deleting a PDF annotation removes the Thorium note and removes the webview overlay after snapshot sync.
- Hovering a rendered PDF highlight shows a clickable pointer cursor while preserving passive overlays.
- Clicking a rendered PDF highlight opens/focuses the matching annotation panel card without changing persistence.
- Shift-clicking a rendered PDF highlight opens the matching PDF annotation in the panel edit form.
- The annotation panel hide checkbox hides and restores PDF webview overlays without deleting notes or filtering panel cards.
- Hidden PDF overlays cannot be selected by click and do not show the clickable cursor hint.
- Invalid PDF annotation creation drafts are rejected before note persistence.
- Failed webview selection captures emit `annotation:selection-error` with a typed reason.
- Selection and draft validation failures trigger a static error toast.
- Verbose PDF annotation logs are disabled unless `window.__THORIUM_PDF_ANNOTATIONS_DEBUG` is enabled.
- Standalone harness automation covers invalid selection rejection, hide/show visibility, zoom visibility, rotation visibility, click selection, deletion, and no selection after deletion.
- PDF reader annotation panels do not expose Readium annotation import/export controls.
- PDF annotation export/import and print support remain outside slice 5 acceptance.

## Known Follow-Up Requirements

- Add automated browser/Electron checks for real PDF.js navigation positioning.
- Add keyboard-accessible focus behavior directly on PDF highlight overlays.
- Add a localized toast or status microcopy for `annotation:selection-error` reasons.
