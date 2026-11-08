// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type {
    ITtsLookAheadBlock,
    ITtsLookAheadSnapshot,
    ITtsLookAheadSource,
    ITtsLookAheadUnit,
} from "@r2-navigator-js/electron/common/tts-lookahead";
import type { TTSStateEnum } from "@r2-navigator-js/electron/renderer/readaloud";

import {
    TTS_LOOK_AHEAD_CHANNEL,
    type ITtsLookAheadMessage,
    type IVoiceLinkBlock,
    type IVoiceLinkSnapshot,
    type IVoiceLinkSource,
    type IVoiceLinkUnit,
} from "readium-desktop/common/ipc/ttsLookAhead";

export interface ITtsLookAheadSessionDependencies {
    createStreamId: () => string;
    send: (channel: string, message: ITtsLookAheadMessage) => void;
}

const VOICELINK_DISPLAY_NAMES = new Set([
    "Heart (Kokoro)",
    "Bella (Kokoro)",
    "Nicole (Kokoro)",
    "Sarah (Kokoro)",
    "Sky (Kokoro)",
    "Adam (Kokoro)",
    "Michael (Kokoro)",
    "Emma (Kokoro)",
    "Isabella (Kokoro)",
    "George (Kokoro)",
    "Lewis (Kokoro)",
]);

export function isVoiceLinkVoice(
    source: Pick<ITtsLookAheadSource, "voiceName" | "voiceURI"> | undefined,
): boolean {
    const voiceURI = source?.voiceURI || "";
    return (
        /(?:^|[^A-Za-z0-9])VoiceLink_[A-Za-z0-9][A-Za-z0-9._-]*/.test(voiceURI) ||
        (source?.voiceName === voiceURI && VOICELINK_DISPLAY_NAMES.has(voiceURI))
    );
}

type TtsLookAheadVoice = Pick<SpeechSynthesisVoice, "name" | "voiceURI">;

export function shouldEnableVoiceLinkLookAhead(
    platform: NodeJS.Platform,
    voices: ReadonlyArray<TtsLookAheadVoice> | TtsLookAheadVoice | null | undefined,
): boolean {
    if (platform !== "win32" || !voices) {
        return false;
    }
    const candidates = Array.isArray(voices) ? voices : [voices];
    return candidates.some((voice) => isVoiceLinkVoice({ voiceName: voice.name, voiceURI: voice.voiceURI }));
}

function toVoiceLinkSource(source: ITtsLookAheadSource): IVoiceLinkSource {
    return {
        rate: source.rate,
        ...(source.voiceName === undefined ? {} : { voiceName: source.voiceName }),
        ...(source.voiceURI === undefined ? {} : { voiceURI: source.voiceURI }),
        ...(source.lang === undefined ? {} : { lang: source.lang }),
    };
}

function toVoiceLinkBlock(block: ITtsLookAheadBlock): IVoiceLinkBlock {
    return {
        id: block.id,
        kind: block.kind,
        ...(block.htmlTag === undefined ? {} : { htmlTag: block.htmlTag }),
        ...(block.headingLevel === undefined ? {} : { headingLevel: block.headingLevel }),
        ...(block.epubTypes === undefined ? {} : { epubTypes: [...block.epubTypes] }),
        ...(block.ariaRole === undefined ? {} : { ariaRole: block.ariaRole }),
    };
}

function toVoiceLinkUnit(unit: ITtsLookAheadUnit): IVoiceLinkUnit {
    return {
        block: toVoiceLinkBlock(unit.block),
        boundaryAfter: unit.boundaryAfter,
        boundaryBefore: unit.boundaryBefore,
        ...(unit.direction === undefined ? {} : { direction: unit.direction }),
        ...(unit.lang === undefined ? {} : { lang: unit.lang }),
        position: {
            firstInBlock: unit.position.firstInBlock,
            indexInBlock: unit.position.indexInBlock,
            lastInBlock: unit.position.lastInBlock,
        },
        sequence: unit.sequence,
        text: unit.text,
    };
}

export function toVoiceLinkSnapshot(snapshot: ITtsLookAheadSnapshot): IVoiceLinkSnapshot {
    return {
        currentSequence: snapshot.currentSequence,
        generation: snapshot.generation,
        protocol: 1,
        revision: snapshot.revision,
        source: toVoiceLinkSource(snapshot.source),
        units: snapshot.units.map(toVoiceLinkUnit),
    };
}

export class TtsLookAheadSession {
    private disposed = false;
    private streamId: string | undefined;

    public constructor(private readonly dependencies: ITtsLookAheadSessionDependencies) {
    }

    public onState(state: TTSStateEnum): void {
        if (this.disposed) {
            return;
        }
        if (state === "STOPPED") {
            this.stop();
        }
    }

    public onSnapshot(snapshot: ITtsLookAheadSnapshot): void {
        if (this.disposed) {
            return;
        }
        if (!isVoiceLinkVoice(snapshot.source)) {
            this.stop();
            return;
        }
        const streamId = this.streamId || this.dependencies.createStreamId();
        this.streamId = streamId;
        this.dependencies.send(TTS_LOOK_AHEAD_CHANNEL, {
            snapshot: toVoiceLinkSnapshot(snapshot),
            streamId,
            type: "snapshot",
        });
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.stop();
        this.disposed = true;
    }

    private stop(): void {
        if (this.streamId === undefined) {
            return;
        }
        const streamId = this.streamId;
        this.streamId = undefined;
        this.dependencies.send(TTS_LOOK_AHEAD_CHANNEL, {
            streamId,
            type: "stop",
        });
    }
}
