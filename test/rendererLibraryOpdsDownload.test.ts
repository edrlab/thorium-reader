import { expect, test } from "@jest/globals";

import { downloadActions } from "readium-desktop/common/redux/actions";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import {
    isDownloadUrlActive,
    isOpdsPublicationDownloading,
} from "readium-desktop/renderer/library/opds/download";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

type TDownloadState = TPQueueState<downloadActions.progress.Payload, number>;

const createDownloadState = (...downloadUrls: string[]): TDownloadState => downloadUrls.map((url, index) => [{
    contentLengthHumanReadable: "",
    downloadLabel: url,
    downloadUrls: [url],
    id: index + 1,
    progress: 50,
    speed: 0,
}, index + 1]);

const createPublication = (
    openAccessUrls: string[] = [],
    sampleUrls: string[] = [],
): IOpdsPublicationView => ({
    openAccessLinks: openAccessUrls.map((url) => ({ url })),
    sampleOrPreviewLinks: sampleUrls.map((url) => ({ url })),
} as IOpdsPublicationView);

test("matches an active download URL", () => {
    const downloads = createDownloadState("https://example.com/book.epub");

    expect(isDownloadUrlActive(downloads, "https://example.com/book.epub")).toBe(true);
    expect(isDownloadUrlActive(downloads, "https://example.com/other.epub")).toBe(false);
});

test("matches open-access and sample publication downloads", () => {
    const downloads = createDownloadState(
        "https://example.com/book-a.epub",
        "https://example.com/book-b-sample.epub",
    );

    expect(isOpdsPublicationDownloading(
        downloads,
        createPublication(["https://example.com/book-a.epub"]),
    )).toBe(true);
    expect(isOpdsPublicationDownloading(
        downloads,
        createPublication([], ["https://example.com/book-b-sample.epub"]),
    )).toBe(true);
});

test("does not match another publication or a publication without acquisition links", () => {
    const downloads = createDownloadState("https://example.com/book-a.epub");

    expect(isOpdsPublicationDownloading(
        downloads,
        createPublication(["https://example.com/book-b.epub"]),
    )).toBe(false);
    expect(isOpdsPublicationDownloading(downloads, createPublication())).toBe(false);
});
