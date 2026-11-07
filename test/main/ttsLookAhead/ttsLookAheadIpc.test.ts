import { expect, test } from "@jest/globals";
import { runSaga } from "redux-saga";

import {
    TTS_LOOK_AHEAD_CHANNEL,
    type ITtsLookAheadMessage,
    type IVoiceLinkSnapshot,
} from "readium-desktop/common/ipc/ttsLookAhead";
import {
    type ITtsLookAheadIpcMain,
    type ITtsLookAheadSender,
    type TtsLookAheadIpcListener,
    watchTtsLookAheadIpc,
} from "readium-desktop/main/redux/sagas/ttsLookAheadIpc";
import { LatestSnapshotSender } from "readium-desktop/main/ttsLookAhead/latestSnapshotSender";
import type { VoiceLinkClient } from "readium-desktop/main/ttsLookAhead/voiceLinkClient";

type PutResult = Awaited<ReturnType<VoiceLinkClient["putSnapshot"]>>;
type Listener = TtsLookAheadIpcListener;

interface IDeferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
}

const STREAM_ID = "123e4567-e89b-12d3-a456-426614174000";

function deferred<T>(): IDeferred<T> {
    let resolvePromise!: (value: T) => void;
    const promise = new Promise<T>((resolve) => {
        resolvePromise = resolve;
    });
    return { promise, resolve: resolvePromise };
}

function snapshot(revision = 8): IVoiceLinkSnapshot {
    return {
        currentSequence: 20,
        generation: 3,
        protocol: 1,
        revision,
        source: {
            lang: "en-GB",
            rate: 1.1,
            voiceName: "Emma",
            voiceURI: "VoiceLink_bf_emma",
        },
        units: [
            {
                block: {
                    ariaRole: "paragraph",
                    epubTypes: ["bodymatter"],
                    htmlTag: "p",
                    id: "3:0",
                    kind: "paragraph",
                },
                boundaryAfter: "document",
                boundaryBefore: "section",
                direction: "ltr",
                lang: "en-GB",
                position: {
                    firstInBlock: true,
                    indexInBlock: 0,
                    lastInBlock: true,
                },
                sequence: 20,
                text: "PRIVATE current sentence",
            },
        ],
    };
}

function snapshotMessage(revision = 8): ITtsLookAheadMessage {
    return {
        snapshot: snapshot(revision),
        streamId: STREAM_ID,
        type: "snapshot",
    };
}

async function nextTurn(): Promise<void> {
    await new Promise<void>((resolve) => setImmediate(resolve));
}

class FakeIpcMain implements ITtsLookAheadIpcMain {
    private readonly listeners = new Map<string, Set<Listener>>();

    public emit(channel: string, data: unknown): void {
        for (const listener of this.listeners.get(channel) || []) {
            listener({} as never, data);
        }
    }

    public listenerCount(channel: string): number {
        return this.listeners.get(channel)?.size || 0;
    }

    public on(channel: string, listener: Listener): this {
        let listeners = this.listeners.get(channel);
        if (!listeners) {
            listeners = new Set();
            this.listeners.set(channel, listeners);
        }
        listeners.add(listener);
        return this;
    }

    public removeListener(channel: string, listener: Listener): this {
        this.listeners.get(channel)?.delete(listener);
        return this;
    }
}

class RecordingSender implements ITtsLookAheadSender {
    public disposeCalls = 0;
    public readonly enqueues: Array<{ snapshot: IVoiceLinkSnapshot; streamId: string }> = [];
    public readonly stops: string[] = [];

    public async dispose(): Promise<void> {
        this.disposeCalls += 1;
    }

    public enqueue(streamId: string, value: IVoiceLinkSnapshot): void {
        this.enqueues.push({ snapshot: value, streamId });
    }

    public async stop(streamId: string): Promise<void> {
        this.stops.push(streamId);
    }
}

test("accepts validated protocol 1 snapshots and stops on Windows", async () => {
    const ipcMain = new FakeIpcMain();
    const sender = new RecordingSender();
    const task = runSaga({}, watchTtsLookAheadIpc, {
        createSender: () => sender,
        ipcMain,
        platform: "win32",
    });

    expect(ipcMain.listenerCount(TTS_LOOK_AHEAD_CHANNEL)).toBe(1);
    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, snapshotMessage());
    await nextTurn();
    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, { streamId: STREAM_ID, type: "stop" });
    await nextTurn();

    expect(sender.enqueues).toStrictEqual([{ snapshot: snapshot(), streamId: STREAM_ID }]);
    expect(sender.stops).toStrictEqual([STREAM_ID]);

    task.cancel();
    await task.toPromise();
    expect(ipcMain.listenerCount(TTS_LOOK_AHEAD_CHANNEL)).toBe(0);
    expect(sender.disposeCalls).toBe(1);
});

test("is completely inert outside Windows", async () => {
    const ipcMain = new FakeIpcMain();
    const sender = new RecordingSender();
    let senderCreations = 0;
    const task = runSaga({}, watchTtsLookAheadIpc, {
        createSender: () => {
            senderCreations += 1;
            return sender;
        },
        ipcMain,
        platform: "darwin",
    });

    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, snapshotMessage());
    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, { streamId: STREAM_ID, type: "stop" });
    await task.toPromise();

    expect(senderCreations).toBe(0);
    expect(ipcMain.listenerCount(TTS_LOOK_AHEAD_CHANNEL)).toBe(0);
    expect(sender.enqueues).toStrictEqual([]);
    expect(sender.stops).toStrictEqual([]);
    expect(sender.disposeCalls).toBe(0);
});

test("rejects malformed and extra IPC data without calling the sender", async () => {
    const ipcMain = new FakeIpcMain();
    const sender = new RecordingSender();
    const task = runSaga({}, watchTtsLookAheadIpc, {
        createSender: () => sender,
        ipcMain,
        platform: "win32",
    });
    const unsafeInteger = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    unsafeInteger.snapshot.generation = Number.MAX_SAFE_INTEGER + 1;
    const unsafeRevision = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    unsafeRevision.snapshot.revision = -1;
    const unsafeCurrentSequence = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    unsafeCurrentSequence.snapshot.currentSequence = 1.5;
    const badProtocol = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    badProtocol.snapshot.protocol = 2 as 1;
    const badSource = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    badSource.snapshot.source.rate = Number.NaN;
    const badUnits = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    badUnits.snapshot.units = [];
    const badBlock = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    badBlock.snapshot.units[0].block.kind = "private" as "paragraph";
    const badNestedPosition = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    badNestedPosition.snapshot.units[0].position.firstInBlock = "yes" as unknown as boolean;
    const badBoundary = snapshotMessage() as { snapshot: IVoiceLinkSnapshot };
    badBoundary.snapshot.units[0].boundaryAfter = "private" as "document";
    const extraNestedField = snapshotMessage() as unknown as {
        snapshot: { units: Array<{ block: Record<string, unknown> }> };
    };
    extraNestedField.snapshot.units[0].block.privateText = "must be rejected";

    const malformed: unknown[] = [
        undefined,
        null,
        "snapshot",
        { streamId: STREAM_ID, type: "other" },
        { extra: true, streamId: STREAM_ID, type: "stop" },
        { streamId: STREAM_ID.toUpperCase(), type: "stop" },
        { streamId: STREAM_ID, type: "snapshot" },
        unsafeInteger,
        unsafeRevision,
        unsafeCurrentSequence,
        badProtocol,
        badSource,
        badUnits,
        badBlock,
        badNestedPosition,
        badBoundary,
        extraNestedField,
    ];

    for (const value of malformed) {
        ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, value);
    }
    await nextTurn();

    expect(sender.enqueues).toStrictEqual([]);
    expect(sender.stops).toStrictEqual([]);

    task.cancel();
    await task.toPromise();
});

test("contains enqueue and stop failures and continues consuming IPC", async () => {
    const ipcMain = new FakeIpcMain();
    const enqueueRevisions: number[] = [];
    const stopIds: string[] = [];
    let enqueueFailures = 1;
    const sender: ITtsLookAheadSender = {
        dispose: async () => undefined,
        enqueue: (_streamId, value) => {
            enqueueRevisions.push(value.revision);
            if (enqueueFailures-- > 0) {
                throw new Error("PRIVATE enqueue failure");
            }
        },
        stop: async (streamId) => {
            stopIds.push(streamId);
            throw new Error("PRIVATE stop failure");
        },
    };
    const task = runSaga({}, watchTtsLookAheadIpc, {
        createSender: () => sender,
        ipcMain,
        platform: "win32",
    });

    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, snapshotMessage(1));
    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, snapshotMessage(2));
    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, { streamId: STREAM_ID, type: "stop" });
    await nextTurn();
    await nextTurn();

    expect(enqueueRevisions).toStrictEqual([1, 2]);
    expect(stopIds).toStrictEqual([STREAM_ID]);

    task.cancel();
    await task.toPromise();
});

test("teardown removes the listener and awaits sender disposal", async () => {
    const ipcMain = new FakeIpcMain();
    const disposeGate = deferred<void>();
    let disposeCalls = 0;
    let disposeFinished = false;
    const sender: ITtsLookAheadSender = {
        dispose: () => {
            disposeCalls += 1;
            return disposeGate.promise.then(() => {
                disposeFinished = true;
            });
        },
        enqueue: () => undefined,
        stop: async () => undefined,
    };
    const task = runSaga({}, watchTtsLookAheadIpc, {
        createSender: () => sender,
        ipcMain,
        platform: "win32",
    });

    task.cancel();
    const completion = task.toPromise();
    await nextTurn();

    expect(ipcMain.listenerCount(TTS_LOOK_AHEAD_CHANNEL)).toBe(0);
    expect(disposeCalls).toBe(1);
    expect(disposeFinished).toBe(false);

    disposeGate.resolve(undefined);
    await completion;
    await nextTurn();
    expect(disposeFinished).toBe(true);
});

test("stop during an active PUT clears pending work before DELETE", async () => {
    const ipcMain = new FakeIpcMain();
    const putGates: Array<IDeferred<PutResult>> = [];
    const putRevisions: number[] = [];
    const deleteGates: Array<IDeferred<void>> = [];
    const deleteIds: string[] = [];
    const client: Pick<VoiceLinkClient, "putSnapshot" | "deleteStream"> = {
        deleteStream: (streamId) => {
            deleteIds.push(streamId);
            const gate = deferred<void>();
            deleteGates.push(gate);
            return gate.promise;
        },
        putSnapshot: (_streamId, value) => {
            putRevisions.push(value.revision);
            const gate = deferred<PutResult>();
            putGates.push(gate);
            return gate.promise;
        },
    };
    const sender = new LatestSnapshotSender(client);
    const task = runSaga({}, watchTtsLookAheadIpc, {
        createSender: () => sender,
        ipcMain,
        platform: "win32",
    });

    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, snapshotMessage(12));
    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, snapshotMessage(13));
    ipcMain.emit(TTS_LOOK_AHEAD_CHANNEL, { streamId: STREAM_ID, type: "stop" });
    await nextTurn();

    expect(putRevisions).toStrictEqual([12]);
    expect(deleteIds).toStrictEqual([]);

    putGates[0].resolve("transient-error");
    await nextTurn();
    expect(putRevisions).toStrictEqual([12]);
    expect(deleteIds).toStrictEqual([STREAM_ID]);

    deleteGates[0].resolve(undefined);
    await nextTurn();
    expect(putRevisions).toStrictEqual([12]);

    task.cancel();
    await task.toPromise();
    expect(deleteIds).toStrictEqual([STREAM_ID]);
});
