import { beforeEach, describe, expect, it, jest } from "@jest/globals";
jest.mock("readium-desktop/main/di", () => ({ getLibraryWindowFromDi: jest.fn(), getReaderWindowFromDi: jest.fn() }));
jest.mock("readium-desktop/common/services/serializer", () => ({ ActionSerializer: { serialize: (action: unknown) => action } }));
import { getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { build } from "readium-desktop/common/redux/actions/toast/openRequest";
import { ToastType } from "readium-desktop/common/models/toast";
import { reduxSyncMiddleware } from "readium-desktop/main/redux/middleware/sync";

const makeWindow = () => ({ isDestroyed: () => false, webContents: { isDestroyed: () => false, send: jest.fn() } });
const windows = { library: makeWindow(), "reader-1": makeWindow(), "reader-2": makeWindow() };
const store = {
    dispatch: jest.fn(),
    getState: () => ({ win: { session: { library: { identifier: "library" }, reader: {
        first: { identifier: "reader-1", publicationIdentifier: "book-1" },
        second: { identifier: "reader-2", publicationIdentifier: "book-1" },
    } } } }),
} as unknown as Parameters<typeof reduxSyncMiddleware>[0];

describe("toast IPC synchronization", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(getLibraryWindowFromDi).mockReturnValue(windows.library as never);
        jest.mocked(getReaderWindowFromDi).mockImplementation((id) => windows[id as keyof typeof windows] as never);
    });
    it.each([
        [build(ToastType.Error, "Failed"), "library"],
        [build(ToastType.Error, "Failed", "book-1"), "reader-1"],
        [build(ToastType.Error, "Failed", "book-1", "reader-2"), "reader-2"],
        [build(ToastType.Error, "Failed", "book-1", "closed-reader"), "reader-1"],
    ] as const)("delivers %j to exactly %s", (action, expected) => {
        const next = jest.fn();
        reduxSyncMiddleware(store)(next)(action);
        for (const [id, win] of Object.entries(windows)) {
            expect(win.webContents.send).toHaveBeenCalledTimes(id === expected ? 1 : 0);
        }
        expect(next).toHaveBeenCalledWith(action);
    });
});
