import { describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("electron", () => ({ clipboard: { writeText: jest.fn() } }));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/common/services/translator", () => ({
    getTranslator: () => ({ translate: (key: string) => key }),
}));

import { clipboard } from "electron";
import { diMainGet } from "readium-desktop/main/di";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerClipboardCopy } from "readium-desktop/main/redux/sagas/publication/clipboardCopy";

describe("LCP clipboard allowance", () => {
    it.each([0, -10])("does not copy, persist or report success with %s characters remaining", async (remaining) => {
        jest.mocked(clipboard.writeText).mockClear();
        const repository = {
            get: async () => ({ lcp: { rights: { copy: 10 } }, lcpRightsCopies: 10 - remaining }),
            save: jest.fn(),
        };
        jest.mocked(diMainGet).mockReturnValue(repository as never);
        const dispatch = jest.fn();
        const action = readerActions.clipboardCopy.build("publication-1", { txt: "hello", locator: undefined });
        await runSaga({ dispatch }, readerClipboardCopy, action).toPromise();
        expect(clipboard.writeText).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ type: "toast-error", publicationIdentifier: "publication-1" }),
            }),
        );
    });

    it("copies only the available characters when some allowance remains", async () => {
        jest.mocked(clipboard.writeText).mockClear();
        const repository = {
            get: async () => ({ lcp: { rights: { copy: 10 } }, lcpRightsCopies: 8 }),
            save: jest.fn(async (_document: unknown) => undefined),
        };
        jest.mocked(diMainGet).mockReturnValue(repository as never);
        const dispatch = jest.fn();
        await runSaga(
            { dispatch },
            readerClipboardCopy,
            readerActions.clipboardCopy.build("publication-1", { txt: "hello", locator: undefined }),
        ).toPromise();
        expect(clipboard.writeText).toHaveBeenCalledWith("he", "clipboard");
        expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ lcpRightsCopies: 10 }));
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({ payload: expect.objectContaining({ type: "toast-default" }) }),
        );
        expect(dispatch.mock.calls[0][0]).not.toHaveProperty("payload.timeout");
    });

    it("reports a full copy as success without a per-action timeout", async () => {
        const repository = {
            get: async () => ({ lcp: { rights: { copy: 10 } }, lcpRightsCopies: 1 }),
            save: jest.fn(async (_document: unknown) => undefined),
        };
        jest.mocked(diMainGet).mockReturnValue(repository as never);
        const dispatch = jest.fn();
        await runSaga(
            { dispatch },
            readerClipboardCopy,
            readerActions.clipboardCopy.build("publication-1", { txt: "hello", locator: undefined }),
        ).toPromise();
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({ payload: expect.objectContaining({ type: "toast-success" }) }),
        );
        expect(dispatch.mock.calls[0][0]).not.toHaveProperty("payload.timeout");
    });
});
