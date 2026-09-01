import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("electron", () => ({
    app: {
        getPath: () => path.join(os.tmpdir(), "thorium-measurement-protocol-default"),
    },
}));

jest.mock("readium-desktop/main/network/http", () => ({
    httpPost: async () => ({
        isSuccess: true,
        statusCode: 204,
        statusMessage: "No Content",
    }),
}));

import { IAnalyticsLogEventResult } from "readium-desktop/common/api/interface/analyticsApi.interface";
import {
    buildMeasurementProtocolQueueBatch,
    IMeasurementProtocolQueueBatch,
    IMeasurementProtocolQueueBody,
    IQueuedMeasurementProtocolEvent,
    MeasurementProtocolEventQueue,
    parseMeasurementProtocolQueueFile,
} from "readium-desktop/main/analytics/measurementProtocolQueue";

const successResult = {
    sent: true,
    isSuccess: true,
    statusCode: 204,
};

const makeBody = (
    name: string,
    params: Record<string, string | number | boolean> = {},
    overrides: Partial<IMeasurementProtocolQueueBody> = {},
): IMeasurementProtocolQueueBody => ({
    client_id: "123.456",
    user_properties: {
        app_version: {
            value: "3.5.1",
        },
    },
    device: {
        category: "desktop",
        model: "Desktop",
    },
    events: [{
        name,
        ...(Object.keys(params).length ? { params } : {}),
    }],
    ...overrides,
});

const makeEvent = (
    name: string,
    overrides: Partial<IQueuedMeasurementProtocolEvent> = {},
): IQueuedMeasurementProtocolEvent => ({
    id: name,
    debugMode: false,
    queuedAtMicros: 1000,
    bodyRoot: {
        client_id: "123.456",
        user_properties: {
            app_version: {
                value: "3.5.1",
            },
        },
    },
    event: {
        name,
        timestamp_micros: 2000,
    },
    ...overrides,
});

const readQueueFile = async (queueFilePath: string): Promise<IQueuedMeasurementProtocolEvent[]> => {

    const raw = await fs.promises.readFile(queueFilePath, { encoding: "utf8" });
    return JSON.parse(raw).events;
};

describe("MeasurementProtocolEventQueue", () => {

    let rootPath: string;
    let queueFilePath: string;
    let idCounter: number;

    const createQueue = (
        sendBatch: (batch: IMeasurementProtocolQueueBatch) => Promise<IAnalyticsLogEventResult> =
            async () => successResult,
        batchSize = 25,
    ) => new MeasurementProtocolEventQueue({
        queueFilePath,
        sendBatch,
        createId: () => `id-${++idCounter}`,
        nowMicros: () => 123456789,
        batchSize,
        flushIntervalMs: 0,
    });

    beforeEach(async () => {
        rootPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), "thorium-measurement-protocol-"));
        queueFilePath = path.join(rootPath, "analytics", "measurement-protocol-queue.json");
        idCounter = 0;
    });

    afterEach(async () => {
        await fs.promises.rm(rootPath, { force: true, recursive: true });
    });

    it("persists queued events and flushes them after reload", async () => {

        const queue = createQueue();
        await queue.enqueue({
            debugMode: false,
            body: makeBody("app_start"),
        });

        expect((await readQueueFile(queueFilePath)).map((event) => event.event.name)).toEqual(["app_start"]);

        const sentBatches: string[][] = [];
        const reloadedQueue = createQueue(async (batch) => {
            sentBatches.push(batch.events.map((event) => event.event.name));
            return successResult;
        });

        await reloadedQueue.start();
        await reloadedQueue.flush();

        expect(sentBatches).toEqual([["app_start"]]);
        expect(await readQueueFile(queueFilePath)).toEqual([]);
    });

    it("keeps queued events on disk when delivery fails", async () => {

        const queue = createQueue(async () => ({
            sent: false,
            isSuccess: false,
            reason: "network-error",
        }));

        await queue.enqueue({
            debugMode: false,
            body: makeBody("reader_search"),
        });

        const result = await queue.flush();

        expect(result).toEqual({
            sent: false,
            isSuccess: false,
            reason: "network-error",
        });
        expect((await readQueueFile(queueFilePath)).map((event) => event.event.name)).toEqual(["reader_search"]);
    });

    it("flushes when the configured batch size is reached", async () => {

        const sentBatches: string[][] = [];
        const queue = createQueue(async (batch) => {
            sentBatches.push(batch.events.map((event) => event.event.name));
            return successResult;
        }, 2);

        await queue.enqueue({
            debugMode: false,
            body: makeBody("event_one"),
        });
        expect(sentBatches).toEqual([]);

        await queue.enqueue({
            debugMode: false,
            body: makeBody("event_two"),
        });
        await queue.flush();

        expect(sentBatches).toEqual([["event_one", "event_two"]]);
        expect(await readQueueFile(queueFilePath)).toEqual([]);
    });
});

describe("buildMeasurementProtocolQueueBatch", () => {

    it("limits a batch to the GA4 maximum of 25 events", () => {

        const events = Array.from({ length: 30 }, (_unused, index) => makeEvent(`event_${index}`));
        const batch = buildMeasurementProtocolQueueBatch(events);

        expect(batch?.events).toHaveLength(25);
        expect(batch?.events[0].event.name).toBe("event_0");
        expect(batch?.events[24].event.name).toBe("event_24");
        expect(batch?.isOversized).toBe(false);
    });

    it("does not batch across root request metadata changes", () => {

        const batch = buildMeasurementProtocolQueueBatch([
            makeEvent("event_one"),
            makeEvent("event_two", { bodyRoot: { client_id: "999.888" } }),
            makeEvent("event_three"),
        ]);

        expect(batch?.events.map((event) => event.event.name)).toEqual(["event_one"]);
    });

    it("keeps the serialized POST body below the configured byte limit", () => {

        const firstEvent = makeEvent("event_one", { event: { name: "event_one", timestamp_micros: 2000, params: { padding: "x".repeat(30) } } });
        const secondEvent = makeEvent("event_two", { event: { name: "event_two", timestamp_micros: 2000, params: { padding: "y".repeat(30) } } });
        const firstEventBytes = Buffer.byteLength(JSON.stringify({
            ...firstEvent.bodyRoot,
            events: [firstEvent.event],
        }), "utf8");
        const twoEventBytes = Buffer.byteLength(JSON.stringify({
            ...firstEvent.bodyRoot,
            events: [firstEvent.event, secondEvent.event],
        }), "utf8");

        const batch = buildMeasurementProtocolQueueBatch(
            [firstEvent, secondEvent],
            25,
            twoEventBytes,
        );

        expect(firstEventBytes).toBeLessThan(twoEventBytes);
        expect(batch?.events.map((event) => event.event.name)).toEqual(["event_one"]);
        expect(batch?.bodyBytes).toBe(firstEventBytes);
        expect(batch?.bodyBytes).toBeLessThan(twoEventBytes);
    });

    it("marks a single event as oversized when it cannot fit under the byte limit", () => {

        const event = makeEvent("event_one", { event: { name: "event_one", timestamp_micros: 2000, params: { padding: "x".repeat(200) } } });
        const eventBytes = Buffer.byteLength(JSON.stringify({
            ...event.bodyRoot,
            events: [event.event],
        }), "utf8");

        const batch = buildMeasurementProtocolQueueBatch([event], 25, eventBytes);

        expect(batch?.events.map((queuedEvent) => queuedEvent.event.name)).toEqual(["event_one"]);
        expect(batch?.bodyBytes).toBe(eventBytes);
        expect(batch?.isOversized).toBe(true);
    });

    it("sanitizes persisted queue data on load", () => {

        const parsed = parseMeasurementProtocolQueueFile(JSON.stringify({
            version: 1,
            events: [
                {
                    id: "event_one",
                    debugMode: false,
                    queuedAtMicros: 1000,
                    bodyRoot: {
                        client_id: "123.456",
                    },
                    event: {
                        name: "event_one",
                        timestamp_micros: 2000,
                        params: { ok: true, bad: { nested: true } },
                    },
                },
                {
                    id: "bad-event",
                    debugMode: false,
                    queuedAtMicros: 1000,
                    bodyRoot: {
                        client_id: "123.456",
                    },
                    event: {
                        name: "",
                    },
                },
            ],
        }));

        expect(parsed).toEqual([
            makeEvent("event_one", {
                bodyRoot: {
                    client_id: "123.456",
                },
                event: {
                    name: "event_one",
                    timestamp_micros: 2000,
                    params: { ok: true },
                },
            }),
        ]);
    });
});
