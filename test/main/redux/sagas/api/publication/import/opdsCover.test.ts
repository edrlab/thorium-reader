import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("readium-desktop/main/network/http", () => ({
    httpGet: jest.fn(),
}));

import type { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { httpGet } from "readium-desktop/main/network/http";
import {
    downloadOpdsCoverData,
    selectOpdsCoverLink,
} from "readium-desktop/main/redux/sagas/api/publication/import/opdsCover";

const mockedHttpGet = jest.mocked(httpGet);

const publicationWithCover = (
    coverLinks: IOpdsPublicationView["cover"]["coverLinks"],
    thumbnailLinks: IOpdsPublicationView["cover"]["thumbnailLinks"],
): IOpdsPublicationView =>
    ({
        cover: {
            coverLinks,
            thumbnailLinks,
        },
    }) as IOpdsPublicationView;

describe("OPDS imported publication cover", () => {
    beforeEach(() => {
        mockedHttpGet.mockReset();
    });

    it("prefers the full-size OPDS cover over its thumbnail", () => {
        const fullSize = { url: "https://example.com/cover.jpg", type: "image/jpeg" };
        const thumbnail = { url: "https://example.com/thumbnail.jpg", type: "image/jpeg" };

        expect(selectOpdsCoverLink(publicationWithCover([fullSize], [thumbnail]))).toBe(fullSize);
    });

    it("falls back to the OPDS thumbnail", () => {
        const thumbnail = { url: "https://example.com/thumbnail.png", type: "image/png" };

        expect(selectOpdsCoverLink(publicationWithCover([], [thumbnail]))).toBe(thumbnail);
    });

    it("downloads image data using the response content type", async () => {
        const buffer = Buffer.from("png-cover");
        mockedHttpGet.mockResolvedValue({
            body: Readable.from([buffer]),
            contentType: "image/png; charset=binary",
            isFailure: false,
            isSuccess: true,
            url: "https://example.com/cover",
        });

        await expect(
            downloadOpdsCoverData({
                url: "https://example.com/cover",
            }),
        ).resolves.toEqual({
            buffer,
            contentType: "image/png",
            ext: "png",
        });
        expect(mockedHttpGet).toHaveBeenCalledWith(new URL("https://example.com/cover"));
    });

    it("uses OPDS image metadata for a generic binary response", async () => {
        const buffer = Buffer.from("jpeg-cover");
        mockedHttpGet.mockResolvedValue({
            body: Readable.from([buffer]),
            contentType: "application/octet-stream",
            isFailure: false,
            isSuccess: true,
            url: "https://example.com/cover",
        });

        await expect(
            downloadOpdsCoverData({
                type: "image/jpeg",
                url: "https://example.com/cover",
            }),
        ).resolves.toEqual({
            buffer,
            contentType: "image/jpeg",
            ext: "jpeg",
        });
    });

    it("normalizes a non-standard image media type from the URL extension", async () => {
        const buffer = Buffer.from("jpeg-cover");
        mockedHttpGet.mockResolvedValue({
            body: Readable.from([buffer]),
            contentType: "image/jpg",
            isFailure: false,
            isSuccess: true,
            url: "https://example.com/cover.jpg",
        });

        await expect(
            downloadOpdsCoverData({
                url: "https://example.com/cover.jpg",
            }),
        ).resolves.toEqual({
            buffer,
            contentType: "image/jpeg",
            ext: "jpg",
        });
    });

    it("rejects a successful non-image response", async () => {
        mockedHttpGet.mockResolvedValue({
            body: Readable.from([Buffer.from("not-an-image")]),
            contentType: "text/html",
            isFailure: false,
            isSuccess: true,
            url: "https://example.com/cover.jpg",
        });

        await expect(
            downloadOpdsCoverData({
                type: "image/jpeg",
                url: "https://example.com/cover.jpg",
            }),
        ).resolves.toBeUndefined();
    });
});
