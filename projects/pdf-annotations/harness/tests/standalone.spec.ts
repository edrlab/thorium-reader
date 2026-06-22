import { expect, type Frame, type Page, test } from "@playwright/test";

type THarnessServer = {
    close: (callback?: (error?: Error) => void) => void;
};

let harnessServer: THarnessServer | undefined;
let closeHarnessServer: ((server: THarnessServer) => Promise<void>) | undefined;

declare global {
    interface Window {
        __thoriumPdfAnnotationHarness?: {
            annotations: () => unknown[];
            deleteLatestAnnotation: () => void;
            goToAnnotation: (id?: string) => void;
            selectedAnnotationId: () => string;
            selectionErrorCount: () => number;
            selectionErrors: () => Array<{
                reason?: string;
                source?: string;
            }>;
            selectionEventCount: () => number;
            setInstantMode: (enabled: boolean) => void;
            setVisible: (visible: boolean) => void;
            styleLatestAnnotation: () => void;
        };
    }
}

test.beforeAll(async () => {
    await import("../build.mjs");
    const serverModule = (await import("../serve.mjs")) as {
        closeHarnessServer: (server: THarnessServer) => Promise<void>;
        startHarnessServer: (port?: number) => Promise<THarnessServer>;
    };
    closeHarnessServer = serverModule.closeHarnessServer;
    harnessServer = await serverModule.startHarnessServer(Number(process.env.PDF_ANNOTATION_HARNESS_PORT) || 4173);
});

test.afterAll(async () => {
    if (harnessServer && closeHarnessServer) {
        await closeHarnessServer(harnessServer);
    }
});

async function getPdfJsFrame(page: Page) {
    const frameElement = page.locator("#pdfjs-frame");
    await expect(frameElement).toBeVisible();

    const handle = await frameElement.elementHandle();
    const frame = await handle?.contentFrame();
    if (!frame) {
        throw new Error("PDF.js iframe was not available");
    }

    return frame;
}

async function waitForHarness(frame: Frame) {
    await expect(frame.locator("#thorium-pdf-annotation-harness")).toBeVisible();
    await expect
        .poll(async () =>
            frame.evaluate(() => {
                const status = document.querySelector("#thorium-pdf-annotation-harness-status")?.textContent || "";

                return /Ready|Synced/.test(status);
            }),
        )
        .toBe(true);
}

async function waitForSelectableText(frame: Frame) {
    await expect
        .poll(
            async () =>
                frame.evaluate(() => {
                    return Array.from(document.querySelectorAll<HTMLElement>(".textLayer span")).some(
                        (span) => !!span.textContent?.trim() && span.getClientRects().length > 0,
                    );
                }),
            {
                timeout: 30000,
            },
        )
        .toBe(true);
}

async function selectFirstVisibleTextRun(frame: Frame) {
    return frame.evaluate(() => {
        const span = Array.from(document.querySelectorAll<HTMLElement>(".textLayer span")).find((candidate) => {
            const text = candidate.textContent?.trim() || "";

            return text.length >= 8 && candidate.getClientRects().length > 0;
        });
        if (!span) {
            throw new Error("No selectable PDF text span was found");
        }

        const textNode = Array.from(span.childNodes).find(
            (node): node is Text => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim(),
        );
        if (!textNode?.textContent) {
            throw new Error("Selectable PDF text span did not contain a text node");
        }

        const firstNonWhitespace = textNode.textContent.search(/\S/);
        const start = firstNonWhitespace >= 0 ? firstNonWhitespace : 0;
        const end = Math.min(textNode.textContent.length, start + Math.min(16, textNode.textContent.trim().length));
        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.dispatchEvent(new Event("selectionchange"));

        return {
            quote: selection?.toString() || "",
            rectCount: range.getClientRects().length,
        };
    });
}

async function waitForRenderedHighlight(frame: Frame) {
    const highlights = frame.locator(".thorium-pdf-annotation-highlight");
    await expect.poll(async () => highlights.count()).toBeGreaterThan(0);

    const box = await highlights.first().boundingBox();
    expect(box?.width || 0).toBeGreaterThan(0.5);
    expect(box?.height || 0).toBeGreaterThan(0.5);

    return box;
}

async function waitForPdfViewerFrames(frame: Frame) {
    await frame.evaluate(
        () =>
            new Promise<void>((resolve) => {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => resolve());
                });
            }),
    );
}

async function setPdfZoom(frame: Frame, scale: number) {
    await frame.evaluate((nextScale) => {
        const application = (window as any).PDFViewerApplication;
        if (!application?.pdfViewer) {
            throw new Error("PDFViewerApplication.pdfViewer was not available");
        }

        application.pdfViewer.currentScaleValue = String(nextScale);
    }, scale);
    await waitForPdfViewerFrames(frame);
}

async function rotatePdfClockwise(frame: Frame) {
    await frame.evaluate(() => {
        const application = (window as any).PDFViewerApplication;
        if (!application?.pdfViewer) {
            throw new Error("PDFViewerApplication.pdfViewer was not available");
        }

        const currentRotation = Number(application.pdfViewer.pagesRotation) || 0;
        application.pdfViewer.pagesRotation = (currentRotation + 90) % 360;
    });
    await waitForPdfViewerFrames(frame);
}

async function openStandaloneHarness(page: Page) {
    await page.goto("/projects/pdf-annotations/harness/standalone.html", {
        waitUntil: "domcontentloaded",
    });

    const frame = await getPdfJsFrame(page);
    await waitForHarness(frame);
    await waitForSelectableText(frame);

    return frame;
}

async function annotationCount(frame: Frame) {
    return frame.evaluate(() => window.__thoriumPdfAnnotationHarness?.annotations().length ?? -1);
}

async function selectionEventCount(frame: Frame) {
    return frame.evaluate(() => window.__thoriumPdfAnnotationHarness?.selectionEventCount() || 0);
}

async function latestAnnotationIsSelected(frame: Frame) {
    return frame.evaluate(() => {
        const harness = window.__thoriumPdfAnnotationHarness;
        const annotations = harness?.annotations() || [];
        const latest = annotations[annotations.length - 1] as { id?: string } | undefined;

        return !!latest?.id && harness?.selectedAnnotationId() === latest.id;
    });
}

async function createHighlightFromSelection(frame: Frame) {
    const selection = await selectFirstVisibleTextRun(frame);
    expect(selection.quote.trim().length).toBeGreaterThan(0);
    expect(selection.rectCount).toBeGreaterThan(0);

    await frame.locator("#thorium-pdf-annotation-create").click();
    await expect.poll(async () => annotationCount(frame)).toBe(1);

    return waitForRenderedHighlight(frame);
}

async function clickHighlightCenter(
    page: Page,
    box: NonNullable<Awaited<ReturnType<typeof waitForRenderedHighlight>>>,
) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test("reports an invalid empty selection without creating an annotation", async ({ page }) => {
    const frame = await openStandaloneHarness(page);

    await frame.evaluate(() => window.getSelection()?.removeAllRanges());
    await frame.locator("#thorium-pdf-annotation-create").click();

    await expect.poll(async () => annotationCount(frame)).toBe(0);
    await expect
        .poll(async () =>
            frame.evaluate(() => {
                const harness = window.__thoriumPdfAnnotationHarness;
                const errors = harness?.selectionErrors() || [];

                return errors[errors.length - 1]?.reason || "";
            }),
        )
        .toBe("empty");
    await expect(frame.locator("#thorium-pdf-annotation-harness-log")).toContainText("annotation:selection-error");
});

test("creates an annotation and selects it by clicking the rendered highlight", async ({ page }) => {
    const frame = await openStandaloneHarness(page);
    const highlightBox = await createHighlightFromSelection(frame);

    await frame.evaluate(() => window.getSelection()?.removeAllRanges());
    await clickHighlightCenter(page, highlightBox!);

    await expect.poll(async () => latestAnnotationIsSelected(frame)).toBe(true);
    await expect(frame.locator("#thorium-pdf-annotation-harness-log")).toContainText("annotation:selected");
    await expect(frame.locator(".thorium-pdf-annotation-highlight")).toHaveCount(1);
});

test("hides PDF overlays without allowing selection from the old highlight location", async ({ page }) => {
    const frame = await openStandaloneHarness(page);
    const highlightBox = await createHighlightFromSelection(frame);
    const highlights = frame.locator(".thorium-pdf-annotation-highlight");
    const selectionEventsBeforeHide = await selectionEventCount(frame);

    await frame.locator("#thorium-pdf-annotation-visibility").click();
    await expect(highlights).toHaveCount(0);
    await expect(frame.locator("#thorium-pdf-annotation-harness-log")).toContainText("annotations:set-visibility");

    await clickHighlightCenter(page, highlightBox!);
    await waitForPdfViewerFrames(frame);
    expect(await selectionEventCount(frame)).toBe(selectionEventsBeforeHide);

    await frame.locator("#thorium-pdf-annotation-visibility").click();
    await waitForRenderedHighlight(frame);
});

test("keeps overlays visible after zoom and rotation, then styles and navigates to the highlight", async ({ page }) => {
    const frame = await openStandaloneHarness(page);
    await createHighlightFromSelection(frame);
    const highlights = frame.locator(".thorium-pdf-annotation-highlight");

    await setPdfZoom(frame, 1.25);
    await waitForRenderedHighlight(frame);

    await rotatePdfClockwise(frame);
    await waitForRenderedHighlight(frame);

    await expect(frame.locator("#thorium-pdf-annotation-style-latest")).toBeEnabled();
    await frame.locator("#thorium-pdf-annotation-style-latest").click();

    await expect
        .poll(async () => frame.locator('.thorium-pdf-annotation-highlight[data-draw-type="outline"]').count())
        .toBeGreaterThan(0);
    const styledHighlight = await highlights.first().evaluate((element) => {
        const style = window.getComputedStyle(element);

        return {
            backgroundColor: style.backgroundColor,
            borderColor: style.borderTopColor,
            borderStyle: style.borderTopStyle,
            borderWidth: style.borderTopWidth,
        };
    });
    expect(styledHighlight.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(styledHighlight.borderColor).toBe("rgb(37, 99, 235)");
    expect(styledHighlight.borderStyle).toBe("solid");
    expect(styledHighlight.borderWidth).toBe("2px");

    await expect(frame.locator("#thorium-pdf-annotation-go-to-latest")).toBeEnabled();
    await frame.locator("#thorium-pdf-annotation-go-to-latest").click();

    await expect
        .poll(async () => frame.locator('.thorium-pdf-annotation-highlight[data-navigation-flash="true"]').count())
        .toBeGreaterThan(0);
});

test("deletes the latest annotation and prevents selection from the removed highlight location", async ({ page }) => {
    const frame = await openStandaloneHarness(page);
    await createHighlightFromSelection(frame);
    const highlights = frame.locator(".thorium-pdf-annotation-highlight");
    await frame.evaluate(() => window.getSelection()?.removeAllRanges());
    const deletedHighlightBox = await highlights.first().boundingBox();
    if (!deletedHighlightBox) {
        throw new Error("Rendered PDF annotation highlight did not have a bounding box");
    }

    await expect(frame.locator("#thorium-pdf-annotation-delete-latest")).toBeEnabled();
    await frame.locator("#thorium-pdf-annotation-delete-latest").click();

    await expect.poll(async () => annotationCount(frame)).toBe(0);
    await expect(highlights).toHaveCount(0);

    const selectionEventsBeforeDeletedClick = await selectionEventCount(frame);
    await clickHighlightCenter(page, deletedHighlightBox);
    await waitForPdfViewerFrames(frame);
    expect(await selectionEventCount(frame)).toBe(selectionEventsBeforeDeletedClick);
});

test("creates a PDF annotation from instant mode after a stable selection", async ({ page }) => {
    const frame = await openStandaloneHarness(page);

    await frame.evaluate(() => window.getSelection()?.removeAllRanges());
    await frame.locator("#thorium-pdf-annotation-instant-mode").click();
    const instantSelection = await selectFirstVisibleTextRun(frame);
    expect(instantSelection.quote.trim().length).toBeGreaterThan(0);

    await expect.poll(async () => annotationCount(frame)).toBe(1);
    await expect(frame.locator("#thorium-pdf-annotation-harness-log")).toContainText("annotations:set-instant-mode");
});
