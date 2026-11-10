import { expect, test } from "@jest/globals";
import { runSaga } from "redux-saga";

import type { ITtsLookAheadSnapshot } from "@r2-navigator-js/electron/common/tts-lookahead";
import type { TTSStateEnum } from "@r2-navigator-js/electron/renderer/readaloud";
import { TTS_LOOK_AHEAD_CHANNEL, type ITtsLookAheadMessage } from "readium-desktop/common/ipc/ttsLookAhead";
import {
    createTTSLookAheadLifecycle,
    watchTTSLookAheadLifecycle,
} from "readium-desktop/renderer/reader/redux/sagas/ttsLookAheadLifecycle";
import { TtsLookAheadSession } from "readium-desktop/renderer/reader/ttsLookAhead";

const PLAYING = "PLAYING" as TTSStateEnum;
const STOPPED = "STOPPED" as TTSStateEnum;
const STREAM_ID = "123e4567-e89b-12d3-a456-426614174000";

function deferred(): { promise: Promise<void>; resolve: () => void } {
    let resolvePromise!: () => void;
    const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
    });
    return { promise, resolve: resolvePromise };
}

function snapshot(revision = 8): ITtsLookAheadSnapshot {
    return {
        currentSequence: 20,
        generation: 3,
        revision,
        source: {
            rate: 1.1,
            voiceName: "Emma",
            voiceURI: "VoiceLink_bf_emma",
        },
        units: [
            {
                block: { id: "3:0", kind: "paragraph" },
                boundaryAfter: "document",
                boundaryBefore: "section",
                position: { firstInBlock: true, indexInBlock: 0, lastInBlock: true },
                sequence: 20,
                text: "Queued sentence",
            },
        ],
    };
}

async function nextTurn(): Promise<void> {
    await new Promise<void>((resolve) => setImmediate(resolve));
}

test("serializes a queued snapshot before STOPPED without reopening a stale stream", async () => {
    let stateListener: ((state: TTSStateEnum) => void) | undefined;
    let lookAheadListener: ((value: ITtsLookAheadSnapshot) => void) | undefined;
    const lookAheadRegistrations: Array<typeof lookAheadListener> = [];
    const messages: Array<{ channel: string; message: ITtsLookAheadMessage }> = [];
    const createdIds: string[] = [];
    const stateGate = deferred();
    const session = new TtsLookAheadSession({
        createStreamId: () => {
            createdIds.push(STREAM_ID);
            return STREAM_ID;
        },
        send: (channel, message) => messages.push({ channel, message }),
    });
    const lifecycle = createTTSLookAheadLifecycle({
        addBeforeUnload: () => undefined,
        createSession: () => session,
        listenLookAhead: (listener) => {
            lookAheadRegistrations.push(listener);
            lookAheadListener = listener;
        },
        listenState: (listener) => {
            stateListener = listener;
        },
        platform: "win32",
        removeBeforeUnload: () => undefined,
    });
    const handledStates: TTSStateEnum[] = [];
    const task = runSaga({}, watchTTSLookAheadLifecycle, lifecycle, async (state) => {
        handledStates.push(state);
        if (state === PLAYING) {
            await stateGate.promise;
        }
    });

    stateListener?.(PLAYING);
    lookAheadListener?.(snapshot());
    stateListener?.(STOPPED);
    await nextTurn();
    expect(messages).toStrictEqual([]);

    stateGate.resolve();
    await nextTurn();
    await nextTurn();

    expect(createdIds).toStrictEqual([STREAM_ID]);
    expect(messages.map(({ channel }) => channel)).toStrictEqual([TTS_LOOK_AHEAD_CHANNEL, TTS_LOOK_AHEAD_CHANNEL]);
    expect(messages.map(({ message }) => ({ streamId: message.streamId, type: message.type }))).toStrictEqual([
        { streamId: STREAM_ID, type: "snapshot" },
        { streamId: STREAM_ID, type: "stop" },
    ]);
    expect(handledStates).toStrictEqual([PLAYING, STOPPED]);

    task.cancel();
    await task.toPromise();
    expect(lookAheadRegistrations).toStrictEqual([expect.any(Function), undefined]);
});

test("ends the active look-ahead stream when opt-in is disabled without stopping TTS", async () => {
    let stateListener: ((state: TTSStateEnum) => void) | undefined;
    let lookAheadListener: ((value: ITtsLookAheadSnapshot) => void) | undefined;
    let lookAheadStopListener: (() => void) | undefined;
    const messages: Array<{ channel: string; message: ITtsLookAheadMessage }> = [];
    const session = new TtsLookAheadSession({
        createStreamId: () => STREAM_ID,
        send: (channel, message) => messages.push({ channel, message }),
    });
    const lifecycle = createTTSLookAheadLifecycle({
        addBeforeUnload: () => undefined,
        createSession: () => session,
        listenLookAhead: (listener, stopListener) => {
            lookAheadListener = listener;
            lookAheadStopListener = stopListener;
        },
        listenState: (listener) => {
            stateListener = listener;
        },
        platform: "win32",
        removeBeforeUnload: () => undefined,
    });
    const handledStates: TTSStateEnum[] = [];
    const task = runSaga({}, watchTTSLookAheadLifecycle, lifecycle, (state) => {
        handledStates.push(state);
    });

    stateListener?.(PLAYING);
    lookAheadListener?.(snapshot());
    lookAheadStopListener?.();
    await nextTurn();
    await nextTurn();

    expect(messages.map(({ message }) => ({ streamId: message.streamId, type: message.type }))).toStrictEqual([
        { streamId: STREAM_ID, type: "snapshot" },
        { streamId: STREAM_ID, type: "stop" },
    ]);
    expect(handledStates).toStrictEqual([PLAYING]);

    task.cancel();
    await task.toPromise();
});

test("keeps ordinary TTS state handling but creates no adapter outside Windows", async () => {
    let stateListener: ((state: TTSStateEnum) => void) | undefined;
    let createSessionCalls = 0;
    let lookAheadRegistrations = 0;
    let beforeUnloadRegistrations = 0;
    const lifecycle = createTTSLookAheadLifecycle({
        addBeforeUnload: () => {
            beforeUnloadRegistrations += 1;
        },
        createSession: () => {
            createSessionCalls += 1;
            return new TtsLookAheadSession({
                createStreamId: () => STREAM_ID,
                send: () => {
                    throw new Error("VoiceLink IPC must remain inert outside Windows");
                },
            });
        },
        listenLookAhead: () => {
            lookAheadRegistrations += 1;
        },
        listenState: (listener) => {
            stateListener = listener;
        },
        platform: "linux",
        removeBeforeUnload: () => undefined,
    });
    const handledStates: TTSStateEnum[] = [];
    const task = runSaga({}, watchTTSLookAheadLifecycle, lifecycle, (state) => {
        handledStates.push(state);
    });

    stateListener?.(PLAYING);
    stateListener?.(STOPPED);
    await nextTurn();

    expect(handledStates).toStrictEqual([PLAYING, STOPPED]);
    expect(createSessionCalls).toBe(0);
    expect(lookAheadRegistrations).toBe(0);
    expect(beforeUnloadRegistrations).toBe(0);

    task.cancel();
    await task.toPromise();
});
