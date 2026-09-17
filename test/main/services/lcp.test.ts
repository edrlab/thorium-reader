import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

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
import { httpGet } from "readium-desktop/main/network/http";

type TPublicationLink = {
    Hash?: string;
    Href?: string;
    Length?: number;
    Type?: string;
};

type TLcpPublicationLink = TPublicationLink & {
    HasRel: (rel: string) => boolean;
};

type TLcpManagerForPublicationArchiveReplacement = {
    replacePublicationArchiveIfLinkChanged: (
        publicationDocument: { customCover?: unknown; identifier: string; title?: string },
        previousLcp: { Links: TLcpPublicationLink[] },
        nextLcp: { Links: TLcpPublicationLink[] },
        nextLcpStr: string,
    ) => Promise<unknown>;
    rollbackPublicationFilesReplacement: (publicationFilesReplacement: unknown) => Promise<void>;
    publicationStorage: {
        getPublicationEpubPath: (identifier: string) => Promise<string>;
        replacePublicationFiles: ReturnType<typeof jest.fn>;
    };
    store: {
        getState: () => { i18n: { locale: string } };
    };
};

type TLcpManagerForSecretAnalytics = {
    consumeDiscoveredPassphraseAnalytics: (
        publicationDocument: { identifier: string; lcp?: { provider?: string } },
        unlockPublicationRes: string | number | null | undefined,
    ) => "valid" | "invalid" | "discovered" | undefined;
    queueDiscoveredPassphraseAnalytics: (
        publicationDocument: { identifier: string; lcp?: { provider?: string } },
    ) => void;
};

const link = (partial: TPublicationLink): TPublicationLink => ({
    Href: "https://example.org/book.epub",
    ...partial,
});

const lcpPublicationLink = (partial: TPublicationLink): TLcpPublicationLink => ({
    ...link(partial),
    HasRel: (rel: string) => rel === "publication",
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

const httpGetMock = httpGet as jest.MockedFunction<typeof httpGet>;

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});

const secretAnalyticsManager = (): TLcpManagerForSecretAnalytics =>
    new LcpManager() as unknown as TLcpManagerForSecretAnalytics;

describe("LcpManager.lcpPublicationLinkResourceChanged", () => {
    it("detects changed publication link hash", () => {
        expect(resourceChanged(link({ Hash: "a".repeat(64) }), link({ Hash: "b".repeat(64) }))).toBe(true);
    });

    it("detects changed publication link length", () => {
        expect(resourceChanged(link({ Length: 10 }), link({ Length: 20 }))).toBe(true);
    });

    it("ignores changed publication link URL", () => {
        expect(
            resourceChanged(
                link({ Href: "https://example.org/book.epub" }),
                link({ Href: "https://cdn.example.org/book.epub" }),
            ),
        ).toBe(false);
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

describe("LcpManager cached passphrase analytics", () => {
    it("consumes a queued discovered passphrase event once after a successful check", () => {
        const manager = secretAnalyticsManager();
        const publicationDocument = {
            identifier: "publication-1",
        };

        manager.queueDiscoveredPassphraseAnalytics(publicationDocument);

        expect(manager.consumeDiscoveredPassphraseAnalytics(publicationDocument, undefined)).toBe("discovered");
        expect(manager.consumeDiscoveredPassphraseAnalytics(publicationDocument, undefined)).toBeUndefined();
    });

    it("does not report unqueued cached passphrase checks", () => {
        const manager = secretAnalyticsManager();
        const publicationDocument = {
            identifier: "publication-1",
        };

        expect(manager.consumeDiscoveredPassphraseAnalytics(
            publicationDocument,
            undefined,
        )).toBeUndefined();
    });

    it("reports a queued discovered passphrase as invalid after a failed check", () => {
        const manager = secretAnalyticsManager();
        const publicationDocument = {
            identifier: "publication-1",
        };

        manager.queueDiscoveredPassphraseAnalytics(publicationDocument);

        expect(manager.consumeDiscoveredPassphraseAnalytics(publicationDocument, 141)).toBe("invalid");
    });

    it("clears queued discovered analytics when no secret was checked", () => {
        const manager = secretAnalyticsManager();
        const publicationDocument = {
            identifier: "publication-1",
        };

        manager.queueDiscoveredPassphraseAnalytics(publicationDocument);

        expect(manager.consumeDiscoveredPassphraseAnalytics(publicationDocument, null)).toBeUndefined();
        expect(manager.consumeDiscoveredPassphraseAnalytics(publicationDocument, undefined)).toBeUndefined();
    });

    it("does not consume a queued discovered passphrase for another publication", () => {
        const manager = secretAnalyticsManager();

        manager.queueDiscoveredPassphraseAnalytics({
            identifier: "publication-1",
        });

        expect(manager.consumeDiscoveredPassphraseAnalytics(
            {
                identifier: "publication-2",
            },
            undefined,
        )).toBeUndefined();
    });
});

describe("LcpManager.replacePublicationArchiveIfLinkChanged", () => {
    it("runs rollback guard and does not stage file replacement when the archive HTTP download fails", async () => {
        httpGetMock.mockResolvedValue({
            body: undefined,
            contentType: undefined,
            isFailure: true,
            isSuccess: false,
            statusCode: 503,
            statusMessage: "Service Unavailable",
            url: "https://cdn.example.org/book.epub",
        });

        const replacePublicationFiles = jest.fn();
        const manager = Object.create(LcpManager.prototype) as TLcpManagerForPublicationArchiveReplacement;
        manager.publicationStorage = {
            getPublicationEpubPath: jest.fn(async () => "C:\\books\\current.epub"),
            replacePublicationFiles,
        };
        manager.store = {
            getState: () => ({
                i18n: {
                    locale: "en",
                },
            }),
        };
        const rollbackSpy = jest.spyOn(manager, "rollbackPublicationFilesReplacement");

        await expect(
            manager.replacePublicationArchiveIfLinkChanged(
                {
                    identifier: "publication-1",
                    title: "Existing publication",
                },
                {
                    Links: [
                        lcpPublicationLink({
                            Hash: "a".repeat(64),
                        }),
                    ],
                },
                {
                    Links: [
                        lcpPublicationLink({
                            Hash: "b".repeat(64),
                            Href: "https://cdn.example.org/book.epub",
                        }),
                    ],
                },
                "{}",
            ),
        ).rejects.toThrow("LCP publication download failed: Service Unavailable (503)");

        expect(replacePublicationFiles).not.toHaveBeenCalled();
        expect(rollbackSpy).toHaveBeenCalledWith(undefined);
        expect(httpGetMock).toHaveBeenCalledWith(
            "https://cdn.example.org/book.epub",
            expect.objectContaining({
                abortController: expect.any(AbortController),
                signal: expect.any(AbortSignal),
            }),
            undefined,
            "en",
        );
    });
});
