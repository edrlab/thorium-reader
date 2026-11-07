// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IpcMainEvent } from "electron";
import {
    TTS_LOOK_AHEAD_CHANNEL,
    type ITtsLookAheadMessage,
    type IVoiceLinkBlock,
    type IVoiceLinkPosition,
    type IVoiceLinkSnapshot,
    type IVoiceLinkSource,
    type IVoiceLinkSynthesisHint,
    type IVoiceLinkUnit,
} from "readium-desktop/common/ipc/ttsLookAhead";
import { LatestSnapshotSender } from "readium-desktop/main/ttsLookAhead/latestSnapshotSender";
import { VoiceLinkClient } from "readium-desktop/main/ttsLookAhead/voiceLinkClient";
import { type Buffer, eventChannel } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, fork, take } from "redux-saga/effects";

const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_UNITS = 12;
const MAX_UNIT_CHARACTERS = 4_000;
const MAX_CHARACTERS = 12_000;
const MAX_SHORT_STRING = 1_024;
export const MAX_TTS_LOOK_AHEAD_PENDING_STREAMS = 20;

const BOUNDARIES = new Set([
    "none",
    "sentence",
    "paragraph",
    "list-item",
    "heading-to-body",
    "section",
    "document",
]);
const BLOCK_KINDS = new Set([
    "heading",
    "paragraph",
    "list-item",
    "blockquote",
    "caption",
    "table-cell",
    "code",
    "math",
    "image-description",
    "page-break",
    "other",
]);
const DIRECTIONS = new Set(["ltr", "rtl", "auto"]);

export type TtsLookAheadIpcListener = (event: IpcMainEvent, data: unknown) => void;

export interface ITtsLookAheadIpcMain {
    on: (channel: string, listener: TtsLookAheadIpcListener) => unknown;
    removeListener: (channel: string, listener: TtsLookAheadIpcListener) => unknown;
}

export interface ITtsLookAheadSender {
    dispose(): Promise<void>;
    enqueue(streamId: string, snapshot: IVoiceLinkSnapshot): void;
    stop(streamId: string): Promise<void>;
}

export interface ITtsLookAheadIpcDependencies {
    createSender: () => ITtsLookAheadSender;
    ipcMain: ITtsLookAheadIpcMain;
    platform: NodeJS.Platform;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
    value: Record<string, unknown>,
    required: readonly string[],
    optional: readonly string[] = [],
): boolean {
    const keys = Object.keys(value);
    return required.every((key) => Object.hasOwn(value, key)) &&
        keys.every((key) => required.includes(key) || optional.includes(key));
}

function isSafeNonNegativeInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isFinitePositiveNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isBoundedString(value: unknown, maxLength = MAX_SHORT_STRING): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isOptionalBoundedString(value: unknown): value is string | undefined {
    return value === undefined || isBoundedString(value);
}

function isBlock(value: unknown): value is IVoiceLinkBlock {
    if (!isRecord(value) || !hasOnlyKeys(
        value,
        ["id", "kind"],
        ["htmlTag", "headingLevel", "epubTypes", "ariaRole"],
    )) {
        return false;
    }
    if (!isBoundedString(value.id) || typeof value.kind !== "string" || !BLOCK_KINDS.has(value.kind)) {
        return false;
    }
    if (!isOptionalBoundedString(value.htmlTag) || !isOptionalBoundedString(value.ariaRole)) {
        return false;
    }
    if (value.headingLevel !== undefined &&
        (typeof value.headingLevel !== "number" ||
            !Number.isSafeInteger(value.headingLevel) ||
            value.headingLevel < 1 || value.headingLevel > 6)) {
        return false;
    }
    return value.epubTypes === undefined || (
        Array.isArray(value.epubTypes) &&
        value.epubTypes.length <= 32 &&
        value.epubTypes.every((epubType) => isBoundedString(epubType, 256))
    );
}

function isPosition(value: unknown): value is IVoiceLinkPosition {
    return isRecord(value) &&
        hasOnlyKeys(value, ["indexInBlock", "firstInBlock", "lastInBlock"]) &&
        isSafeNonNegativeInteger(value.indexInBlock) &&
        typeof value.firstInBlock === "boolean" &&
        typeof value.lastInBlock === "boolean";
}

function isUnit(value: unknown): value is IVoiceLinkUnit {
    if (!isRecord(value) || !hasOnlyKeys(
        value,
        ["sequence", "text", "block", "position", "boundaryBefore", "boundaryAfter"],
        ["lang", "direction"],
    )) {
        return false;
    }
    return isSafeNonNegativeInteger(value.sequence) &&
        isBoundedString(value.text, MAX_UNIT_CHARACTERS * 2) &&
        Array.from(value.text).length <= MAX_UNIT_CHARACTERS &&
        isOptionalBoundedString(value.lang) &&
        (value.direction === undefined ||
            (typeof value.direction === "string" && DIRECTIONS.has(value.direction))) &&
        isBlock(value.block) &&
        isPosition(value.position) &&
        typeof value.boundaryBefore === "string" && BOUNDARIES.has(value.boundaryBefore) &&
        typeof value.boundaryAfter === "string" && BOUNDARIES.has(value.boundaryAfter);
}

function isSource(value: unknown): value is IVoiceLinkSource {
    return isRecord(value) &&
        hasOnlyKeys(value, ["rate"], ["voiceName", "voiceURI", "lang"]) &&
        isFinitePositiveNumber(value.rate) &&
        isOptionalBoundedString(value.voiceName) &&
        isOptionalBoundedString(value.voiceURI) &&
        isOptionalBoundedString(value.lang);
}

function isSynthesisHint(value: unknown): value is IVoiceLinkSynthesisHint {
    return isRecord(value) &&
        hasOnlyKeys(value, ["route", "voice", "speed", "format"]) &&
        isBoundedString(value.route) &&
        isBoundedString(value.voice) &&
        isFinitePositiveNumber(value.speed) &&
        isBoundedString(value.format);
}

function isSnapshot(value: unknown): value is IVoiceLinkSnapshot {
    if (!isRecord(value) || !hasOnlyKeys(
        value,
        ["protocol", "generation", "revision", "currentSequence", "source", "units"],
        ["synthesisHint"],
    )) {
        return false;
    }
    if (
        value.protocol !== 1 ||
        !isSafeNonNegativeInteger(value.generation) ||
        !isSafeNonNegativeInteger(value.revision) ||
        !isSafeNonNegativeInteger(value.currentSequence) ||
        !isSource(value.source) ||
        (value.synthesisHint !== undefined && !isSynthesisHint(value.synthesisHint)) ||
        !Array.isArray(value.units) ||
        value.units.length === 0 ||
        value.units.length > MAX_UNITS ||
        !value.units.every(isUnit)
    ) {
        return false;
    }

    const units = value.units as IVoiceLinkUnit[];
    if (units[0].sequence !== value.currentSequence) {
        return false;
    }
    let characters = 0;
    for (let index = 0; index < units.length; index++) {
        characters += Array.from(units[index].text).length;
        if (characters > MAX_CHARACTERS ||
            units[index].sequence !== value.currentSequence + index ||
            (index > 0 && units[index - 1].boundaryAfter !== units[index].boundaryBefore)) {
            return false;
        }
    }
    return true;
}

export function isTtsLookAheadMessage(value: unknown): value is ITtsLookAheadMessage {
    if (!isRecord(value) || typeof value.streamId !== "string" ||
        !CANONICAL_UUID.test(value.streamId)) {
        return false;
    }
    if (value.type === "stop") {
        return hasOnlyKeys(value, ["type", "streamId"]);
    }
    return value.type === "snapshot" &&
        hasOnlyKeys(value, ["type", "streamId", "snapshot"]) &&
        isSnapshot(value.snapshot);
}

class TtsLookAheadMessageBuffer implements Buffer<ITtsLookAheadMessage> {
    private readonly knownStreams = new Set<string>();
    private readonly messages: ITtsLookAheadMessage[] = [];

    public flush(): ITtsLookAheadMessage[] {
        const messages = this.messages.splice(0);
        this.knownStreams.clear();
        return messages;
    }

    public isEmpty(): boolean {
        return this.messages.length === 0;
    }

    public accept(message: ITtsLookAheadMessage): boolean {
        if (message.type === "snapshot") {
            if (this.knownStreams.has(message.streamId)) {
                return true;
            }
            if (this.knownStreams.size >= MAX_TTS_LOOK_AHEAD_PENDING_STREAMS ||
                this.messages.length >= MAX_TTS_LOOK_AHEAD_PENDING_STREAMS) {
                return false;
            }
            this.knownStreams.add(message.streamId);
            return true;
        }

        if (!this.knownStreams.has(message.streamId)) {
            return false;
        }
        this.knownStreams.delete(message.streamId);
        return true;
    }

    public put(message: ITtsLookAheadMessage): void {
        const pendingIndex = this.messages.findIndex(({ streamId }) => streamId === message.streamId);
        if (message.type === "snapshot") {
            if (pendingIndex >= 0) {
                if (this.messages[pendingIndex].type === "snapshot") {
                    this.messages[pendingIndex] = message;
                }
                return;
            }

            if (this.messages.length < MAX_TTS_LOOK_AHEAD_PENDING_STREAMS) {
                this.messages.push(message);
            }
            return;
        }

        if (pendingIndex >= 0) {
            this.messages[pendingIndex] = message;
            return;
        }
        if (this.messages.length < MAX_TTS_LOOK_AHEAD_PENDING_STREAMS) {
            this.messages.push(message);
            return;
        }

        const snapshotIndex = this.messages.findIndex(({ type }) => type === "snapshot");
        if (snapshotIndex >= 0) {
            this.messages[snapshotIndex] = message;
        }
    }

    public take(): ITtsLookAheadMessage | undefined {
        return this.messages.shift();
    }
}

function createIpcChannel(ipcMain: ITtsLookAheadIpcMain) {
    const buffer = new TtsLookAheadMessageBuffer();
    return eventChannel<ITtsLookAheadMessage>(
        (emit) => {
            const listener: TtsLookAheadIpcListener = (_event, data) => {
                if (isTtsLookAheadMessage(data) && buffer.accept(data)) {
                    emit(data);
                }
            };
            ipcMain.on(TTS_LOOK_AHEAD_CHANNEL, listener);
            return () => {
                ipcMain.removeListener(TTS_LOOK_AHEAD_CHANNEL, listener);
            };
        },
        buffer,
    );
}

export function* watchTtsLookAheadIpc(dependencies: ITtsLookAheadIpcDependencies) {
    if (dependencies.platform !== "win32") {
        return;
    }

    const sender = dependencies.createSender();
    const channel = createIpcChannel(dependencies.ipcMain);
    try {
        while (true) {
            const message: ITtsLookAheadMessage = yield take(channel);
            if (message.type === "snapshot") {
                try {
                    sender.enqueue(message.streamId, message.snapshot);
                } catch {
                    // Look-ahead must never affect ordinary speech synthesis.
                }
            } else {
                try {
                    yield call([sender, sender.stop], message.streamId);
                } catch {
                    // Stream cleanup is best effort and must not break IPC consumption.
                }
            }
        }
    } finally {
        channel.close();
        try {
            yield call([sender, sender.dispose]);
        } catch {
            // Saga teardown must remain fail-open for normal TTS.
        }
    }
}

export function saga(ipcMain: ITtsLookAheadIpcMain) {
    return fork(watchTtsLookAheadIpc, {
        createSender: () => new LatestSnapshotSender(new VoiceLinkClient()),
        ipcMain,
        platform: process.platform,
    });
}
