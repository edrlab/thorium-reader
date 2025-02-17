import { expect, test } from "@jest/globals";

import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";

test("html mimeTypes", () => {
    expect(findMimeTypeWithExtension(".html")).toBe("text/html");
});

test("mp3 mimeTypes", () => {
    expect(findMimeTypeWithExtension(".mp3")).toBe("audio/mpeg");
});

test("mp4 mimeTypes", () => {
    expect(findMimeTypeWithExtension(".mp4")).toBe("video/mp4");
});
