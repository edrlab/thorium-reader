import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Readable } from "node:stream";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { Transformers } from "@r2-shared-js/transform/transformer";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";
import { transformPublicationStream } from "readium-desktop/main/streamer/transformPublicationStream";

const content = Buffer.from(Array.from({ length: 262144 }, (_, i) => i % 251));
const publication = new Publication();
const restrictedLink = TaJsonDeserialize({
    href: "audio.mp4",
    type: "audio/mp4",
    properties: {
        encrypted: {
            scheme: "http://www.feedbooks.com/audiobooks/access-restriction",
            profile: "https://www.cantookaudio.com",
        },
    },
}, Link);

function fullStream(): IStreamAndLength {
    return {
        length: content.length,
        stream: Readable.from(Array.from({ length: 4 }, (_, i) => content.subarray(i * 65536, (i + 1) * 65536))),
        reset: async () => fullStream(),
    };
}

afterEach(() => jest.restoreAllMocks());

describe("transformPublicationStream", () => {
    it.each([[0, 63], [198765, 198828], [198765, -1]])(
        "slices an untransformed access-restricted stream to bytes %i-%i",
        async (begin, end) => {
            const result = await transformPublicationStream(publication, restrictedLink, undefined,
                fullStream(), true, begin, end, undefined);
            const expected = content.subarray(begin, end < 0 ? undefined : end + 1);
            expect(await streamToBufferPromise(result.stream)).toEqual(expected);
            expect(result.length).toBe(content.length);
            expect(await streamToBufferPromise((await result.reset()).stream)).toEqual(expected);
        },
    );

    it("preserves a full response without a Range request", async () => {
        const original = fullStream();
        const result = await transformPublicationStream(publication, restrictedLink, undefined,
            original, false, 0, -1, undefined);
        expect(result).toBe(original);
        expect(await streamToBufferPromise(result.stream)).toEqual(content);
    });

    it("does not slice an ordinary ZIP range a second time", async () => {
        const link = TaJsonDeserialize({ href: "audio.mp4", type: "audio/mp4" }, Link);
        const original = { ...fullStream(), stream: Readable.from([content.subarray(198765, 198829)]) };
        const result = await transformPublicationStream(publication, link, undefined,
            original, true, 198765, 198828, undefined);
        expect(result).toBe(original);
        expect(await streamToBufferPromise(result.stream)).toEqual(content.subarray(198765, 198829));
    });

    it("preserves the range produced by a decryption transformer", async () => {
        const decrypted = { ...fullStream(), stream: Readable.from([content.subarray(198765, 198829)]) };
        jest.spyOn(Transformers, "tryStream").mockResolvedValue(decrypted);
        const result = await transformPublicationStream(publication, restrictedLink, undefined,
            fullStream(), true, 198765, 198828, undefined);
        expect(result).toBe(decrypted);
        expect(await streamToBufferPromise(result.stream)).toEqual(content.subarray(198765, 198829));
    });
});
