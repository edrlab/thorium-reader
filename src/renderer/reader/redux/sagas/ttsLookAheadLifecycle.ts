// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { ITtsLookAheadSnapshot } from "@r2-navigator-js/electron/common/tts-lookahead";
import type { TTSStateEnum } from "@r2-navigator-js/electron/renderer/readaloud";
import type { TtsLookAheadSession } from "readium-desktop/renderer/reader/ttsLookAhead";
import { buffers, type EventChannel, eventChannel } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, take } from "redux-saga/effects";

type TTSLookAheadLifecycleEvent =
    | { state: TTSStateEnum; type: "state" }
    | { snapshot: ITtsLookAheadSnapshot; type: "snapshot" };

export interface ITTSLookAheadLifecycleDependencies {
    addBeforeUnload: (listener: () => void) => void;
    createSession: () => TtsLookAheadSession;
    listenLookAhead: (listener: ((snapshot: ITtsLookAheadSnapshot) => void) | undefined) => void;
    listenState: (listener: (state: TTSStateEnum) => void) => void;
    platform: NodeJS.Platform;
    removeBeforeUnload: (listener: () => void) => void;
}

export interface ITTSLookAheadLifecycle {
    channel: EventChannel<TTSLookAheadLifecycleEvent>;
    session?: TtsLookAheadSession;
}

export function createTTSLookAheadLifecycle(
    dependencies: ITTSLookAheadLifecycleDependencies,
): ITTSLookAheadLifecycle {
    const session = dependencies.platform === "win32" ? dependencies.createSession() : undefined;
    let closeChannel = (): void => undefined;
    const channel = eventChannel<TTSLookAheadLifecycleEvent>(
        (emit) => {
            dependencies.listenState((state) => emit({ state, type: "state" }));
            if (!session) {
                return () => undefined;
            }

            const close = () => closeChannel();
            dependencies.listenLookAhead((snapshot) => emit({ snapshot, type: "snapshot" }));
            dependencies.addBeforeUnload(close);
            return () => {
                dependencies.removeBeforeUnload(close);
                dependencies.listenLookAhead(undefined);
                try {
                    session.dispose();
                } catch {
                    // Look-ahead cleanup must not affect ordinary speech synthesis.
                }
            };
        },
        buffers.expanding(10),
    );
    closeChannel = () => channel.close();
    return { channel, session };
}

export function* watchTTSLookAheadLifecycle(
    lifecycle: ITTSLookAheadLifecycle,
    onState: (state: TTSStateEnum) => unknown,
) {
    try {
        while (true) {
            const event: TTSLookAheadLifecycleEvent = yield take(lifecycle.channel);
            if (event.type === "snapshot") {
                try {
                    lifecycle.session?.onSnapshot(event.snapshot);
                } catch {
                    // Look-ahead must remain isolated from ordinary speech synthesis.
                }
                continue;
            }

            try {
                lifecycle.session?.onState(event.state);
            } catch {
                // Adapter failures must not prevent ordinary TTS state updates.
            }
            try {
                yield call(onState, event.state);
            } catch {
                // Preserve the existing fail-open state-listener behavior.
            }
        }
    } finally {
        lifecycle.channel.close();
    }
}
