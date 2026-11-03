import { describe, expect, it } from "@jest/globals";
import { isAudiobookResource } from "@r2-navigator-js/electron/renderer/common/audiobook-resource";

describe("audiobook resource playback selection", () => {
    it.each(["http", "https"])("recognizes M4A fallback for %s audiobook metadata", (scheme) => {
        const type = `${scheme}://schema.org/Audiobook`;
        expect(isAudiobookResource(type, undefined, "chapter.m4a")).toBe(true);
        expect(isAudiobookResource(type, "video/mp4", "chapter.M4A")).toBe(true);
        expect(isAudiobookResource(type, "audio/mp4", "chapter.m4a")).toBe(true);
    });

    it.each([undefined, "http://schema.org/Book", "http://schema.org/book"])("keeps ebooks outside audiobook playback: %s", (type) => {
        expect(isAudiobookResource(type, "audio/mp4", "chapter.m4a")).toBe(false);
    });

    it("retains explicit audio media types and existing extension fallbacks", () => {
        const type = "http://schema.org/Audiobook";
        expect(isAudiobookResource(type, "audio/mp4", "chapter")).toBe(true);
        for (const ext of ["mp3", "mp4", "wav", "aac", "ogg", "ogb", "oga", "aiff", "wma", "flac"]) {
            expect(isAudiobookResource(type, undefined, `chapter.${ext}`)).toBe(true);
        }
        expect(isAudiobookResource(type, "video/mp4", "chapter.webm")).toBe(false);
    });
});
