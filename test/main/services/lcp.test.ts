import { describe, expect, it, jest } from "@jest/globals";

jest.mock("electron", () => ({
    app: {
        getPath: (): string => "",
    },
    dialog: {
        showOpenDialog: jest.fn(),
    },
    shell: {
        openExternal: jest.fn(),
    },
}));

jest.mock("inversify", () => ({
    inject: () => (): void => undefined,
    injectable:
        () =>
        <T>(target: T): T =>
            target,
}));

jest.mock("../../../src/main/di", () => ({
    diMainGet: jest.fn(),
    lcpHashesFilePath: "",
}));

jest.mock("../../../src/main/redux/sagas/reader", () => ({
    RequesetToCloseAllReadersWithTheSamePubId: {},
}));

jest.mock("readium-desktop/main/converter/publication", () => ({
    PublicationViewConverter: class PublicationViewConverter {},
}));

jest.mock("readium-desktop/main/db/repository/publication", () => ({
    PublicationRepository: class PublicationRepository {},
}));

jest.mock("readium-desktop/main/storage/publication-storage", () => ({
    PublicationStorage: class PublicationStorage {},
}));

jest.mock("readium-desktop/main/network/http", () => ({
    httpGet: jest.fn(),
}));

jest.mock("readium-desktop/main/streamer/streamerNoHttp", () => ({
    streamerCachedPublication: jest.fn(),
}));

import { LcpManager } from "readium-desktop/main/services/lcp";

type TPublicationLink = {
    Hash?: string;
    Href?: string;
    Length?: number;
};

const link = (partial: TPublicationLink): TPublicationLink => ({
    Href: "https://example.org/book.epub",
    ...partial,
});

const resourceChanged = (
    previousLink: TPublicationLink | undefined,
    nextLink: TPublicationLink | undefined,
): boolean => {
    const manager = Object.create(LcpManager.prototype) as {
        lcpPublicationLinkResourceChanged: (
            previousLink: TPublicationLink | undefined,
            nextLink: TPublicationLink | undefined,
        ) => boolean;
    };

    return manager.lcpPublicationLinkResourceChanged(previousLink, nextLink);
};

describe("LcpManager.lcpPublicationLinkResourceChanged", () => {
    it("detects changed publication link hash", () => {
        expect(resourceChanged(link({ Hash: "a".repeat(64) }), link({ Hash: "b".repeat(64) }))).toBe(true);
    });

    it("detects changed publication link length", () => {
        expect(resourceChanged(link({ Length: 10 }), link({ Length: 20 }))).toBe(true);
    });

    it("detects changed publication link URL", () => {
        expect(
            resourceChanged(
                link({ Href: "https://example.org/book.epub" }),
                link({ Href: "https://cdn.example.org/book.epub" }),
            ),
        ).toBe(true);
    });

    it("ignores unchanged publication resource metadata", () => {
        expect(
            resourceChanged(
                link({
                    Hash: "a".repeat(64),
                    Length: 10,
                }),
                link({
                    Hash: "a".repeat(64),
                    Length: 10,
                }),
            ),
        ).toBe(false);
    });

    it("does not treat missing previous link as replaceable", () => {
        expect(resourceChanged(undefined, link({ Href: "https://cdn.example.org/book.epub" }))).toBe(false);
    });
});
