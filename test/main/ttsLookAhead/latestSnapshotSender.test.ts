import { expect, test } from "@jest/globals";

import type { IVoiceLinkSnapshot } from "readium-desktop/common/ipc/ttsLookAhead";
import { LatestSnapshotSender } from "readium-desktop/main/ttsLookAhead/latestSnapshotSender";
import type { VoiceLinkClient } from "readium-desktop/main/ttsLookAhead/voiceLinkClient";

type PutResult = Awaited<ReturnType<VoiceLinkClient["putSnapshot"]>>;

interface IDeferred<T> {
    promise: Promise<T>;
    reject: (reason?: unknown) => void;
    resolve: (value: T) => void;
}

interface IPutCall {
    gate: IDeferred<PutResult>;
    snapshot: IVoiceLinkSnapshot;
    streamId: string;
}

interface IDeleteCall {
    gate: IDeferred<void>;
    streamId: string;
}

const STREAM_A = "123e4567-e89b-12d3-a456-426614174000";
const STREAM_B = "223e4567-e89b-12d3-a456-426614174000";
const STREAM_C = "323e4567-e89b-12d3-a456-426614174000";

function deferred<T>(): IDeferred<T> {
    let rejectPromise!: (reason?: unknown) => void;
    let resolvePromise!: (value: T) => void;
    const promise = new Promise<T>((resolve, reject) => {
        rejectPromise = reject;
        resolvePromise = resolve;
    });
    return { promise, reject: rejectPromise, resolve: resolvePromise };
}

function snapshot(generation: number, revision: number): IVoiceLinkSnapshot {
    return {
        currentSequence: 20,
        generation,
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
                block: { id: `${generation}:0`, kind: "paragraph" },
                boundaryAfter: "document",
                boundaryBefore: "section",
                position: {
                    firstInBlock: true,
                    indexInBlock: 0,
                    lastInBlock: true,
                },
                sequence: 20,
                text: `generation ${generation}, revision ${revision}`,
            },
        ],
    };
}

async function nextTurn(): Promise<void> {
    await new Promise<void>((resolve) => setImmediate(resolve));
}

class ControlledClient implements Pick<VoiceLinkClient, "putSnapshot" | "deleteStream"> {
    public autoResolveDeletes = true;
    public readonly deletes: IDeleteCall[] = [];
    public readonly puts: IPutCall[] = [];

    public deleteStream(streamId: string): Promise<void> {
        const gate = deferred<void>();
        this.deletes.push({ gate, streamId });
        if (this.autoResolveDeletes) {
            gate.resolve();
        }
        return gate.promise;
    }

    public putSnapshot(streamId: string, value: IVoiceLinkSnapshot): Promise<PutResult> {
        const gate = deferred<PutResult>();
        this.puts.push({ gate, snapshot: value, streamId });
        return gate.promise;
    }
}

test("keeps one PUT active and replaces revisions 12 and 13 with pending revision 14", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    expect(sender.enqueue(STREAM_A, snapshot(3, 11))).toBeUndefined();
    sender.enqueue(STREAM_A, snapshot(3, 12));
    sender.enqueue(STREAM_A, snapshot(3, 13));
    sender.enqueue(STREAM_A, snapshot(3, 14));

    expect(client.puts.map(({ snapshot: value }) => value.revision)).toStrictEqual([11]);

    client.puts[0].gate.resolve("accepted");
    await nextTurn();

    expect(client.puts.map(({ snapshot: value }) => value.revision)).toStrictEqual([11, 14]);
    client.puts[1].gate.resolve("accepted");
    await nextTurn();
});
test("ignores revisions that are not newer than the active or pending snapshot", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 10));
    sender.enqueue(STREAM_A, snapshot(3, 9));
    sender.enqueue(STREAM_A, snapshot(3, 10));
    sender.enqueue(STREAM_A, snapshot(3, 12));
    sender.enqueue(STREAM_A, snapshot(3, 11));

    client.puts[0].gate.resolve("accepted");
    await nextTurn();

    expect(client.puts.map(({ snapshot: value }) => value.revision)).toStrictEqual([10, 12]);
    client.puts[1].gate.resolve("accepted");
    await nextTurn();
});
test("prefers a higher generation even when it has a lower revision", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 100));
    sender.enqueue(STREAM_A, snapshot(4, 1));
    sender.enqueue(STREAM_A, snapshot(3, 999));

    client.puts[0].gate.resolve("accepted");
    await nextTurn();

    expect(client.puts.map(({ snapshot: value }) => [value.generation, value.revision])).toStrictEqual([
        [3, 100],
        [4, 1],
    ]);
    client.puts[1].gate.resolve("accepted");
    await nextTurn();
});

test("retries the newest transient snapshot once and drops a second transient result", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 12));
    client.puts[0].gate.resolve("transient-error");
    await nextTurn();

    expect(client.puts.map(({ snapshot: value }) => value.revision)).toStrictEqual([12, 12]);

    client.puts[1].gate.resolve("transient-error");
    await nextTurn();

    expect(client.puts).toHaveLength(2);
});

test("sends a newer pending snapshot instead of retrying a stale transient snapshot", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 12));
    sender.enqueue(STREAM_A, snapshot(3, 13));
    client.puts[0].gate.resolve("transient-error");
    await nextTurn();

    expect(client.puts.map(({ snapshot: value }) => value.revision)).toStrictEqual([12, 13]);
    client.puts[1].gate.resolve("accepted");
    await nextTurn();
});

test("disabled closes the stream, clears pending work, and is never retried", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 12));
    sender.enqueue(STREAM_A, snapshot(3, 13));
    client.puts[0].gate.resolve("disabled");
    await nextTurn();
    sender.enqueue(STREAM_A, snapshot(4, 1));
    await nextTurn();

    expect(client.puts.map(({ snapshot: value }) => value.revision)).toStrictEqual([12]);
});

test("contains synchronous and rejected client failures without unhandled rejections", async () => {
    const calls: number[] = [];
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    const client: Pick<VoiceLinkClient, "putSnapshot" | "deleteStream"> = {
        deleteStream: async () => undefined,
        putSnapshot: (_streamId, value) => {
            calls.push(value.revision);
            if (value.revision === 1) {
                throw new Error("synchronous failure");
            }
            if (value.revision === 2) {
                return Promise.reject(new Error("rejected failure"));
            }
            return Promise.resolve("accepted");
        },
    };
    const sender = new LatestSnapshotSender(client);
    process.on("unhandledRejection", onUnhandled);

    try {
        expect(sender.enqueue(STREAM_A, snapshot(3, 1))).toBeUndefined();
        sender.enqueue(STREAM_A, snapshot(3, 2));
        await nextTurn();
        sender.enqueue(STREAM_A, snapshot(3, 3));
        await nextTurn();

        expect(calls).toStrictEqual([1, 2, 3]);
        expect(unhandled).toStrictEqual([]);
    } finally {
        process.off("unhandledRejection", onUnhandled);
    }
});

test("stop closes immediately, waits for the active PUT, then performs one DELETE", async () => {
    const client = new ControlledClient();
    client.autoResolveDeletes = false;
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 12));
    sender.enqueue(STREAM_A, snapshot(3, 13));
    const stopped = sender.stop(STREAM_A);
    sender.enqueue(STREAM_A, snapshot(4, 1));

    expect(client.deletes).toHaveLength(0);
    client.puts[0].gate.resolve("transient-error");
    await nextTurn();

    expect(client.puts).toHaveLength(1);
    expect(client.deletes.map(({ streamId }) => streamId)).toStrictEqual([STREAM_A]);

    client.deletes[0].gate.resolve();
    await expect(stopped).resolves.toBeUndefined();
});

test("concurrent and repeated stop calls share one DELETE", async () => {
    const client = new ControlledClient();
    client.autoResolveDeletes = false;
    const sender = new LatestSnapshotSender(client);

    const first = sender.stop(STREAM_A);
    const second = sender.stop(STREAM_A);
    const third = sender.stop(STREAM_A);
    await nextTurn();

    expect(client.deletes).toHaveLength(1);
    client.deletes[0].gate.resolve();
    await Promise.all([first, second, third]);
    await sender.stop(STREAM_A);

    expect(client.deletes).toHaveLength(1);
});

test("bounds stopped-stream tombstones and keeps the most recently used stream IDs", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client, 2);

    await sender.stop(STREAM_A);
    await sender.stop(STREAM_B);
    await sender.stop(STREAM_A);
    await sender.stop(STREAM_C);

    sender.enqueue(STREAM_A, snapshot(1, 1));
    sender.enqueue(STREAM_B, snapshot(1, 1));
    sender.enqueue(STREAM_C, snapshot(1, 1));

    expect(client.puts.map(({ streamId }) => streamId)).toStrictEqual([STREAM_B]);
    client.puts[0].gate.resolve("accepted");
    await nextTurn();
});

test("dispose stops every known stream once and ignores all future enqueues", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 12));
    sender.enqueue(STREAM_B, snapshot(7, 4));
    client.puts[0].gate.resolve("accepted");
    await nextTurn();

    const first = sender.dispose();
    const second = sender.dispose();
    sender.enqueue("323e4567-e89b-12d3-a456-426614174000", snapshot(1, 1));

    client.puts[1].gate.resolve("accepted");
    await Promise.all([first, second]);
    await sender.dispose();

    expect(client.puts).toHaveLength(2);
    expect(client.deletes.map(({ streamId }) => streamId).sort()).toStrictEqual([STREAM_A, STREAM_B].sort());
});

test("dispose awaits an unseen stream cleanup and prevents new stops after disposal", async () => {
    const client = new ControlledClient();
    client.autoResolveDeletes = false;
    const sender = new LatestSnapshotSender(client);

    const stopped = sender.stop(STREAM_A);
    await nextTurn();
    expect(client.deletes.map(({ streamId }) => streamId)).toStrictEqual([STREAM_A]);

    let disposed = false;
    const disposal = sender.dispose().then(() => {
        disposed = true;
    });
    const postDisposalStop = sender.stop(STREAM_B);
    await nextTurn();

    expect(disposed).toBe(false);
    expect(client.deletes.map(({ streamId }) => streamId)).toStrictEqual([STREAM_A]);

    client.deletes[0].gate.resolve();
    await Promise.all([stopped, disposal, postDisposalStop]);
    expect(disposed).toBe(true);
    expect(client.deletes.map(({ streamId }) => streamId)).toStrictEqual([STREAM_A]);
});

test("different streams progress independently", async () => {
    const client = new ControlledClient();
    const sender = new LatestSnapshotSender(client);

    sender.enqueue(STREAM_A, snapshot(3, 12));
    sender.enqueue(STREAM_B, snapshot(8, 20));
    sender.enqueue(STREAM_A, snapshot(3, 13));

    expect(client.puts.map(({ streamId }) => streamId)).toStrictEqual([STREAM_A, STREAM_B]);

    client.puts[0].gate.resolve("accepted");
    await nextTurn();

    expect(client.puts.map(({ streamId }) => streamId)).toStrictEqual([STREAM_A, STREAM_B, STREAM_A]);
    expect(client.puts[2].snapshot.revision).toBe(13);

    client.puts[1].gate.resolve("accepted");
    client.puts[2].gate.resolve("accepted");
    await nextTurn();
});
