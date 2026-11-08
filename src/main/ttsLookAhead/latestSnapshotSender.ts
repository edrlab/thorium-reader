// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IVoiceLinkSnapshot } from "readium-desktop/common/ipc/ttsLookAhead";
import type { VoiceLinkClient } from "readium-desktop/main/ttsLookAhead/voiceLinkClient";

const DEFAULT_MAX_STOPPED_STREAMS = 256;

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
    private readonly activeStops = new Map<string, Promise<void>>();
    private disposePromise?: Promise<void>;
    private disposed = false;
    private readonly maxStoppedStreams: number;
    private readonly stoppedStreams = new Map<string, true>();
    private readonly streams = new Map<string, IStreamState>();

    public constructor(
        private readonly client: Pick<VoiceLinkClient, "putSnapshot" | "deleteStream">,
        maxStoppedStreams = DEFAULT_MAX_STOPPED_STREAMS,
    ) {
        this.maxStoppedStreams = Math.max(1, Math.floor(maxStoppedStreams));
    }

    public enqueue(streamId: string, snapshot: IVoiceLinkSnapshot): void {
        if (this.disposed || this.activeStops.has(streamId) || this.stoppedStreams.has(streamId)) {
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
        if (this.disposed) {
            return this.disposePromise ?? Promise.resolve();
        }

        return this.stopStream(streamId);
    }

    public dispose(): Promise<void> {
        if (this.disposePromise !== undefined) {
            return this.disposePromise;
        }

        this.disposed = true;
        const cleanups = Array.from(this.activeStops.values());
        for (const streamId of this.streams.keys()) {
            if (!this.activeStops.has(streamId)) {
                cleanups.push(this.stopStream(streamId));
            }
        }
        this.disposePromise = Promise.all(cleanups).then((): void => undefined);
        return this.disposePromise;
    }

    private stopStream(streamId: string): Promise<void> {
        const existing = this.activeStops.get(streamId);
        if (existing !== undefined) {
            return existing;
        }
        if (this.stoppedStreams.has(streamId)) {
            this.rememberStopped(streamId);
            return Promise.resolve();
        }

        const state = this.streams.get(streamId);
        if (state) {
            state.closed = true;
            state.pending = undefined;
        }

        this.rememberStopped(streamId);
        const cleanup = this.cleanup(streamId, state).finally(() => {
            this.activeStops.delete(streamId);
        });
        this.activeStops.set(streamId, cleanup);
        return cleanup;
    }

    private rememberStopped(streamId: string): void {
        this.stoppedStreams.delete(streamId);
        this.stoppedStreams.set(streamId, true);
        while (this.stoppedStreams.size > this.maxStoppedStreams) {
            const oldest = this.stoppedStreams.keys().next().value;
            if (oldest === undefined) {
                break;
            }
            this.stoppedStreams.delete(oldest);
        }
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
