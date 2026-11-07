import type { IVoiceLinkSnapshot } from "readium-desktop/common/ipc/ttsLookAhead";
import type { VoiceLinkClient } from "readium-desktop/main/ttsLookAhead/voiceLinkClient";

type SnapshotResult = Awaited<ReturnType<VoiceLinkClient["putSnapshot"]>>;

interface IQueuedSnapshot {
    attempt: 0 | 1;
    snapshot: IVoiceLinkSnapshot;
}

interface IStreamState {
    active?: IQueuedSnapshot;
    activePromise?: Promise<void>;
    closed: boolean;
    newest?: Pick<IVoiceLinkSnapshot, "generation" | "revision">;
    pending?: IQueuedSnapshot;
    streamId: string;
}

function isNewer(
    snapshot: IVoiceLinkSnapshot,
    newest: Pick<IVoiceLinkSnapshot, "generation" | "revision"> | undefined,
): boolean {
    return !newest || snapshot.generation > newest.generation ||
        (snapshot.generation === newest.generation && snapshot.revision > newest.revision);
}

export class LatestSnapshotSender {
    private disposePromise?: Promise<void>;
    private disposed = false;
    private readonly stops = new Map<string, Promise<void>>();
    private readonly streams = new Map<string, IStreamState>();

    public constructor(
        private readonly client: Pick<VoiceLinkClient, "putSnapshot" | "deleteStream">,
    ) {
    }

    public enqueue(streamId: string, snapshot: IVoiceLinkSnapshot): void {
        if (this.disposed || this.stops.has(streamId)) {
            return;
        }

        let state = this.streams.get(streamId);
        if (!state) {
            state = { closed: false, streamId };
            this.streams.set(streamId, state);
        }
        if (state.closed || !isNewer(snapshot, state.newest)) {
            return;
        }

        const queued: IQueuedSnapshot = { attempt: 0, snapshot };
        state.newest = { generation: snapshot.generation, revision: snapshot.revision };
        if (state.active) {
            state.pending = queued;
            return;
        }

        this.start(state, queued);
    }

    public stop(streamId: string): Promise<void> {
        const existing = this.stops.get(streamId);
        if (existing !== undefined) {
            return existing;
        }

        const state = this.streams.get(streamId);
        if (state) {
            state.closed = true;
            state.pending = undefined;
        }

        const cleanup = this.cleanup(streamId, state);
        this.stops.set(streamId, cleanup);
        return cleanup;
    }

    public dispose(): Promise<void> {
        if (this.disposePromise !== undefined) {
            return this.disposePromise;
        }

        this.disposed = true;
        const streamIds = Array.from(this.streams.keys());
        this.disposePromise = Promise.all(streamIds.map((streamId) => this.stop(streamId)))
            .then((): void => undefined);
        return this.disposePromise;
    }

    private async cleanup(streamId: string, state: IStreamState | undefined): Promise<void> {
        try {
            await state?.activePromise;
        } catch {
            // Active publications are contained by start(); this also keeps cleanup best effort.
        }

        try {
            await this.client.deleteStream(streamId);
        } catch {
            // Stream deletion must never affect normal TTS lifecycle cleanup.
        } finally {
            if (state && this.streams.get(streamId) === state) {
                this.streams.delete(streamId);
            }
        }
    }

    private start(state: IStreamState, queued: IQueuedSnapshot): void {
        state.active = queued;
        state.activePromise = this.publish(state, queued).catch((): void => undefined);
    }

    private async publish(state: IStreamState, initial: IQueuedSnapshot): Promise<void> {
        let active = initial;

        while (!state.closed) {
            let result: SnapshotResult | undefined;
            try {
                result = await this.client.putSnapshot(state.streamId, active.snapshot);
            } catch {
                break;
            }

            if (state.closed) {
                break;
            }
            if (result === "disabled") {
                state.closed = true;
                state.pending = undefined;
                break;
            }
            if (result !== "transient-error" || active.attempt === 1 || state.pending) {
                break;
            }

            active = { attempt: 1, snapshot: active.snapshot };
            state.active = active;
        }

        state.active = undefined;
        if (state.closed) {
            state.pending = undefined;
            return;
        }

        const pending = state.pending;
        state.pending = undefined;
        if (pending) {
            this.start(state, pending);
        }
    }
}
