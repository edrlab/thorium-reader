import { expect, test } from "@jest/globals";
import { JSDOM } from "jsdom";

import type { ITtsLookAheadSnapshot } from "@r2-navigator-js/electron/common/tts-lookahead";
import type { ITtsQueueItem } from "@r2-navigator-js/electron/renderer/common/dom-text-utils";
import {
    TtsLookAheadListenerRegistry,
    TtsLookAheadRendererCoordinator,
} from "@r2-navigator-js/electron/renderer/common/tts-lookahead-listener";
import { buildTtsLookAheadSnapshot } from "@r2-navigator-js/electron/renderer/common/tts-lookahead";

function queueItem(element: Element, text: string, sentences?: string[]): ITtsQueueItem {
    return {
        combinedText: text,
        combinedTextSentences: sentences,
        combinedTextSentencesRangeBegin: sentences?.map(() => 0),
        combinedTextSentencesRangeEnd: sentences?.map((sentence) => sentence.length),
        dir: undefined,
        lang: undefined,
        parentElement: element,
        textNodes: [],
    };
}

function snapshotWithBlock(generation: number, revision: number): ITtsLookAheadSnapshot {
    return {
        currentSequence: 0,
        generation,
        revision,
        source: { rate: 1 },
        units: [
            {
                block: { htmlTag: "p", id: `${generation}:0`, kind: "paragraph" },
                boundaryAfter: "document",
                boundaryBefore: "document",
                position: { firstInBlock: true, indexInBlock: 0, lastInBlock: true },
                sequence: 0,
                text: "Spoken text",
            },
        ],
    };
}

test("builds a bounded semantic queue with symmetric boundaries", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    try {
        const doc = dom.window.document;
        const heading = doc.createElement("h2");
        const paragraph = doc.createElement("p");
        const listItem = doc.createElement("li");
        const queue = [
            queueItem(heading, "Chapter heading"),
            queueItem(paragraph, "Opening paragraph"),
            queueItem(listItem, "First list item"),
            ...Array.from({ length: 11 }, (_, index) => {
                const element = doc.createElement("p");
                return queueItem(element, `Paragraph ${index + 2}`);
            }),
        ];

        const snapshot = buildTtsLookAheadSnapshot(queue, 0, { generation: 7, revision: 3 }, { rate: 1 });

        expect(snapshot).toBeDefined();
        expect(snapshot?.units).toHaveLength(12);
        expect(snapshot?.units.slice(0, 3).map((unit) => unit.block.kind)).toEqual([
            "heading",
            "paragraph",
            "list-item",
        ]);
        for (let index = 0; index < (snapshot?.units.length || 0) - 1; index++) {
            expect(snapshot?.units[index].boundaryAfter).toBe(snapshot?.units[index + 1].boundaryBefore);
        }
    } finally {
        dom.window.close();
    }
});

test("assigns dense stable sequences when sentence fragments are empty", () => {
    const dom = new JSDOM("<!doctype html><html><body><p></p></body></html>");
    try {
        const paragraph = dom.window.document.querySelector("p") as Element;
        const snapshot = buildTtsLookAheadSnapshot(
            [queueItem(paragraph, "Spoken one. Spoken two.", ["", "Spoken one.", "", "Spoken two."])],
            0,
            { generation: 4, revision: 1 },
            { rate: 1 },
        );

        expect(snapshot?.units.map((unit) => ({ sequence: unit.sequence, text: unit.text }))).toEqual([
            { sequence: 0, text: "Spoken one." },
            { sequence: 1, text: "Spoken two." },
        ]);
    } finally {
        dom.window.close();
    }
});

test("delivers a canonical snapshot to a registered listener", () => {
    const registry = new TtsLookAheadListenerRegistry();
    const received: ITtsLookAheadSnapshot[] = [];
    registry.listen((snapshot) => received.push(snapshot));

    const snapshot = snapshotWithBlock(2, 5);
    registry.handle(snapshot);

    expect(received).toEqual([snapshot]);
});

test("filters stale webviews and gives each origin a renderer-scoped block namespace", () => {
    const registry = new TtsLookAheadListenerRegistry();
    const coordinator = new TtsLookAheadRendererCoordinator<string>(registry);
    const received: ITtsLookAheadSnapshot[] = [];
    registry.listen((snapshot) => received.push(snapshot));

    expect(coordinator.handle("webview-a", "webview-b", snapshotWithBlock(9, 1))).toBe(false);
    expect(coordinator.handle("webview-a", "webview-a", snapshotWithBlock(9, 1))).toBe(true);
    expect(coordinator.handle("webview-b", "webview-b", snapshotWithBlock(3, 1))).toBe(true);

    expect(
        received.map((snapshot) => ({
            blockId: snapshot.units[0].block.id,
            generation: snapshot.generation,
        })),
    ).toEqual([
        { blockId: "0:0", generation: 0 },
        { blockId: "1:0", generation: 1 },
    ]);
});
