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
import type { IMeasurementProtocolBody, IMeasurementProtocolEvent } from "./measurementProtocol";

const debug = debug_("readium-desktop:main:analytics:measurement-protocol-queue");

export const GA4_MEASUREMENT_PROTOCOL_MAX_EVENTS_PER_REQUEST = 25;
export const GA4_MEASUREMENT_PROTOCOL_MAX_POST_BODY_BYTES = 130 * 1024;
export const DEFAULT_MEASUREMENT_PROTOCOL_QUEUE_FLUSH_INTERVAL_MS = 60 * 1000;
export const DEFAULT_MEASUREMENT_PROTOCOL_QUEUE_MAX_EVENTS = 1000;

// GA4 Measurement Protocol rejects events that arrive more than 72 hours late.
export const DEFAULT_MEASUREMENT_PROTOCOL_QUEUE_MAX_EVENT_AGE_MICROS = 72 * 60 * 60 * 1000 * 1000;

const MEASUREMENT_PROTOCOL_QUEUE_FILE_VERSION = 1;
const MEASUREMENT_PROTOCOL_QUEUE_FILE_PATH = path.join(
    USER_DATA_FOLDER,
    "analytics",
    "measurement-protocol-queue.json",
);
// Windows can briefly lock the destination queue file during replace operations.
// Keep the atomic temp-file write path, but retry transient rename failures.
const MEASUREMENT_PROTOCOL_QUEUE_RENAME_RETRY_DELAYS_MS = [25, 100, 250, 500];
const MEASUREMENT_PROTOCOL_QUEUE_TRANSIENT_FS_ERROR_CODES = new Set([
    "EACCES",
    "EBUSY",
    "EPERM",
]);

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
    maxQueuedEvents?: number;
    maxEventAgeMicros?: number;
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

const normalizePositiveInteger = (
    value: number | undefined,
    fallback: number,
): number => {

    if (!value || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(1, Math.floor(value));
};

const getQueuedEventTimestampMicros = (
    event: IQueuedMeasurementProtocolEvent,
): number => isFiniteNumber(event.event.timestamp_micros) ?
    event.event.timestamp_micros :
    event.queuedAtMicros;

const isQueuedEventExpired = (
    event: IQueuedMeasurementProtocolEvent,
    nowMicros: number,
    maxEventAgeMicros: number,
): boolean => nowMicros - getQueuedEventTimestampMicros(event) > maxEventAgeMicros;

const isRetryableMeasurementProtocolFailure = (
    result: IAnalyticsLogEventResult,
): boolean => {

    if (result.reason === "network-error" || result.reason === "missing-config" || result.reason === "disabled") {
        return true;
    }

    if (result.reason === "invalid-url" || result.reason === "invalid-event-name") {
        return false;
    }

    if (typeof result.statusCode !== "number") {
        return true;
    }

    return result.statusCode === 408 || result.statusCode === 429 || result.statusCode >= 500;
};

const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

const getFsErrorCode = (err: unknown): string | undefined => {

    const code = (err as NodeJS.ErrnoException)?.code;
    return typeof code === "string" ? code : undefined;
};

const isTransientQueueReplaceError = (err: unknown): boolean => {

    const code = getFsErrorCode(err);
    return !!code && MEASUREMENT_PROTOCOL_QUEUE_TRANSIENT_FS_ERROR_CODES.has(code);
};

const renameMeasurementProtocolQueueFile = async (
    tmpFilePath: string,
    queueFilePath: string,
): Promise<void> => {

    let attempt = 0;

    while (true) {
        try {
            await fs.promises.rename(tmpFilePath, queueFilePath);

            if (attempt > 0) {
                debug("Measurement Protocol queue rename succeeded after retry", {
                    attempt: attempt + 1,
                    queueFilePath,
                    tmpFilePath,
                });
            }

            return;
        } catch (err) {
            const retryDelayMs = MEASUREMENT_PROTOCOL_QUEUE_RENAME_RETRY_DELAYS_MS[attempt];

            if (!isTransientQueueReplaceError(err) || retryDelayMs === undefined) {
                debug("Measurement Protocol queue rename failed", {
                    attempt: attempt + 1,
                    queueFilePath,
                    tmpFilePath,
                    errorCode: getFsErrorCode(err),
                    willRetry: false,
                    error: err,
                });
                throw err;
            }

            debug("Measurement Protocol queue rename failed, retrying", {
                attempt: attempt + 1,
                queueFilePath,
                tmpFilePath,
                retryDelayMs,
                errorCode: getFsErrorCode(err),
                error: err,
            });

            attempt++;
            await wait(retryDelayMs);
        }
    }
};

const summarizeQueuedEventForDebug = (
    event: IQueuedMeasurementProtocolEvent,
) => ({
    id: event.id,
    name: event.event.name,
    debugMode: event.debugMode,
    queuedAtMicros: event.queuedAtMicros,
    timestampMicros: event.event.timestamp_micros,
    bodyRootKeys: Object.keys(event.bodyRoot).sort(),
    paramKeys: event.event.params ? Object.keys(event.event.params).sort() : [],
});

const summarizeQueueForDebug = (
    queue: IQueuedMeasurementProtocolEvent[],
) => ({
    eventCount: queue.length,
    firstEvent: queue[0] ? summarizeQueuedEventForDebug(queue[0]) : undefined,
    lastEvent: queue.length > 1 ? summarizeQueuedEventForDebug(queue[queue.length - 1]) : undefined,
});

const summarizeRequestForDebug = (
    request: IMeasurementProtocolQueueRequest,
) => {

    const event = request.body.events[0];
    const bodyRoot = { ...(request.body as unknown as Record<string, unknown>) };
    delete bodyRoot.events;
    delete bodyRoot.timestamp_micros;

    return {
        debugMode: request.debugMode,
        eventCount: request.body.events.length,
        firstEventName: event?.name,
        bodyRootKeys: Object.keys(bodyRoot).sort(),
        paramKeys: event?.params ? Object.keys(event.params).sort() : [],
        hasRequestTimestampMicros: isFiniteNumber(request.body.timestamp_micros),
        hasEventTimestampMicros: isFiniteNumber(event?.timestamp_micros),
    };
};

const summarizeBatchForDebug = (
    batch: IMeasurementProtocolQueueBatch,
) => ({
    eventCount: batch.events.length,
    bodyBytes: batch.bodyBytes,
    isOversized: batch.isOversized,
    firstEvent: batch.events[0] ? summarizeQueuedEventForDebug(batch.events[0]) : undefined,
    lastEvent: batch.events.length > 1 ?
        summarizeQueuedEventForDebug(batch.events[batch.events.length - 1]) :
        undefined,
});

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

    // Queue one GA4 event per record so retries and drops stay precise. The
    // request-level timestamp is folded into the event before persistence,
    // because persisted batches reconstruct a fresh root body later.
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
    private readonly maxQueuedEvents: number;
    private readonly maxEventAgeMicros: number;
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
        this.maxQueuedEvents = normalizePositiveInteger(
            dependencies.maxQueuedEvents,
            DEFAULT_MEASUREMENT_PROTOCOL_QUEUE_MAX_EVENTS,
        );
        this.maxEventAgeMicros = normalizePositiveInteger(
            dependencies.maxEventAgeMicros,
            DEFAULT_MEASUREMENT_PROTOCOL_QUEUE_MAX_EVENT_AGE_MICROS,
        );
        this.createId = dependencies.createId || uuidv4;
        this.nowMicros = dependencies.nowMicros || (() => Date.now() * 1000);
        this.sendBatch = dependencies.sendBatch || sendMeasurementProtocolBatch;

        debug("Measurement Protocol queue configured", {
            queueFilePath: dependencies.queueFilePath,
            batchSize: this.batchSize,
            maxBodyBytes: this.maxBodyBytes,
            flushIntervalMs: this.flushIntervalMs,
            maxQueuedEvents: this.maxQueuedEvents,
            maxEventAgeMicros: this.maxEventAgeMicros,
        });
    }

    public async start(): Promise<void> {

        try {
            debug("Measurement Protocol queue start requested", {
                loaded: this.loaded,
                hasFlushInterval: !!this.flushInterval,
                flushIntervalMs: this.flushIntervalMs,
            });

            await this.ensureLoaded();
            debug("Measurement Protocol queue start loaded", summarizeQueueForDebug(this.queue));

            if (!this.flushInterval && this.flushIntervalMs > 0) {
                this.flushInterval = setInterval(() => {
                    debug("Measurement Protocol queue timer flush requested", summarizeQueueForDebug(this.queue));
                    this.flush().catch((err) => debug("Measurement Protocol timer flush failed", err));
                }, this.flushIntervalMs);

                if (typeof (this.flushInterval as any).unref === "function") {
                    (this.flushInterval as any).unref();
                }

                debug("Measurement Protocol queue timer started", {
                    flushIntervalMs: this.flushIntervalMs,
                });
            } else if (this.flushIntervalMs <= 0) {
                debug("Measurement Protocol queue timer disabled", {
                    flushIntervalMs: this.flushIntervalMs,
                });
            } else {
                debug("Measurement Protocol queue timer already running");
            }

            debug("Measurement Protocol queue startup flush requested", summarizeQueueForDebug(this.queue));
            this.flush().catch((err) => debug("Measurement Protocol startup flush failed", err));
        } catch (err) {
            debug("Measurement Protocol queue start failed silently", err);
        }
    }

    public stop(): void {

        try {
            debug("Measurement Protocol queue stop requested", {
                hadFlushInterval: !!this.flushInterval,
            });

            if (this.flushInterval) {
                clearInterval(this.flushInterval);
                this.flushInterval = undefined;
                debug("Measurement Protocol queue timer stopped");
            }
        } catch (err) {
            debug("Measurement Protocol queue stop failed silently", err);
        }
    }

    public async enqueue(request: IMeasurementProtocolQueueRequest): Promise<IAnalyticsLogEventResult> {

        try {
            debug("Measurement Protocol queue enqueue requested", summarizeRequestForDebug(request));

            if (request.debugMode) {
                // Debug validation requests return diagnostics immediately and are not
                // intended to be reported or replayed later from the persistent queue.
                debug("Measurement Protocol queue enqueue bypassing persistence for debug event");
                return this.sendImmediately(request);
            }

            const queuedEvent = buildQueuedEvent(request, this.createId(), this.nowMicros());
            if (!queuedEvent) {
                debug("Measurement Protocol queue enqueue rejected invalid event", summarizeRequestForDebug(request));
                return failureResult("invalid-event-name");
            }

            const queueLength = await this.runExclusive(async () => {
                await this.ensureLoaded();
                this.queue.push(queuedEvent);
                this.dropOldestEventsOverQueueLimit();
                await this.persistQueue();
                debug("Measurement Protocol queue event persisted", {
                    queueLength: this.queue.length,
                    event: summarizeQueuedEventForDebug(queuedEvent),
                });
                return this.queue.length;
            });

            if (queueLength >= this.batchSize) {
                debug("Measurement Protocol queue batch-size threshold reached", {
                    queueLength,
                    batchSize: this.batchSize,
                });
                this.flush().catch((err) => debug("Measurement Protocol batch-size flush failed", err));
            }

            return successfulUnsentResult();
        } catch (err) {
            debug("Measurement Protocol queue enqueue failed silently", err);
            return {
                sent: false,
                isSuccess: false,
                statusMessage: "Measurement Protocol queue enqueue failed silently",
            };
        }
    }

    public async sendImmediately(request: IMeasurementProtocolQueueRequest): Promise<IAnalyticsLogEventResult> {

        try {
            debug("Measurement Protocol immediate send requested", summarizeRequestForDebug(request));

            const queuedEvent = buildQueuedEvent(request, this.createId(), this.nowMicros());
            if (!queuedEvent) {
                debug("Measurement Protocol immediate send rejected invalid event", summarizeRequestForDebug(request));
                return failureResult("invalid-event-name");
            }

            const batch = buildMeasurementProtocolQueueBatch(
                [queuedEvent],
                1,
                this.maxBodyBytes,
            );

            if (!batch || batch.isOversized) {
                debug("Measurement Protocol immediate event dropped before send", {
                    name: queuedEvent.event.name,
                    bodyBytes: batch?.bodyBytes,
                    maxBodyBytes: this.maxBodyBytes,
                });
                return {
                    sent: false,
                    isSuccess: false,
                    statusMessage: "Measurement Protocol event exceeds the maximum POST body size.",
                };
            }

            debug("Measurement Protocol immediate batch sending", summarizeBatchForDebug(batch));
            const result = await this.sendBatch(batch);
            debug("Measurement Protocol immediate batch result", {
                result,
                event: summarizeQueuedEventForDebug(queuedEvent),
            });

            return result;
        } catch (err) {
            debug("Measurement Protocol immediate send failed silently", err);
            return {
                sent: false,
                isSuccess: false,
                statusMessage: "Measurement Protocol immediate send failed silently",
            };
        }
    }

    public async flush(): Promise<IAnalyticsLogEventResult> {

        try {
            if (this.flushPromise !== undefined) {
                // Startup, timer, batch-size, and shutdown flushes can overlap; share
                // the in-flight flush so the queue only mutates in one flush loop.
                debug("Measurement Protocol queue flush joined existing flush");
                return this.flushPromise;
            }

            debug("Measurement Protocol queue flush requested", {
                loaded: this.loaded,
                hasFlushInterval: !!this.flushInterval,
            });

            this.flushPromise = this.flushInternal()
                .then((result) => {
                    debug("Measurement Protocol queue flush completed", result);
                    return result;
                })
                .catch((err) => {
                    debug("Measurement Protocol queue flush failed silently", err);
                    return {
                        sent: false,
                        isSuccess: false,
                        statusMessage: "Measurement Protocol queue flush failed silently",
                    };
                })
                .finally(() => {
                    this.flushPromise = undefined;
                });

            return this.flushPromise;
        } catch (err) {
            debug("Measurement Protocol queue flush failed silently", err);
            return {
                sent: false,
                isSuccess: false,
                statusMessage: "Measurement Protocol queue flush failed silently",
            };
        }
    }

    private async flushInternal(): Promise<IAnalyticsLogEventResult> {

        let result = successfulUnsentResult();

        // Drain until the queue is empty or a retryable delivery failure tells
        // us to leave the current batch on disk for a later flush.
        while (true) {
            const batch = await this.runExclusive(async () => {
                await this.ensureLoaded();
                await this.dropExpiredEvents();
                return buildMeasurementProtocolQueueBatch(
                    this.queue,
                    this.batchSize,
                    this.maxBodyBytes,
                );
            });

            if (!batch) {
                debug("Measurement Protocol queue flush found no batch", summarizeQueueForDebug(this.queue));
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
                firstEvent: batch.events[0] ? summarizeQueuedEventForDebug(batch.events[0]) : undefined,
                lastEvent: batch.events.length > 1 ?
                    summarizeQueuedEventForDebug(batch.events[batch.events.length - 1]) :
                    undefined,
            });

            result = await this.sendBatch(batch);

            if (!result.isSuccess) {
                debug("Measurement Protocol queue batch delivery failed", result);
                if (isRetryableMeasurementProtocolFailure(result)) {
                    debug("Measurement Protocol queue preserving batch for retry", {
                        result,
                        batch: summarizeBatchForDebug(batch),
                    });
                    return result;
                }

                debug("Measurement Protocol queue dropping permanently failed batch", {
                    eventCount: batch.events.length,
                    statusCode: result.statusCode,
                    statusMessage: result.statusMessage,
                    reason: result.reason,
                });
                await this.removeEvents(batch.events);
                continue;
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
                debug("Measurement Protocol queue removed events", {
                    removedCount: previousLength - this.queue.length,
                    remainingCount: this.queue.length,
                    removedEvents: events.map(summarizeQueuedEventForDebug),
                });
            } else {
                debug("Measurement Protocol queue remove skipped, events already absent", {
                    requestedCount: events.length,
                    queueLength: this.queue.length,
                });
            }
        });
    }

    private dropOldestEventsOverQueueLimit(): boolean {

        if (this.queue.length <= this.maxQueuedEvents) {
            return false;
        }

        const droppedCount = this.queue.length - this.maxQueuedEvents;
        this.queue = this.queue.slice(droppedCount);
        debug("Measurement Protocol queue dropped oldest events over size limit", {
            droppedCount,
            maxQueuedEvents: this.maxQueuedEvents,
        });

        return true;
    }

    private async dropExpiredEvents(): Promise<void> {

        const previousLength = this.queue.length;
        if (!previousLength) {
            return;
        }

        const nowMicros = this.nowMicros();
        this.queue = this.queue.filter((event) =>
            !isQueuedEventExpired(event, nowMicros, this.maxEventAgeMicros));

        if (this.queue.length !== previousLength) {
            debug("Measurement Protocol queue dropped expired events", {
                droppedCount: previousLength - this.queue.length,
                maxEventAgeMicros: this.maxEventAgeMicros,
            });
            await this.persistQueue();
        }
    }

    private async ensureLoaded(): Promise<void> {

        if (this.loaded) {
            return;
        }

        if (this.loadPromise === undefined) {
            debug("Measurement Protocol queue load requested", {
                queueFilePath: this.dependencies.queueFilePath,
            });
            this.loadPromise = this.loadQueue()
                .finally(() => {
                    this.loadPromise = undefined;
                });
        } else {
            debug("Measurement Protocol queue waiting for existing load");
        }

        await this.loadPromise;
    }

    private async loadQueue(): Promise<void> {

        debug("Measurement Protocol queue loading from disk", {
            queueFilePath: this.dependencies.queueFilePath,
        });

        try {
            await fs.promises.mkdir(path.dirname(this.dependencies.queueFilePath), { recursive: true });
        } catch (err) {
            debug("Measurement Protocol queue directory creation failed", err);
        }

        let queueWasLoaded = false;
        try {
            const data = await fs.promises.readFile(this.dependencies.queueFilePath, { encoding: "utf8" });
            this.queue = parseMeasurementProtocolQueueFile(data);
            queueWasLoaded = true;
            debug("Measurement Protocol queue read from disk", {
                bytes: Buffer.byteLength(data, "utf8"),
                eventCount: this.queue.length,
            });
        } catch (err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code !== "ENOENT") {
                debug("Measurement Protocol queue read failed", err);
            } else {
                debug("Measurement Protocol queue file not found, starting empty");
            }
            this.queue = [];
        }

        if (queueWasLoaded) {
            try {
                // Normalize only a successfully read queue. A missing or
                // unreadable file simply starts an empty in-memory queue.
                await this.dropExpiredEvents();
                if (this.dropOldestEventsOverQueueLimit()) {
                    await this.persistQueue();
                }
            } catch (err) {
                debug("Measurement Protocol queue load cleanup failed", err);
            }
        }

        debug("Measurement Protocol queue loaded", { eventCount: this.queue.length });
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
            debug("Measurement Protocol queue persisting", {
                queueFilePath: this.dependencies.queueFilePath,
                tmpFilePath,
                bytes: Buffer.byteLength(data, "utf8"),
                ...summarizeQueueForDebug(this.queue),
            });
            // Write the complete queue to a temp file first so failed persistence
            // does not corrupt or truncate the last known-good queue file.
            await fs.promises.writeFile(tmpFilePath, data, { encoding: "utf8", flush: true });
            await renameMeasurementProtocolQueueFile(tmpFilePath, this.dependencies.queueFilePath);
            debug("Measurement Protocol queue persisted", {
                queueFilePath: this.dependencies.queueFilePath,
                eventCount: this.queue.length,
            });
        } catch (err) {
            try {
                await fs.promises.rm(tmpFilePath, { force: true });
            } catch {
                // ignore cleanup failure
            }
            debug("Measurement Protocol queue persist failed", {
                queueFilePath: this.dependencies.queueFilePath,
                tmpFilePath,
                eventCount: this.queue.length,
                error: err,
            });
            throw err;
        }
    }

    private runExclusive<T>(operation: () => Promise<T>): Promise<T> {

        // Serialize disk and in-memory queue mutations without blocking future
        // operations behind a rejected promise.
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
    getMeasurementProtocolQueue()
        .enqueue(request)
        .catch((err) => {
            debug("Measurement Protocol queue request failed silently", err);
            return {
                sent: false,
                isSuccess: false,
                statusMessage: "Measurement Protocol queue request failed silently",
            };
        });

export const startMeasurementProtocolQueue = async (): Promise<void> => {

    try {
        if (!isMeasurementProtocolQueueEnabled()) {
            debug("Measurement Protocol queue not started, missing config or disabled");
            return;
        }

        await getMeasurementProtocolQueue().start();
    } catch (err) {
        debug("Measurement Protocol queue start request failed silently", err);
    }
};

export const stopMeasurementProtocolQueue = (): void => {

    try {
        if (measurementProtocolQueue) {
            measurementProtocolQueue.stop();
        }
    } catch (err) {
        debug("Measurement Protocol queue stop request failed silently", err);
    }
};

export const flushMeasurementProtocolQueue = async (): Promise<IAnalyticsLogEventResult> => {

    try {
        if (!__TH__FIREBASE_ENABLED__) {
            return failureResult("disabled");
        }

        if (!isMeasurementProtocolQueueEnabled()) {
            return failureResult("missing-config");
        }

        return await getMeasurementProtocolQueue().flush();
    } catch (err) {
        debug("Measurement Protocol queue flush request failed silently", err);
        return {
            sent: false,
            isSuccess: false,
            statusMessage: "Measurement Protocol queue flush request failed silently",
        };
    }
};
