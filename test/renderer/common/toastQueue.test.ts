import { describe, expect, it } from "@jest/globals";
import { ToastType } from "readium-desktop/common/models/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { shouldAddToast } from "readium-desktop/renderer/common/components/toast/toastQueue";

const failure: ToastState = {
    open: true,
    data: "Unable to download book",
    type: ToastType.Error,
    publicationIdentifier: undefined,
};

describe("toast queue", () => {
    it.each([ToastType.Error, ToastType.Info])("suppresses visible duplicates of %s", (type) => {
        const toast = { ...failure, type };
        expect(shouldAddToast([{ content: toast }], { ...toast })).toBe(false);
    });
    it("permits the same error again after dismissal", () => {
        expect(shouldAddToast([], failure)).toBe(true);
    });
    it.each([
        { ...failure, open: false },
        { ...failure, data: " " },
        { ...failure, data: undefined },
    ])("ignores closed or empty notifications", (toast) => {
        expect(shouldAddToast([], toast)).toBe(false);
    });
    it("does not retain notifications for a different reader", () => {
        expect(shouldAddToast([], { ...failure, publicationIdentifier: "book-2" }, "book-1")).toBe(false);
    });
    it("retains independent failures", () => {
        expect(shouldAddToast([{ content: failure }], { ...failure, data: "Unable to download another book" })).toBe(
            true,
        );
    });
    it("allows a targeted notification to fall back to the library", () => {
        expect(shouldAddToast([], { ...failure, publicationIdentifier: "closed-book" })).toBe(true);
    });
    it("does not merge successful independent operations", () => {
        const toast = { ...failure, type: ToastType.Success };
        expect(shouldAddToast([{ content: toast }], toast)).toBe(true);
    });
});
