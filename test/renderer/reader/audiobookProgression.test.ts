import { expect, test } from "@jest/globals";
import type { IAudioPlaybackInfo } from "@r2-navigator-js/electron/common/audiobook";
import { completeAudiobookProgression } from "readium-desktop/renderer/reader/audiobookProgression";

const info: IAudioPlaybackInfo = {
    globalDuration: undefined,
    globalTime: undefined,
    globalProgression: undefined,
    localDuration: 200,
    localTime: 50,
    localProgression: 0.25,
    isPlaying: true,
};

test("recovers missing global progress from track durations and playback time", () => {
    const result = completeAudiobookProgression(info, "second.mp3", [
        { Href: "first.mp3", Duration: 100 },
        { Href: "second.mp3", Duration: 200 },
    ]);
    expect(result.globalDuration).toBe(300);
    expect(result.globalTime).toBe(150);
    expect(result.globalProgression).toBe(0.5);
    expect(info.globalTime).toBeUndefined();
});

test("uses the audio element duration when the current track metadata is absent", () => {
    expect(completeAudiobookProgression(info, "first.mp3", [
        { Href: "first.mp3" },
        { Href: "second.mp3", Duration: 100 },
    ]).globalDuration).toBe(300);
});

test("does not invent total progress when another track duration is unknown", () => {
    expect(completeAudiobookProgression(info, "second.mp3", [
        { Href: "first.mp3" }, { Href: "second.mp3", Duration: 200 },
    ])).toBe(info);
});

test("preserves valid navigator progress", () => {
    const valid = { ...info, globalDuration: 500, globalTime: 0, globalProgression: 0 };
    expect(completeAudiobookProgression(valid, "first.mp3", [{ Href: "first.mp3" }])).toBe(valid);
});

test("rejects invalid durations and unknown tracks", () => {
    expect(completeAudiobookProgression(info, "second.mp3", [
        { Href: "first.mp3", Duration: NaN }, { Href: "second.mp3", Duration: 200 },
    ])).toBe(info);
    expect(completeAudiobookProgression(info, "unknown.mp3", [{ Href: "first.mp3", Duration: 100 }])).toBe(info);
});
