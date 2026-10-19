import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/common/language-string", () => ({ convertMultiLangStringToString: () => "Book" }));
jest.mock("readium-desktop/common/services/translator", () => ({ availableLanguages: { en: "English" }, getTranslator: () => ({ translate: (key: string) => key }) }));
jest.mock("@r2-shared-js/parser/publication-parser", () => ({ PublicationParsePromise: async () => ({ Metadata: { Title: "Book" }, freeDestroy: (): void => undefined }) }));
jest.mock("readium-desktop/main/redux/sagas/api/publication/import/importFromFs", () => ({ importFromFsService: jest.fn() }));
import { diMainGet } from "readium-desktop/main/di";
import { importFromFsService } from "readium-desktop/main/redux/sagas/api/publication/import/importFromFs";
import { recover } from "readium-desktop/main/redux/sagas/api/publication/recovery";

describe("recovery outcome notifications", () => {
    beforeEach(() => {
        jest.mocked(diMainGet).mockImplementation((key) => ({
            "publication-repository": { findAll: (): unknown[] => [] },
            "publication-storage": { listRecoverablePublications: async () => [{ identifier: "one", filePath: "one.epub" }, { identifier: "two", filePath: "two.epub" }] },
            store: { getState: () => ({ i18n: { locale: "en" } }) },
            "publication-view-converter": { convertDocumentToView: async (doc: unknown) => doc },
        })[key as string] as never);
    });
    it("does not call already-existing records a failure", async () => {
        jest.mocked(importFromFsService).mockImplementation(function* (): ReturnType<typeof importFromFsService> { return [{ identifier: "existing" } as never, true]; });
        const dispatch = jest.fn();
        await runSaga({ dispatch }, recover).toPromise();
        expect(dispatch).not.toHaveBeenCalled();
    });
    it("reports mixed outcomes once", async () => {
        jest.mocked(importFromFsService).mockImplementation(function* (file): ReturnType<typeof importFromFsService> {
            if (file === "two.epub") throw new Error("Unavailable");
            return [{ identifier: "one" } as never, false];
        });
        const dispatch = jest.fn();
        await runSaga({ dispatch }, recover).toPromise();
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({ type: "toast-default", data: "message.notifications.recoveryPartialFailure" }) }));
    });
});
