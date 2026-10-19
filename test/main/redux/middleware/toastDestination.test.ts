import { describe, expect, it } from "@jest/globals";
import { getToastDestination } from "readium-desktop/main/redux/middleware/toastDestination";
import { build } from "readium-desktop/common/redux/actions/toast/openRequest";
import { ToastType } from "readium-desktop/common/models/toast";

const readers = [
    { identifier: "reader-1", publicationIdentifier: "book-1" },
    { identifier: "reader-2", publicationIdentifier: "book-1" },
    { identifier: "reader-3", publicationIdentifier: "book-2" },
];
describe("toast window routing", () => {
    it("sends untargeted main errors only to the library", () => {
        expect(getToastDestination(build(ToastType.Error, "Failed"), "library", readers)).toBe("library");
    });
    it("chooses one matching reader for publication notifications", () => {
        expect(getToastDestination(build(ToastType.Error, "Failed", "book-1"), "library", readers)).toBe("reader-1");
    });
    it("honors the originating window when the same book has two readers", () => {
        expect(getToastDestination(build(ToastType.Error, "Failed", "book-1", "reader-2"), "library", readers)).toBe("reader-2");
    });
    it("falls back after an explicitly targeted reader closes", () => {
        expect(getToastDestination(build(ToastType.Error, "Failed", "book-1", "closed-reader"), "library", readers)).toBe("reader-1");
    });
    it("falls back to the library after the publication reader closes", () => {
        expect(getToastDestination(build(ToastType.Error, "Failed", "closed-book"), "library", readers)).toBe("library");
    });
});
