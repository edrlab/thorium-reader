import { expect, type Frame, type Page, test } from "@playwright/test";

declare global {
    interface Window {
        __thoriumPdfAnnotationHarness?: {
            annotations: () => unknown[];
            goToAnnotation: (id?: string) => void;
        };
    }
}

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
    await expect.poll(async () => frame.evaluate(() => {
        const status = document.querySelector("#thorium-pdf-annotation-harness-status")?.textContent || "";

        return /Ready|Synced/.test(status);
    })).toBe(true);
}

async function waitForSelectableText(frame: Frame) {
    await expect.poll(async () => frame.evaluate(() => {
        return Array.from(document.querySelectorAll<HTMLElement>(".textLayer span"))
            .some((span) => !!span.textContent?.trim() && span.getClientRects().length > 0);
    }), {
        timeout: 30000,
    }).toBe(true);
}

async function selectFirstVisibleTextRun(frame: Frame) {
    return frame.evaluate(() => {
        const span = Array.from(document.querySelectorAll<HTMLElement>(".textLayer span"))
            .find((candidate) => {
                const text = candidate.textContent?.trim() || "";

                return text.length >= 8 && candidate.getClientRects().length > 0;
            });
        if (!span) {
            throw new Error("No selectable PDF text span was found");
        }

        const textNode = Array.from(span.childNodes)
            .find((node): node is Text => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim());
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

        return {
            quote: selection?.toString() || "",
            rectCount: range.getClientRects().length,
        };
    });
}

test("creates, navigates to, and clears a PDF highlight through the standalone harness", async ({ page }) => {
    await page.goto("/projects/pdf-annotations/harness/standalone.html", {
        waitUntil: "domcontentloaded",
    });

    const frame = await getPdfJsFrame(page);
    await waitForHarness(frame);
    await waitForSelectableText(frame);

    const selection = await selectFirstVisibleTextRun(frame);
    expect(selection.quote.trim().length).toBeGreaterThan(0);
    expect(selection.rectCount).toBeGreaterThan(0);

    await frame.locator("#thorium-pdf-annotation-create").click();

    await expect.poll(async () => frame.evaluate(() => {
        return window.__thoriumPdfAnnotationHarness?.annotations().length ?? -1;
    })).toBe(1);

    const highlights = frame.locator(".thorium-pdf-annotation-highlight");
    await expect.poll(async () => highlights.count()).toBeGreaterThan(0);

    const firstHighlightBox = await highlights.first().boundingBox();
    expect(firstHighlightBox?.width || 0).toBeGreaterThan(0.5);
    expect(firstHighlightBox?.height || 0).toBeGreaterThan(0.5);

    await expect(frame.locator("#thorium-pdf-annotation-go-to-latest")).toBeEnabled();
    await frame.locator("#thorium-pdf-annotation-go-to-latest").click();

    await expect.poll(async () => frame.locator(".thorium-pdf-annotation-highlight[data-navigation-flash=\"true\"]").count()).toBeGreaterThan(0);

    await frame.locator("#thorium-pdf-annotation-clear").click();

    await expect.poll(async () => frame.evaluate(() => {
        return window.__thoriumPdfAnnotationHarness?.annotations().length ?? -1;
    })).toBe(0);
    await expect(highlights).toHaveCount(0);
});
