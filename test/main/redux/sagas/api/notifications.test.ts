import { describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";

jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/main/diSymbolTable", () => ({ diSymbolTable: { "publication-api": "publication-api" } }));
jest.mock("readium-desktop/main/tools/error", () => ({ error: jest.fn() }));

import { diMainGet } from "readium-desktop/main/di";
import { apiActions } from "readium-desktop/common/redux/actions";
import { processRequest } from "readium-desktop/main/redux/sagas/api/api";

 describe("API error ownership", () => {
    it.each([new Error("Offline"), "Offline"])("returns errors to the caller without a second notification", async (failure) => {
        jest.mocked(diMainGet).mockReturnValue({ findAll: () => { throw failure; } } as never);
        const dispatch = jest.fn();
        await runSaga({ dispatch }, processRequest, apiActions.request.build("request-1", "publication", "findAll", [])).toPromise();
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: apiActions.result.ID,
            error: true,
            payload: expect.objectContaining({ code: "API-ERROR", message: "Offline" }),
            meta: { api: { requestId: "request-1", moduleId: "publication", methodId: "findAll" } },
        }));
    });
});
