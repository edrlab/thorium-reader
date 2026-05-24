# PDF.js Standalone Annotation Harness

This harness runs the Thorium PDF annotation controller against the packaged
PDF.js viewer without launching Thorium.

It is a developer test bench, not a product surface. It helps validate the
browser/PDF.js part of the feature: selection capture, page hit-testing,
PDF coordinate conversion, overlay rendering, panel-to-viewer navigation, zoom,
rotation, click selection, and full snapshot sync through a fake Thorium event
bus.

## What It Tests

- Real packaged PDF.js viewer DOM from `node_modules/pdf.js/build/gh-pages/web/viewer.html`.
- Real `PdfAnnotationController` from `src/renderer/reader/pdf/webview/annotations.ts`.
- Real browser selection geometry and PDF.js page viewport conversion.
- In-memory fake annotation persistence through `annotations:sync`.
- `viewer:go-to-annotation` navigation using annotation id plus page/rect fallback.
- `annotation:selected` dispatch from a real click on a rendered highlight.
- Snapshot-driven style updates and deletion for the latest fake annotation.

## What It Does Not Test

- Electron webview lifecycle.
- Thorium parent/child IPC.
- Redux note persistence.
- Thorium annotation panel rendering and Redux wiring.
- Native PDF file mutation.

## Run

From the repository root:

```powershell
node projects\pdf-annotations\harness\build.mjs
node projects\pdf-annotations\harness\serve.mjs
```

Then open:

```text
http://localhost:4173/projects/pdf-annotations/harness/standalone.html
```

The default PDF is PDF.js' packaged sample:

```text
/node_modules/pdf.js/build/gh-pages/web/compressed.tracemonkey-pldi-09.pdf
```

To test another PDF that is served from this repository, pass it as a query
parameter:

```text
http://localhost:4173/projects/pdf-annotations/harness/standalone.html?file=/path/from/repo/root/sample.pdf
```

## Automated Tests

Install the Playwright Chromium browser once:

```powershell
npm run test:pdf-annotations:harness:install
```

Then run the harness regression test:

```powershell
npm run test:pdf-annotations:harness
```

The Playwright test setup builds the harness, starts a local server, opens
`standalone.html`, waits for the PDF.js iframe and injected harness panel,
creates a browser selection inside the real PDF.js text layer, clicks
`Create highlight`, verifies that an annotation and overlay exist, clicks
`Style latest`, verifies the outline/color update, clicks `Go to latest`,
verifies the navigation flash, clicks the rendered highlight to verify
`annotation:selected`, then clicks `Delete latest` and verifies that the overlay
is removed. The test closes its own local server in teardown so the command can
be used as an automated gate.

## Manual Test Flow

1. Select text in the PDF.js viewer.
2. Click `Create highlight` in the floating harness panel.
3. Confirm that the highlight appears and the annotation count increases.
4. Click `Style latest`.
5. Confirm that the highlight changes to a blue outline.
6. Scroll away or change page/zoom if desired.
7. Click `Go to latest`.
8. Confirm that the viewer returns to the highlight and flashes it.
9. Click the highlight.
10. Confirm that the harness log records `annotation:selected`.
11. Change zoom and rotation in PDF.js.
12. Confirm that the highlight remains aligned with the selected text.
13. Click `Delete latest` or `Clear` and confirm that the overlay disappears.

## Architecture

`standalone.html` is intentionally outside the PDF.js viewer. It loads the
packaged PDF.js `viewer.html` in a same-origin iframe, then injects the bundled
`standaloneAnnotationHarness.ts` module into that iframe. The injected module
runs in the PDF.js document, so `window.getSelection()`, `document`, and
`window.PDFViewerApplication` are the same globals used by the real controller.

The injected module creates a small fake implementation of `IEventBusPdfPlayer`.
When the controller dispatches `annotation:create-requested`, the fake host
assigns an id, default color, and default draw type, stores the annotation in
memory, and sends a complete `annotations:sync` snapshot back to the controller.

The `Go to latest` control dispatches `viewer:go-to-annotation` with the stored
annotation id, page, and first rectangle. This mirrors the slice 2 parent-panel
navigation payload without requiring Thorium, Redux, or Electron.

The `Style latest` and `Delete latest` controls mutate the fake in-memory host
state and then send a new full `annotations:sync` snapshot. This mirrors the
slice 3 decision to use snapshot refresh for edit/delete instead of adding
patch events to the PDF event bus.

The harness also subscribes to `annotation:selected` and stores the last
selected annotation id. This mirrors the slice 4 host contract without mounting
Thorium's Redux-backed annotation panel.

## Injection Behavior

The harness is automatically injected only when the developer opens
`standalone.html`. Directly opening the packaged PDF.js `viewer.html` does not
inject the harness.

This is intentional. The harness must not patch or overwrite packaged PDF.js
files under `node_modules/pdf.js` or a local `vendor/pdf.js` checkout. Keeping
the injection in `standalone.html` makes the test bench reversible, local to the
project, and separate from upstream PDF.js artifacts.

The `Inject harness` button remains available as a manual fallback when the
iframe reloads, the generated bundle is rebuilt while the page is open, or the
automatic injection runs before the iframe document is reachable.

## Critique

This harness is useful because it exercises the controller with real PDF.js
geometry while keeping Thorium out of the loop. The tradeoff is that it is still
not a full integration test: it does not prove Electron webview behavior,
Redux persistence, note conversion, or Thorium annotation panel rendering.

Revisit this harness when PDF annotations need automated browser regression
coverage, when PDF.js changes its viewer globals, or when the controller starts
depending on host data that cannot be represented by the fake bus/store.
