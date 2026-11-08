import { expect, test } from "@jest/globals";
import { JSDOM } from "jsdom";

import type { ITtsLookAheadSnapshot } from "@r2-navigator-js/electron/common/tts-lookahead";
import type { ITtsQueueItem } from "@r2-navigator-js/electron/renderer/common/dom-text-utils";
// The renderer entrypoint captures global.window and Electron webview state at module evaluation,
// so its public contract is imported type-only and exercised through the pure listener registry below.
import type {
    ITtsLookAheadSnapshot as PublicTtsLookAheadSnapshot,
    ttsLookAheadListen,
} from "@r2-navigator-js/electron/renderer/readaloud";
import {
    TtsLookAheadListenerRegistry,
    TtsLookAheadRendererCoordinator,
} from "@r2-navigator-js/electron/renderer/common/tts-lookahead-listener";
import {
    TtsLookAheadLifecycle,
    scheduleTtsLookAheadNavigation,
    startTtsWithLookAhead,
    type ITtsLookAheadNavigationOptions,
    type TtsLookAheadNavigationKind,
} from "@r2-navigator-js/electron/renderer/common/tts-lookahead";

test("establishes playback before publishing look-ahead and scheduling speech", () => {
    const events: string[] = [];
    let scheduledSpeech: (() => void) | undefined;

    startTtsWithLookAhead(
        () => events.push("playing"),
        () => events.push("lookahead"),
        () => {
            events.push("scheduled");
            scheduledSpeech = () => events.push("speak");
        },
    );

    expect(events).toEqual(["playing", "lookahead", "scheduled"]);
    expect(scheduledSpeech).toBeDefined();

    scheduledSpeech?.();

    expect(events).toEqual(["playing", "lookahead", "scheduled", "speak"]);
});

test("schedules speech when marking playback throws", () => {
    let scheduled = false;

    expect(() =>
        startTtsWithLookAhead(
            () => {
                throw new Error("mark failed");
            },
            () => undefined,
            () => {
                scheduled = true;
            },
        ),
    ).toThrow("mark failed");
    expect(scheduled).toBe(true);
});

test("schedules speech when publishing look-ahead throws", () => {
    let scheduled = false;

    expect(() =>
        startTtsWithLookAhead(
            () => undefined,
            () => {
                throw new Error("snapshot failed");
            },
            () => {
                scheduled = true;
            },
        ),
    ).toThrow("snapshot failed");
    expect(scheduled).toBe(true);
});

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

function snapshotWithTwoBlocks(): ITtsLookAheadSnapshot {
    return {
        currentSequence: 0,
        generation: 2,
        revision: 5,
        source: { rate: 1 },
        units: [
            {
                block: { htmlTag: "p", id: "2:0", kind: "paragraph" },
                boundaryAfter: "paragraph",
                boundaryBefore: "document",
                position: { firstInBlock: true, indexInBlock: 0, lastInBlock: true },
                sequence: 0,
                text: "First block",
            },
            {
                block: { htmlTag: "p", id: "2:1", kind: "paragraph" },
                boundaryAfter: "document",
                boundaryBefore: "paragraph",
                position: { firstInBlock: true, indexInBlock: 0, lastInBlock: true },
                sequence: 1,
                text: "Second block",
            },
        ],
    };
}

function cloneSnapshot(snapshot: ITtsLookAheadSnapshot): ITtsLookAheadSnapshot {
    return JSON.parse(JSON.stringify(snapshot)) as ITtsLookAheadSnapshot;
}

test("builds a bounded semantic queue with exact prioritized symmetric boundaries", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
        <ul>
            <li><h2><span id="heading">Chapter heading</span></h2></li>
            <li><p><span id="paragraph-in-list">Opening paragraph</span></p></li>
            <li><span id="list-item">First list item</span></li>
        </ul>
        <p><span id="paragraph-one">Paragraph one</span></p>
        <p><span id="paragraph-two">Paragraph two</span></p>
    </body></html>`);
    try {
        const doc = dom.window.document;
        const queue = [
            queueItem(doc.querySelector("#heading") as Element, "Chapter heading"),
            queueItem(doc.querySelector("#paragraph-in-list") as Element, "Opening paragraph"),
            queueItem(doc.querySelector("#list-item") as Element, "First list item"),
            queueItem(doc.querySelector("#paragraph-one") as Element, "Paragraph one"),
            queueItem(doc.querySelector("#paragraph-two") as Element, "Paragraph two"),
            ...Array.from({ length: 9 }, (_, index) => {
                const element = doc.createElement("p");
                return queueItem(element, `Additional paragraph ${index + 1}`);
            }),
        ];

        const lifecycle = new TtsLookAheadLifecycle();
        lifecycle.setEnabled(true);
        lifecycle.rebuildQueue(queue);
        const source = { rate: 1 };
        const snapshot = lifecycle.buildSnapshot(queue, 0, { generation: 7, revision: 3 }, source);

        expect(snapshot).toBeDefined();
        expect(snapshot?.units).toHaveLength(12);
        expect(snapshot?.units.slice(0, 5).map((unit) => unit.block.kind)).toEqual([
            "heading",
            "paragraph",
            "list-item",
            "paragraph",
            "paragraph",
        ]);
        expect(snapshot?.units.slice(0, 5).map((unit) => unit.boundaryBefore)).toEqual([
            "document",
            "heading-to-body",
            "list-item",
            "list-item",
            "paragraph",
        ]);
        expect(snapshot?.units.slice(0, 5).map((unit) => unit.boundaryAfter)).toEqual([
            "heading-to-body",
            "list-item",
            "list-item",
            "paragraph",
            "paragraph",
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
        const queue = [queueItem(paragraph, "Spoken one. Spoken two.", ["", "Spoken one.", "", "Spoken two."])];
        const lifecycle = new TtsLookAheadLifecycle();
        lifecycle.setEnabled(true);
        lifecycle.rebuildQueue(queue);
        const snapshot = lifecycle.buildSnapshot(queue, 0, { generation: 4, revision: 1 }, { rate: 1 });

        expect(
            snapshot?.units.map((unit) => ({
                position: unit.position,
                sequence: unit.sequence,
                text: unit.text,
            })),
        ).toEqual([
            {
                position: { firstInBlock: true, indexInBlock: 0, lastInBlock: false },
                sequence: 0,
                text: "Spoken one.",
            },
            {
                position: { firstInBlock: false, indexInBlock: 1, lastInBlock: true },
                sequence: 1,
                text: "Spoken two.",
            },
        ]);
    } finally {
        dom.window.close();
    }
});

test("indexes the spoken queue once per generation", () => {
    const dom = new JSDOM("<!doctype html><html><body><p>One. Two.</p></body></html>");
    try {
        const item = queueItem(dom.window.document.querySelector("p") as Element, "One. Two.", ["One.", "Two."]);
        let queueItemReads = 0;
        const queue = new Proxy([item], {
            get: (target, property, receiver) => {
                if (property === "0") {
                    queueItemReads++;
                }
                return Reflect.get(target, property, receiver);
            },
        });
        const lifecycle = new TtsLookAheadLifecycle();
        lifecycle.setEnabled(true);
        const source = { rate: 1 };

        lifecycle.rebuildQueue(queue);
        const first = lifecycle.createEmissionToken(source);
        lifecycle.buildSnapshot(queue, 0, first, source);
        lifecycle.buildSnapshot(queue, 1, first, source);

        expect(queueItemReads).toBe(1);

        lifecycle.invalidate();
        const second = lifecycle.createEmissionToken(source);
        lifecycle.buildSnapshot(queue, 0, second, source);
        lifecycle.buildSnapshot(queue, 1, second, source);

        expect(queueItemReads).toBe(2);
    } finally {
        dom.window.close();
    }
});

test("does not index or build snapshots while look-ahead is disabled", () => {
    const dom = new JSDOM("<!doctype html><html><body><p>Queued sentence.</p></body></html>");
    try {
        const item = queueItem(dom.window.document.querySelector("p") as Element, "Queued sentence.");
        let queueItemReads = 0;
        const queue = new Proxy([item], {
            get: (target, property, receiver) => {
                if (property === "0") {
                    queueItemReads++;
                }
                return Reflect.get(target, property, receiver);
            },
        });
        const lifecycle = new TtsLookAheadLifecycle();
        const source = { rate: 1 };

        lifecycle.rebuildQueue(queue);
        const token = lifecycle.createEmissionToken(source);
        expect(lifecycle.buildSnapshot(queue, 0, token, source)).toBeUndefined();
        expect(queueItemReads).toBe(0);

        lifecycle.setEnabled(true);
        expect(lifecycle.buildSnapshot(queue, 0, token, source)).toBeDefined();
        expect(queueItemReads).toBe(1);

        lifecycle.setEnabled(false);
        expect(lifecycle.buildSnapshot(queue, 0, token, source)).toBeUndefined();
        expect(queueItemReads).toBe(1);
    } finally {
        dom.window.close();
    }
});

test.each<[string, TtsLookAheadNavigationKind, ITtsLookAheadNavigationOptions, number]>([
    ["automatic advancement", "automatic", {}, 0],
    ["ordinary next", "next", {}, 0],
    ["escaped next", "next", { escape: true }, 1],
    ["sentence-skipping next", "next", { skipSentences: true }, 1],
    ["previous", "previous", {}, 1],
    ["slider", "slider", {}, 1],
    ["jump", "jump", {}, 1],
])("updates generation for %s navigation", (_label, kind, options, expectedGeneration) => {
    const lifecycle = new TtsLookAheadLifecycle();
    lifecycle.rebuildQueue();
    let scheduled = false;

    scheduleTtsLookAheadNavigation(lifecycle, kind, options, () => {
        scheduled = true;
    });

    expect(scheduled).toBe(true);
    expect(lifecycle.state).toEqual({ generation: expectedGeneration, revision: 0 });
});

test("delivers a canonical snapshot to a registered listener", () => {
    const registry = new TtsLookAheadListenerRegistry();
    const received: ITtsLookAheadSnapshot[] = [];
    registry.listen((snapshot) => received.push(snapshot));

    const snapshot = snapshotWithBlock(2, 5);
    registry.handle(snapshot);

    expect(received).toEqual([snapshot]);
});

test.each([
    [
        "sequence gap",
        (snapshot: ITtsLookAheadSnapshot) => {
            snapshot.units[1].sequence = 2;
        },
    ],
    [
        "asymmetric boundary",
        (snapshot: ITtsLookAheadSnapshot) => {
            snapshot.units[1].boundaryBefore = "sentence";
        },
    ],
    [
        "blank text",
        (snapshot: ITtsLookAheadSnapshot) => {
            snapshot.units[0].text = " ";
        },
    ],
])("rejects a snapshot with a %s", (_label, mutate) => {
    const registry = new TtsLookAheadListenerRegistry();
    const received: ITtsLookAheadSnapshot[] = [];
    registry.listen((snapshot) => received.push(snapshot));
    const malformed = cloneSnapshot(snapshotWithTwoBlocks());
    mutate(malformed);

    registry.handle(malformed);

    expect(received).toEqual([]);
});

test("exports the public renderer listener contract without loading Electron runtime side effects", () => {
    const registry = new TtsLookAheadListenerRegistry();
    const listen: typeof ttsLookAheadListen = registry.listen.bind(registry);
    const received: PublicTtsLookAheadSnapshot[] = [];
    listen((snapshot) => received.push(snapshot));

    const snapshot: PublicTtsLookAheadSnapshot = snapshotWithBlock(6, 2);
    registry.handle(snapshot);

    expect(received).toEqual([snapshot]);
});

test("filters stale webviews and assigns monotonic renderer generations and revisions", () => {
    const registry = new TtsLookAheadListenerRegistry();
    const coordinator = new TtsLookAheadRendererCoordinator<string>(registry);
    const received: ITtsLookAheadSnapshot[] = [];
    registry.listen((snapshot) => received.push(snapshot));

    expect(coordinator.handle("webview-a", "webview-b", snapshotWithBlock(9, 1))).toBe(false);
    expect(coordinator.handle("webview-a", "webview-a", snapshotWithBlock(9, 1))).toBe(true);
    expect(coordinator.handle("webview-a", "webview-a", snapshotWithBlock(9, 8))).toBe(true);
    expect(coordinator.handle("webview-a", "webview-a", snapshotWithBlock(10, 0))).toBe(true);
    expect(coordinator.handle("webview-b", "webview-b", snapshotWithBlock(3, 1))).toBe(true);

    expect(
        received.map((snapshot) => ({
            blockId: snapshot.units[0].block.id,
            generation: snapshot.generation,
            revision: snapshot.revision,
        })),
    ).toEqual([
        { blockId: "0:0", generation: 0, revision: 0 },
        { blockId: "0:0", generation: 0, revision: 1 },
        { blockId: "1:0", generation: 1, revision: 0 },
        { blockId: "2:0", generation: 2, revision: 0 },
    ]);
});
