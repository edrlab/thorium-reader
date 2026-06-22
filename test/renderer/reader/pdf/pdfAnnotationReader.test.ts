import { expect, test } from "@jest/globals";

import {
    buildPdfAnnotationDraftEditorTransport,
    getPdfAnnotationCreatePresentation,
    getPdfAnnotationVisibilityPayload,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationReader";
import type { TPdfAnnotationDraftTransport } from "readium-desktop/renderer/reader/pdf/common/pdfAnnotation.type";

const color = {
    red: 10,
    green: 20,
    blue: 30,
};

function createDraft(): TPdfAnnotationDraftTransport {
    return {
        type: "pdf-text-highlight",
        page: 4,
        rects: [{ x1: 1, y1: 2, x2: 3, y2: 4 }],
        quote: "selected text",
    };
}

test("PDF create presentation opens the draft editor for non-quick explicit or instant creation", () => {
    expect(
        getPdfAnnotationCreatePresentation(
            {
                draft: createDraft(),
                source: "highlight:create-from-selection",
            },
            {
                annotationPopoverNotOpenOnNoteTaking: false,
                skipNextEditor: false,
            },
        ),
    ).toBe("draft-editor");

    expect(
        getPdfAnnotationCreatePresentation(
            {
                draft: createDraft(),
                source: "instant-selection",
            },
            {
                annotationPopoverNotOpenOnNoteTaking: false,
                skipNextEditor: false,
            },
        ),
    ).toBe("draft-editor");
});

test("PDF create presentation keeps quick creation separate from instant mode", () => {
    expect(
        getPdfAnnotationCreatePresentation(
            {
                draft: createDraft(),
                source: "instant-selection",
            },
            {
                annotationPopoverNotOpenOnNoteTaking: true,
                skipNextEditor: false,
            },
        ),
    ).toBe("persist-immediately");

    expect(
        getPdfAnnotationCreatePresentation(
            {
                draft: createDraft(),
                source: "highlight:create-from-selection",
            },
            {
                annotationPopoverNotOpenOnNoteTaking: true,
                skipNextEditor: false,
            },
        ),
    ).toBe("persist-immediately");

    expect(
        getPdfAnnotationCreatePresentation(
            {
                draft: createDraft(),
                source: "instant-selection",
            },
            {
                annotationPopoverNotOpenOnNoteTaking: false,
                skipNextEditor: true,
            },
        ),
    ).toBe("persist-immediately");

    expect(
        getPdfAnnotationCreatePresentation(
            {
                draft: createDraft(),
                source: "highlight:create-from-selection",
            },
            {
                annotationPopoverNotOpenOnNoteTaking: false,
                skipNextEditor: true,
            },
        ),
    ).toBe("persist-immediately");

    expect(
        getPdfAnnotationCreatePresentation(
            {
                draft: createDraft(),
                source: "unknown-source" as any,
            },
            {
                annotationPopoverNotOpenOnNoteTaking: false,
                skipNextEditor: false,
            },
        ),
    ).toBe("persist-immediately");
});

test("PDF draft editor transport validates source and defensively copies the target", () => {
    const draft = createDraft();
    const result = buildPdfAnnotationDraftEditorTransport(
        {
            draft,
            source: "highlight:create-from-selection",
        },
        {
            color,
            noteTotalCount: 0,
            created: 1234,
        },
    );

    expect(result).toEqual(draft);
    expect(result).not.toBe(draft);
    expect(result?.rects).not.toBe(draft.rects);
    expect(result?.rects[0]).not.toBe(draft.rects[0]);

    draft.rects[0].x1 = 999;
    expect(result?.rects[0].x1).toBe(1);

    expect(
        buildPdfAnnotationDraftEditorTransport(
            {
                draft: createDraft(),
                source: "instant-selection",
            },
            {
                color,
                noteTotalCount: 0,
                created: 1234,
            },
        ),
    ).toEqual(createDraft());
});

test("PDF draft editor transport rejects invalid runtime sources before opening the header editor", () => {
    const draft = createDraft();

    expect(
        buildPdfAnnotationDraftEditorTransport(
            {
                draft,
                source: "unknown-source" as any,
            },
            {
                color,
                noteTotalCount: 0,
                created: 1234,
            },
        ),
    ).toBeUndefined();
});

test("PDF visibility payload maps hide to overlay visibility only", () => {
    expect(getPdfAnnotationVisibilityPayload("hide")).toEqual({
        visible: false,
    });
    expect(getPdfAnnotationVisibilityPayload("annotation")).toEqual({
        visible: true,
    });
    expect(getPdfAnnotationVisibilityPayload("margin")).toEqual({
        visible: true,
    });
});
