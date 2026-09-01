// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "node:fs";
import * as path from "node:path";

import {
    IAnalyticsLogEventResult,
    TAnalyticsEventParams,
} from "readium-desktop/common/api/interface/analyticsApi.interface";
import { USER_DATA_FOLDER } from "readium-desktop/common/constant";
import isURL from "readium-desktop/common/utils/isURL";
import { httpPost } from "readium-desktop/main/network/http";
import { uuidv4 } from "readium-desktop/utils/uuid";
import { IMeasurementProtocolBody, IMeasurementProtocolEvent } from "./measurementProtocol";

const debug = debug_("readium-desktop:main:analytics:measurement-protocol-queue");

export const GA4_MEASUREMENT_PROTOCOL_MAX_EVENTS_PER_REQUEST = 25;
export const GA4_MEASUREMENT_PROTOCOL_MAX_POST_BODY_BYTES = 130 * 1024;
export const DEFAULT_MEASUREMENT_PROTOCOL_QUEUE_FLUSH_INTERVAL_MS = 60 * 1000;

const MEASUREMENT_PROTOCOL_QUEUE_FILE_VERSION = 1;
const MEASUREMENT_PROTOCOL_QUEUE_FILE_PATH = path.join(
    USER_DATA_FOLDER,
    "analytics",
    "measurement-protocol-queue.json",
);

export interface IQueuedMeasurementProtocolEvent {
    id: string;
    debugMode: boolean;
    queuedAtMicros: number;
    bodyRoot: Record<string, unknown> & { client_id: string };
    event: IMeasurementProtocolEvent;
}

export interface IMeasurementProtocolQueueBatch {
    events: IQueuedMeasurementProtocolEvent[];
    bodyJson: string;
    bodyBytes: number;
    isOversized: boolean;
}

export interface IMeasurementProtocolQueueRequest {
    debugMode: boolean;
    body: IMeasurementProtocolBody;
}

export interface IMeasurementProtocolEventQueueDependencies {
    queueFilePath: string;
    sendBatch?: (batch: IMeasurementProtocolQueueBatch) => Promise<IAnalyticsLogEventResult>;
    createId?: () => string;
    nowMicros?: () => number;
    batchSize?: number;
    maxBodyBytes?: number;
    flushIntervalMs?: number;
}

interface IMeasurementProtocolQueueFile {
    version: typeof MEASUREMENT_PROTOCOL_QUEUE_FILE_VERSION;
    events: IQueuedMeasurementProtocolEvent[];
}

const successfulUnsentResult = (): IAnalyticsLogEventResult => ({
    sent: false,
    isSuccess: true,
});

const failureResult = (
    reason: IAnalyticsLogEventResult["reason"],
    statusCode?: number,
    statusMessage?: string,
): IAnalyticsLogEventResult => ({
    sent: false,
    isSuccess: false,
    reason,
    ...(typeof statusCode === "number" ? { statusCode } : {}),
    ...(statusMessage ? { statusMessage } : {}),
});

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const sanitizeAnalyticsParams = (params: unknown): TAnalyticsEventParams | undefined => {

    if (!params || typeof params !== "object" || Array.isArray(params)) {
        return undefined;
    }

    const eventParams: TAnalyticsEventParams = {};

    for (const [key, value] of Object.entries(params)) {
        if (
            typeof value === "string" ||
            typeof value === "boolean" ||
            isFiniteNumber(value)
        ) {
            eventParams[key] = value;
        }
    }

    return Object.keys(eventParams).length ? eventParams : undefined;
};

const sanitizeMeasurementProtocolQueueEvent = (
    event: unknown,
): IMeasurementProtocolEvent | undefined => {

    if (!event || typeof event !== "object" || Array.isArray(event)) {
        return undefined;
    }

    const candidate = event as Partial<IMeasurementProtocolEvent>;
    if (
        typeof candidate.name !== "string" ||
        !candidate.name ||
        candidate.name.length > 40
    ) {
        return undefined;
    }

    const params = sanitizeAnalyticsParams(candidate.params);
    const timestampMicros = isFiniteNumber(candidate.timestamp_micros) ?
        candidate.timestamp_micros :
        undefined;

    return {
        name: candidate.name,
        ...(timestampMicros !== undefined ? { timestamp_micros: timestampMicros } : {}),
        ...(params ? { params } : {}),
    };
};

const sanitizeBodyRoot = (
    bodyRoot: unknown,
): IQueuedMeasurementProtocolEvent["bodyRoot"] | undefined => {

    if (!bodyRoot || typeof bodyRoot !== "object" || Array.isArray(bodyRoot)) {
        return undefined;
    }

    const root = { ...(bodyRoot as Record<string, unknown>) };
    delete root.events;
    delete root.timestamp_micros;

    if (typeof root.client_id !== "string" || !root.client_id) {
        return undefined;
    }

    return root as IQueuedMeasurementProtocolEvent["bodyRoot"];
};

const sanitizeQueuedEvent = (event: unknown): IQueuedMeasurementProtocolEvent | undefined => {

    if (!event || typeof event !== "object" || Array.isArray(event)) {
        return undefined;
    }

    const candidate = event as Partial<IQueuedMeasurementProtocolEvent>;
    const bodyRoot = sanitizeBodyRoot(candidate.bodyRoot);
    const measurementEvent = sanitizeMeasurementProtocolQueueEvent(candidate.event);

    if (
        typeof candidate.id !== "string" ||
        !candidate.id ||
        typeof candidate.debugMode !== "boolean" ||
        !isFiniteNumber(candidate.queuedAtMicros) ||
        !bodyRoot ||
        !measurementEvent
    ) {
        return undefined;
    }

    return {
        id: candidate.id,
        debugMode: candidate.debugMode,
        queuedAtMicros: candidate.queuedAtMicros,
        bodyRoot,
        event: measurementEvent,
    };
};

const isQueuedMeasurementProtocolEvent = (
    event: IQueuedMeasurementProtocolEvent | undefined,
): event is IQueuedMeasurementProtocolEvent => !!event;

export const parseMeasurementProtocolQueueFile = (data: string): IQueuedMeasurementProtocolEvent[] => {

    try {
        const parsed = JSON.parse(data) as unknown;
        const rawEvents = Array.isArray(parsed) ?
            parsed :
            (
                parsed &&
                typeof parsed === "object" &&
                Array.isArray((parsed as Partial<IMeasurementProtocolQueueFile>).events)
            ) ?
                (parsed as Partial<IMeasurementProtocolQueueFile>).events :
                [];

        return rawEvents
            .map(sanitizeQueuedEvent)
            .filter(isQueuedMeasurementProtocolEvent);
    } catch (err) {
        debug("Measurement Protocol queue JSON parse failed", err);
        return [];
    }
};

export const getMeasurementProtocolQueuedEventBatchKey = (
    event: IQueuedMeasurementProtocolEvent,
): string => JSON.stringify([
    event.debugMode,
    event.bodyRoot,
]);

const normalizeBatchSize = (batchSize: number | undefined): number => {

    if (!batchSize || !Number.isFinite(batchSize)) {
        return GA4_MEASUREMENT_PROTOCOL_MAX_EVENTS_PER_REQUEST;
    }

    return Math.max(
        1,
        Math.min(
            Math.floor(batchSize),
            GA4_MEASUREMENT_PROTOCOL_MAX_EVENTS_PER_REQUEST,
        ),
    );
};

const buildMeasurementProtocolQueueBodyJson = (
    events: IQueuedMeasurementProtocolEvent[],
): string => JSON.stringify({
    ...events[0].bodyRoot,
    events: events.map((event) => event.event),
});

export const buildMeasurementProtocolQueueBatch = (
    queue: IQueuedMeasurementProtocolEvent[],
    batchSize = GA4_MEASUREMENT_PROTOCOL_MAX_EVENTS_PER_REQUEST,
    maxBodyBytes = GA4_MEASUREMENT_PROTOCOL_MAX_POST_BODY_BYTES,
): IMeasurementProtocolQueueBatch | undefined => {

    if (!queue.length) {
        return undefined;
    }

    const normalizedBatchSize = normalizeBatchSize(batchSize);
    const batchKey = getMeasurementProtocolQueuedEventBatchKey(queue[0]);
    let events: IQueuedMeasurementProtocolEvent[] = [];
    let bodyJson = "";
    let bodyBytes = 0;

    for (const event of queue) {
        if (getMeasurementProtocolQueuedEventBatchKey(event) !== batchKey) {
            break;
        }

        if (events.length >= normalizedBatchSize) {
            break;
        }

        const candidateEvents = [...events, event];
        const candidateBodyJson = buildMeasurementProtocolQueueBodyJson(candidateEvents);
        const candidateBodyBytes = Buffer.byteLength(candidateBodyJson, "utf8");

        if (candidateBodyBytes >= maxBodyBytes) {
            if (!events.length) {
                return {
                    events: candidateEvents,
                    bodyJson: candidateBodyJson,
                    bodyBytes: candidateBodyBytes,
                    isOversized: true,
                };
            }
            break;
        }

        events = candidateEvents;
        bodyJson = candidateBodyJson;
        bodyBytes = candidateBodyBytes;
    }

    if (!events.length) {
        return undefined;
    }

    return {
        events,
        bodyJson,
        bodyBytes,
        isOversized: false,
    };
};

const resolveMeasurementProtocolUrl = (
    debugMode: boolean,
): { href?: string; hrefDebug?: string; result?: IAnalyticsLogEventResult } => {

    if (!__TH__FIREBASE_ENABLED__) {
        debug("Measurement Protocol disabled");
        return {
            result: failureResult("disabled"),
        };
    }

    const apiSecret = __TH__FIREBASE_MEASUREMENT_PROTOCOL_API_SECRET__;
    const endpoint = debugMode
        ? (__TH__FIREBASE_MEASUREMENT_PROTOCOL_DEBUG_ENDPOINT__ || "https://www.google-analytics.com/debug/mp/collect")
        : (__TH__FIREBASE_MEASUREMENT_PROTOCOL_ENDPOINT__ || "https://www.google-analytics.com/mp/collect");

    if (!__TH__FIREBASE_MEASUREMENT_ID__ || !apiSecret) {
        debug("Measurement Protocol missing queue flush config", {
            hasMeasurementId: !!__TH__FIREBASE_MEASUREMENT_ID__,
            hasApiSecret: !!apiSecret,
        });
        return {
            result: failureResult("missing-config"),
        };
    }

    let href: string;
    let hrefDebug = "";
    try {
        const url = new URL(endpoint);
        url.searchParams.set("measurement_id", __TH__FIREBASE_MEASUREMENT_ID__);
        url.searchParams.set("api_secret", apiSecret);

        href = url.toString();
        url.searchParams.set("api_secret", "***");
        hrefDebug = url.toString();
    } catch (err) {
        debug("Measurement Protocol invalid queue endpoint", err);
        return {
            result: failureResult("invalid-url"),
        };
    }

    if (!href || !isURL(href)) {
        debug("Measurement Protocol queue isURL() NOK", hrefDebug || href);
        return {
            result: failureResult("invalid-url"),
        };
    }

    return { href, hrefDebug };
};

const sendMeasurementProtocolBatch = async (
    batch: IMeasurementProtocolQueueBatch,
): Promise<IAnalyticsLogEventResult> => {

    if (!batch.events.length) {
        return successfulUnsentResult();
    }

    const debugMode = batch.events[0].debugMode;
    const { href, hrefDebug, result } = resolveMeasurementProtocolUrl(debugMode);
    if (result) {
        return result;
    }

    try {
        debug("Measurement Protocol queue POST", {
            url: hrefDebug,
            headers: {
                "Content-Type": "application/json",
            },
            eventCount: batch.events.length,
            bodyBytes: batch.bodyBytes,
        });

        const response = await httpPost(href, {
            body: batch.bodyJson,
            headers: {
                "Content-Type": "application/json",
            },
        });

        const logResult: IAnalyticsLogEventResult = {
            sent: response.isSuccess,
            isSuccess: response.isSuccess,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
        };

        debug("Measurement Protocol queue response", logResult);

        if (debugMode && response.statusCode !== 204 && response.response?.json) {
            try {
                const json: any = await response.response.json();
                debug("Measurement Protocol queue debug response body", json);
                if (Array.isArray(json?.validationMessages)) {
                    const validationMessages: NonNullable<IAnalyticsLogEventResult["validationMessages"]> = [];
                    for (const message of json.validationMessages) {
                        validationMessages.push({
                            fieldPath: typeof message?.fieldPath === "string" ? message.fieldPath : undefined,
                            description: typeof message?.description === "string" ? message.description : undefined,
                            validationCode: typeof message?.validationCode === "string" ? message.validationCode : undefined,
                        });
                    }
                    logResult.validationMessages = validationMessages;
                    debug("Measurement Protocol queue validation messages", validationMessages);
                }
            } catch (err) {
                debug("Measurement Protocol queue debug response JSON parse failed", err);
            }
        }

        return logResult;
    } catch (err) {
        debug("Measurement Protocol queue network error", err);
        return failureResult("network-error");
    }
};

const buildQueuedEvent = (
    request: IMeasurementProtocolQueueRequest,
    id: string,
    queuedAtMicros: number,
): IQueuedMeasurementProtocolEvent | undefined => {

    if (!request.body.events.length) {
        return undefined;
    }

    const bodyRootRecord = { ...(request.body as unknown as Record<string, unknown>) };
    delete bodyRootRecord.events;
    delete bodyRootRecord.timestamp_micros;

    const bodyRoot = sanitizeBodyRoot(bodyRootRecord);
    const sourceEvent = request.body.events[0];
    const event = sanitizeMeasurementProtocolQueueEvent({
        ...sourceEvent,
        timestamp_micros: isFiniteNumber(sourceEvent.timestamp_micros) ?
            sourceEvent.timestamp_micros :
            isFiniteNumber(request.body.timestamp_micros) ?
                request.body.timestamp_micros :
                queuedAtMicros,
    });

    if (!bodyRoot || !event) {
        return undefined;
    }

    return {
        id,
        debugMode: request.debugMode,
        queuedAtMicros,
        bodyRoot,
        event,
    };
};

export class MeasurementProtocolEventQueue {

    private queue: IQueuedMeasurementProtocolEvent[] = [];
    private loadPromise: Promise<void> | undefined;
    private loaded = false;
    private operationLock: Promise<void> = Promise.resolve();
    private flushPromise: Promise<IAnalyticsLogEventResult> | undefined;
    private flushInterval: ReturnType<typeof setInterval> | undefined;
    private readonly batchSize: number;
    private readonly maxBodyBytes: number;
    private readonly flushIntervalMs: number;
    private readonly createId: () => string;
    private readonly nowMicros: () => number;
    private readonly sendBatch: (batch: IMeasurementProtocolQueueBatch) => Promise<IAnalyticsLogEventResult>;

    constructor(private readonly dependencies: IMeasurementProtocolEventQueueDependencies) {

        this.batchSize = normalizeBatchSize(dependencies.batchSize);
        this.maxBodyBytes = dependencies.maxBodyBytes || GA4_MEASUREMENT_PROTOCOL_MAX_POST_BODY_BYTES;
        this.flushIntervalMs =
            typeof dependencies.flushIntervalMs === "number" ?
                dependencies.flushIntervalMs :
                DEFAULT_MEASUREMENT_PROTOCOL_QUEUE_FLUSH_INTERVAL_MS;
        this.createId = dependencies.createId || uuidv4;
        this.nowMicros = dependencies.nowMicros || (() => Date.now() * 1000);
        this.sendBatch = dependencies.sendBatch || sendMeasurementProtocolBatch;
    }

    public async start(): Promise<void> {

        await this.ensureLoaded();

        if (!this.flushInterval && this.flushIntervalMs > 0) {
            this.flushInterval = setInterval(() => {
                this.flush().catch((err) => debug("Measurement Protocol timer flush failed", err));
            }, this.flushIntervalMs);

            if (typeof (this.flushInterval as any).unref === "function") {
                (this.flushInterval as any).unref();
            }
        }

        this.flush().catch((err) => debug("Measurement Protocol startup flush failed", err));
    }

    public stop(): void {

        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = undefined;
        }
    }

    public async enqueue(request: IMeasurementProtocolQueueRequest): Promise<IAnalyticsLogEventResult> {

        const queuedEvent = buildQueuedEvent(request, this.createId(), this.nowMicros());
        if (!queuedEvent) {
            return failureResult("invalid-event-name");
        }

        const queueLength = await this.runExclusive(async () => {
            await this.ensureLoaded();
            this.queue.push(queuedEvent);
            await this.persistQueue();
            return this.queue.length;
        });

        if (queueLength >= this.batchSize) {
            this.flush().catch((err) => debug("Measurement Protocol batch-size flush failed", err));
        }

        return successfulUnsentResult();
    }

    public async flush(): Promise<IAnalyticsLogEventResult> {

        if (this.flushPromise) {
            return this.flushPromise;
        }

        this.flushPromise = this.flushInternal()
            .finally(() => {
                this.flushPromise = undefined;
            });

        return this.flushPromise;
    }

    private async flushInternal(): Promise<IAnalyticsLogEventResult> {

        let result = successfulUnsentResult();

        while (true) {
            const batch = await this.runExclusive(async () => {
                await this.ensureLoaded();
                return buildMeasurementProtocolQueueBatch(
                    this.queue,
                    this.batchSize,
                    this.maxBodyBytes,
                );
            });

            if (!batch) {
                return result;
            }

            if (batch.isOversized) {
                debug("Measurement Protocol queue dropping oversized event", {
                    name: batch.events[0]?.event.name,
                    bodyBytes: batch.bodyBytes,
                    maxBodyBytes: this.maxBodyBytes,
                });
                await this.removeEvents(batch.events);
                result = successfulUnsentResult();
                continue;
            }

            debug("Measurement Protocol queue flushing batch", {
                eventCount: batch.events.length,
                bodyBytes: batch.bodyBytes,
            });

            result = await this.sendBatch(batch);

            if (!result.isSuccess) {
                debug("Measurement Protocol queue batch delivery failed", result);
                return result;
            }

            await this.removeEvents(batch.events);
        }
    }

    private async removeEvents(events: IQueuedMeasurementProtocolEvent[]): Promise<void> {

        const eventIds = new Set(events.map((event) => event.id));

        await this.runExclusive(async () => {
            await this.ensureLoaded();

            const previousLength = this.queue.length;
            this.queue = this.queue.filter((event) => !eventIds.has(event.id));

            if (this.queue.length !== previousLength) {
                await this.persistQueue();
            }
        });
    }

    private async ensureLoaded(): Promise<void> {

        if (this.loaded) {
            return;
        }

        if (!this.loadPromise) {
            this.loadPromise = this.loadQueue()
                .finally(() => {
                    this.loadPromise = undefined;
                });
        }

        await this.loadPromise;
    }

    private async loadQueue(): Promise<void> {

        try {
            await fs.promises.mkdir(path.dirname(this.dependencies.queueFilePath), { recursive: true });
        } catch (err) {
            debug("Measurement Protocol queue directory creation failed", err);
        }

        try {
            const data = await fs.promises.readFile(this.dependencies.queueFilePath, { encoding: "utf8" });
            this.queue = parseMeasurementProtocolQueueFile(data);
            debug("Measurement Protocol queue loaded", { eventCount: this.queue.length });
        } catch (err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code !== "ENOENT") {
                debug("Measurement Protocol queue read failed", err);
            }
            this.queue = [];
        }

        this.loaded = true;
    }

    private async persistQueue(): Promise<void> {

        const queueFile: IMeasurementProtocolQueueFile = {
            version: MEASUREMENT_PROTOCOL_QUEUE_FILE_VERSION,
            events: this.queue,
        };
        const data = JSON.stringify(queueFile);
        const tmpFilePath = `${this.dependencies.queueFilePath}.${process.pid}.${Date.now()}.tmp`;

        await fs.promises.mkdir(path.dirname(this.dependencies.queueFilePath), { recursive: true });

        try {
            await fs.promises.writeFile(tmpFilePath, data, { encoding: "utf8", flush: true });
            await fs.promises.rename(tmpFilePath, this.dependencies.queueFilePath);
        } catch (err) {
            try {
                await fs.promises.rm(tmpFilePath, { force: true });
            } catch {
                // ignore cleanup failure
            }
            throw err;
        }
    }

    private runExclusive<T>(operation: () => Promise<T>): Promise<T> {

        const nextOperation = this.operationLock.then(operation, operation);
        this.operationLock = nextOperation.then(
            (): void => undefined,
            (): void => undefined,
        );
        return nextOperation;
    }
}

let measurementProtocolQueue: MeasurementProtocolEventQueue | undefined;

const isMeasurementProtocolQueueEnabled = (): boolean =>
    !!__TH__FIREBASE_ENABLED__ &&
    !!__TH__FIREBASE_MEASUREMENT_ID__ &&
    !!__TH__FIREBASE_MEASUREMENT_PROTOCOL_API_SECRET__;

const getMeasurementProtocolQueue = (): MeasurementProtocolEventQueue => {

    if (!measurementProtocolQueue) {
        measurementProtocolQueue = new MeasurementProtocolEventQueue({
            queueFilePath: MEASUREMENT_PROTOCOL_QUEUE_FILE_PATH,
        });
    }

    return measurementProtocolQueue;
};

export const enqueueMeasurementProtocolRequest = async (
    request: IMeasurementProtocolQueueRequest,
): Promise<IAnalyticsLogEventResult> =>
    getMeasurementProtocolQueue().enqueue(request);

export const startMeasurementProtocolQueue = async (): Promise<void> => {

    if (!isMeasurementProtocolQueueEnabled()) {
        debug("Measurement Protocol queue not started, missing config or disabled");
        return;
    }

    await getMeasurementProtocolQueue().start();
};

export const stopMeasurementProtocolQueue = (): void => {

    if (measurementProtocolQueue) {
        measurementProtocolQueue.stop();
    }
};

export const flushMeasurementProtocolQueue = async (): Promise<IAnalyticsLogEventResult> => {

    if (!__TH__FIREBASE_ENABLED__) {
        return failureResult("disabled");
    }

    if (!isMeasurementProtocolQueueEnabled()) {
        return failureResult("missing-config");
    }

    return getMeasurementProtocolQueue().flush();
};
