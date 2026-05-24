# PDF.js Standalone Annotation Harness

This harness runs the Thorium PDF annotation controller against the packaged
PDF.js viewer without launching Thorium.

It is a developer test bench, not a product surface. It helps validate the
browser/PDF.js part of the feature: selection capture, page hit-testing,
PDF coordinate conversion, overlay rendering, zoom, rotation, and full snapshot
sync through a fake Thorium event bus.

## What It Tests

- Real packaged PDF.js viewer DOM from `node_modules/pdf.js/build/gh-pages/web/viewer.html`.
- Real `PdfAnnotationController` from `src/renderer/reader/pdf/webview/annotations.ts`.
- Real browser selection geometry and PDF.js page viewport conversion.
- In-memory fake annotation persistence through `annotations:sync`.

## What It Does Not Test

- Electron webview lifecycle.
- Thorium parent/child IPC.
- Redux note persistence.
- Annotation panel behavior.
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

The Playwright config builds the harness, starts the local server, opens
`standalone.html`, waits for the PDF.js iframe and injected harness panel,
creates a browser selection inside the real PDF.js text layer, clicks
`Create highlight`, verifies that an annotation and overlay exist, then clicks
`Clear` and verifies that the overlay is removed.

## Manual Test Flow

1. Select text in the PDF.js viewer.
2. Click `Create highlight` in the floating harness panel.
3. Confirm that the highlight appears and the annotation count increases.
4. Change zoom and rotation in PDF.js.
5. Confirm that the highlight remains aligned with the selected text.
6. Click `Clear` and confirm that the overlay disappears.

## Architecture

`standalone.html` is intentionally outside the PDF.js viewer. It loads the
packaged PDF.js `viewer.html` in a same-origin iframe, then injects the bundled
`standaloneAnnotationHarness.ts` module into that iframe. The injected module
runs in the PDF.js document, so `window.getSelection()`, `document`, and
`window.PDFViewerApplication` are the same globals used by the real controller.

The injected module creates a small fake implementation of `IEventBusPdfPlayer`.
When the controller dispatches `annotation:create-requested`, the fake host
assigns an id, stores the annotation in memory, and sends a complete
`annotations:sync` snapshot back to the controller.

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
Redux persistence, note conversion, or annotation panel synchronization.

Revisit this harness when PDF annotations need automated browser regression
coverage, when PDF.js changes its viewer globals, or when the controller starts
depending on host data that cannot be represented by the fake bus/store.
