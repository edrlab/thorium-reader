import { expect, test } from "@jest/globals";

import type { ITtsLookAheadSnapshot } from "@r2-navigator-js/electron/common/tts-lookahead";
import type { TTSStateEnum } from "@r2-navigator-js/electron/renderer/readaloud";
import { TTS_LOOK_AHEAD_CHANNEL, type ITtsLookAheadMessage } from "readium-desktop/common/ipc/ttsLookAhead";
import {
    TtsLookAheadSession,
    isVoiceLinkVoice,
    toVoiceLinkSnapshot,
} from "readium-desktop/renderer/reader/ttsLookAhead";

const PAUSED = "PAUSED" as TTSStateEnum;
const PLAYING = "PLAYING" as TTSStateEnum;
const STOPPED = "STOPPED" as TTSStateEnum;

function richSnapshot(): ITtsLookAheadSnapshot {
    return {
        currentSequence: 41,
        generation: 7,
        revision: 13,
        source: {
            lang: "en-GB",
            rate: 1.25,
            voiceName: "Emma (Kokoro)",
            voiceURI: "HKEY_LOCAL_MACHINE/Voices/Tokens/VoiceLink_bf_emma",
        },
        units: [
            {
                block: {
                    ariaRole: "heading",
                    epubTypes: ["chapter", "title"],
                    headingLevel: 2,
                    htmlTag: "h2",
                    id: "7:3",
                    kind: "heading",
                },
                boundaryAfter: "heading-to-body",
                boundaryBefore: "section",
                direction: "ltr",
                lang: "en-GB",
                position: {
                    firstInBlock: true,
                    indexInBlock: 0,
                    lastInBlock: true,
                },
                sequence: 41,
                text: "Chapter heading",
            },
            {
                block: {
                    id: "7:4",
                    kind: "paragraph",
                },
                boundaryAfter: "sentence",
                boundaryBefore: "heading-to-body",
                position: {
                    firstInBlock: true,
                    indexInBlock: 0,
                    lastInBlock: false,
                },
                sequence: 42,
                text: "First sentence.",
            },
        ],
    };
}

function cloneSnapshot(snapshot: ITtsLookAheadSnapshot): ITtsLookAheadSnapshot {
    return JSON.parse(JSON.stringify(snapshot)) as ITtsLookAheadSnapshot;
}

function createHarness(ids: string[] = ["stream-1", "stream-2"]): {
    messages: Array<{ channel: string; message: ITtsLookAheadMessage }>;
    session: TtsLookAheadSession;
} {
    const messages: Array<{ channel: string; message: ITtsLookAheadMessage }> = [];
    let nextId = 0;
    const session = new TtsLookAheadSession({
        createStreamId: () => ids[nextId++],
        send: (channel, message) => messages.push({ channel, message }),
    });
    return { messages, session };
}

test("maps every protocol 1 field without mutating the R2 snapshot", () => {
    const source = richSnapshot();
    const before = cloneSnapshot(source);

    const mapped = toVoiceLinkSnapshot(source);

    expect(mapped).toStrictEqual({
        currentSequence: 41,
        generation: 7,
        protocol: 1,
        revision: 13,
        source: {
            lang: "en-GB",
            rate: 1.25,
            voiceName: "Emma (Kokoro)",
            voiceURI: "HKEY_LOCAL_MACHINE/Voices/Tokens/VoiceLink_bf_emma",
        },
        units: [
            {
                block: {
                    ariaRole: "heading",
                    epubTypes: ["chapter", "title"],
                    headingLevel: 2,
                    htmlTag: "h2",
                    id: "7:3",
                    kind: "heading",
                },
                boundaryAfter: "heading-to-body",
                boundaryBefore: "section",
                direction: "ltr",
                lang: "en-GB",
                position: {
                    firstInBlock: true,
                    indexInBlock: 0,
                    lastInBlock: true,
                },
                sequence: 41,
                text: "Chapter heading",
            },
            {
                block: {
                    id: "7:4",
                    kind: "paragraph",
                },
                boundaryAfter: "sentence",
                boundaryBefore: "heading-to-body",
                position: {
                    firstInBlock: true,
                    indexInBlock: 0,
                    lastInBlock: false,
                },
                sequence: 42,
                text: "First sentence.",
            },
        ],
    });
    expect(source).toStrictEqual(before);
});

test("omits optional protocol fields whose R2 values are undefined", () => {
    const source = richSnapshot();
    source.source = { rate: 1 };
    source.units[0] = {
        block: { id: "7:3", kind: "heading" },
        boundaryAfter: "document",
        boundaryBefore: "document",
        position: { firstInBlock: true, indexInBlock: 0, lastInBlock: true },
        sequence: 41,
        text: "Chapter heading",
    };
    source.units.length = 1;

    const mapped = toVoiceLinkSnapshot(source);

    expect(mapped).toStrictEqual({
        currentSequence: 41,
        generation: 7,
        protocol: 1,
        revision: 13,
        source: { rate: 1 },
        units: [
            {
                block: { id: "7:3", kind: "heading" },
                boundaryAfter: "document",
                boundaryBefore: "document",
                position: { firstInBlock: true, indexInBlock: 0, lastInBlock: true },
                sequence: 41,
                text: "Chapter heading",
            },
        ],
    });
    expect(Object.hasOwn(mapped, "synthesisHint")).toBe(false);
    expect(Object.hasOwn(mapped.source, "voiceName")).toBe(false);
    expect(Object.hasOwn(mapped.source, "voiceURI")).toBe(false);
    expect(Object.hasOwn(mapped.source, "lang")).toBe(false);
    expect(Object.hasOwn(mapped.units[0], "lang")).toBe(false);
    expect(Object.hasOwn(mapped.units[0], "direction")).toBe(false);
    expect(Object.hasOwn(mapped.units[0].block, "htmlTag")).toBe(false);
    expect(Object.hasOwn(mapped.units[0].block, "headingLevel")).toBe(false);
    expect(Object.hasOwn(mapped.units[0].block, "epubTypes")).toBe(false);
    expect(Object.hasOwn(mapped.units[0].block, "ariaRole")).toBe(false);
});

test("activates from the case-sensitive VoiceLink token URI independently of its localized name", () => {
    expect(
        isVoiceLinkVoice({
            voiceName: "Emma (Kokoro)",
            voiceURI: "HKEY_LOCAL_MACHINE/Voices/Tokens/VoiceLink_bf_emma",
        }),
    ).toBe(true);
    expect(
        isVoiceLinkVoice({
            voiceName: "Emma (Kokoro)",
            voiceURI: "HKEY_LOCAL_MACHINE/Voices/Tokens/Microsoft_Emma",
        }),
    ).toBe(false);
    expect(
        isVoiceLinkVoice({
            voiceName: "VoiceLink Emma",
            voiceURI: "HKEY_LOCAL_MACHINE/Voices/Tokens/voicelink_bf_emma",
        }),
    ).toBe(false);
});

test.each([
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
])("activates when Windows mirrors the registered VoiceLink display name as %s", (displayName) => {
    expect(
        isVoiceLinkVoice({
            voiceName: displayName,
            voiceURI: displayName,
        }),
    ).toBe(true);
});

test.each([
    ["Alice (Kokoro)", "Alice (Kokoro)"],
    ["Adam (Kokoro)", "HKEY_LOCAL_MACHINE/Voices/Tokens/Microsoft_Adam"],
    ["VoiceLink Adam", "VoiceLink Adam"],
])("rejects a plausible non-VoiceLink display-name shape", (voiceName, voiceURI) => {
    expect(isVoiceLinkVoice({ voiceName, voiceURI })).toBe(false);
});

test("starts lazily from an eligible snapshot before PLAYING and retains its stream while paused", () => {
    const { messages, session } = createHarness();
    const first = richSnapshot();
    const second = richSnapshot();
    second.revision = 14;

    session.onSnapshot(first);
    session.onState(PLAYING);
    session.onState(PAUSED);
    session.onState(PLAYING);
    session.onSnapshot(second);

    expect(messages).toEqual([
        {
            channel: TTS_LOOK_AHEAD_CHANNEL,
            message: { snapshot: toVoiceLinkSnapshot(first), streamId: "stream-1", type: "snapshot" },
        },
        {
            channel: TTS_LOOK_AHEAD_CHANNEL,
            message: { snapshot: toVoiceLinkSnapshot(second), streamId: "stream-1", type: "snapshot" },
        },
    ]);
});

test("stops once on STOPPED and gives the next eligible session a new stream ID", () => {
    const { messages, session } = createHarness();
    const snapshot = richSnapshot();

    session.onSnapshot(snapshot);
    session.onState(STOPPED);
    session.onState(STOPPED);
    session.onSnapshot(snapshot);

    expect(messages.map(({ message }) => message)).toEqual([
        { snapshot: toVoiceLinkSnapshot(snapshot), streamId: "stream-1", type: "snapshot" },
        { streamId: "stream-1", type: "stop" },
        { snapshot: toVoiceLinkSnapshot(snapshot), streamId: "stream-2", type: "snapshot" },
    ]);
});

test("never sends non-VoiceLink data and ends an active stream when the provider changes", () => {
    const { messages, session } = createHarness();
    const voiceLink = richSnapshot();
    const otherProvider = richSnapshot();
    otherProvider.source.voiceURI = "HKEY_LOCAL_MACHINE/Voices/Tokens/Microsoft_Emma";
    otherProvider.units[0].text = "Must not cross IPC";

    session.onSnapshot(otherProvider);
    session.onSnapshot(voiceLink);
    session.onSnapshot(otherProvider);
    session.onSnapshot(otherProvider);

    expect(messages.map(({ message }) => message)).toEqual([
        { snapshot: toVoiceLinkSnapshot(voiceLink), streamId: "stream-1", type: "snapshot" },
        { streamId: "stream-1", type: "stop" },
    ]);
});

test("dispose safely stops an active stream once and ignores later lifecycle events", () => {
    const { messages, session } = createHarness();
    const snapshot = richSnapshot();

    session.onSnapshot(snapshot);
    session.dispose();
    session.dispose();
    session.onState(STOPPED);
    session.onSnapshot(snapshot);

    expect(messages.map(({ message }) => message)).toEqual([
        { snapshot: toVoiceLinkSnapshot(snapshot), streamId: "stream-1", type: "snapshot" },
        { streamId: "stream-1", type: "stop" },
    ]);
});
