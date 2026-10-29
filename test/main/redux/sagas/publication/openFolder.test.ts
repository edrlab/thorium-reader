import { describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("electron", () => ({ shell: { openPath: jest.fn() } }));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/common/services/translator", () => ({ getTranslator: () => ({ translate: (key: string) => key }) }));

import { shell } from "electron";
import { diMainGet } from "readium-desktop/main/di";
import { openPublicationFolder } from "readium-desktop/main/redux/sagas/publication/openFolder";

describe("publication folder opening", () => {
    it.each(["", "No application can open this folder"])("handles the shell result %j", async (result) => {
        jest.mocked(diMainGet).mockReturnValue({ getPublicationPath: async () => "/books/publication" } as never);
        jest.mocked(shell.openPath).mockResolvedValue(result);
        const dispatch = jest.fn();
        await runSaga({ dispatch }, openPublicationFolder, "publication-1").toPromise();
        expect(shell.openPath).toHaveBeenCalledWith("/books/publication");
        expect(dispatch).toHaveBeenCalledTimes(result ? 1 : 0);
        if (result) expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            payload: expect.objectContaining({ type: "toast-error", data: "message.open.folderNotFound" }),
        }));
    });

    it("reports an unavailable publication folder without invoking the shell", async () => {
        jest.mocked(shell.openPath).mockClear();
        jest.mocked(diMainGet).mockReturnValue({ getPublicationPath: async () => { throw new Error("Missing publication"); } } as never);
        const dispatch = jest.fn();
        await runSaga({ dispatch }, openPublicationFolder, "missing").toPromise();
        expect(shell.openPath).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledTimes(1);
    });
});
