import { describe, expect, it } from "@jest/globals";
import { ToastType } from "readium-desktop/common/models/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { addToastToQueue } from "readium-desktop/renderer/common/components/toast/toastQueue";

const failure: ToastState = { open: true, data: "Unable to download book", type: ToastType.Error, publicationIdentifier: undefined };

describe("toast queue", () => {
    it.each([ToastType.Error, ToastType.Default])("suppresses visible duplicates of %s", (type) => {
        const toast = { ...failure, type };
        const queue = addToastToQueue({}, "first", toast);
        expect(addToastToQueue(queue, "second", { ...toast })).toBe(queue);
    });
    it("permits the same error again after dismissal", () => {
        expect(addToastToQueue({}, "retry", failure)).toEqual({ retry: failure });
    });
    it.each([{ ...failure, open: false }, { ...failure, data: " " }, { ...failure, data: undefined }])("ignores closed or empty notifications", (toast) => {
        const queue = {};
        expect(addToastToQueue(queue, "ignored", toast)).toBe(queue);
    });
    it("does not retain notifications for a different reader", () => {
        const queue = {};
        expect(addToastToQueue(queue, "other", { ...failure, publicationIdentifier: "book-2" }, "book-1")).toBe(queue);
    });
    it("retains independent failures", () => {
        const queue = addToastToQueue({}, "first", failure);
        expect(Object.keys(addToastToQueue(queue, "second", { ...failure, data: "Unable to download another book" }))).toHaveLength(2);
    });
    it("allows a targeted notification to fall back to the library", () => {
        const toast = { ...failure, publicationIdentifier: "closed-book" };
        expect(addToastToQueue({}, "fallback", toast)).toEqual({ fallback: toast });
    });
    it("does not merge successful independent operations", () => {
        const toast = { ...failure, type: ToastType.Success };
        const queue = addToastToQueue({}, "first", toast);
        expect(Object.keys(addToastToQueue(queue, "second", toast))).toHaveLength(2);
    });
});
