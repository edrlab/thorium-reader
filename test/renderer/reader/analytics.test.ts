import { expect, test } from "@jest/globals";

import { buildReaderScreenViewAnalyticsEvent } from "readium-desktop/renderer/reader/analytics";

test("reader analytics builds Measurement Protocol screen_view payloads", () => {
    expect(buildReaderScreenViewAnalyticsEvent()).toEqual({
        name: "screen_view",
        params: {
            screen_name: "ReaderView",
            screen_class: "reader",
        },
        screenName: "ReaderView",
    });
});
