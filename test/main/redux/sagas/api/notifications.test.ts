import { describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/common/services/translator", () => ({ getTranslator: () => ({ translate: (key: string) => key }) }));

jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/main/diSymbolTable", () => ({ diSymbolTable: { "publication-api": "publication-api" } }));
jest.mock("readium-desktop/main/tools/error", () => ({ error: jest.fn() }));

import { diMainGet } from "readium-desktop/main/di";
import { apiActions } from "readium-desktop/common/redux/actions";
import { processRequest } from "readium-desktop/main/redux/sagas/api/api";
import { withErrorNotification } from "readium-desktop/main/redux/sagas/api/withErrorNotification";
import { SagaGenerator } from "typed-redux-saga";

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


describe("explicit API operation notifications", () => {
    it("reports a failed user operation once and preserves the API error", async () => {
        function* exportPublication(): SagaGenerator<void> {
            throw new Error("Disk full");
        }
        jest.mocked(diMainGet).mockReturnValue({ exportPublication: withErrorNotification(exportPublication, "message.notifications.exportFailed") } as never);
        const dispatch = jest.fn();
        await runSaga({ dispatch }, processRequest, { ...apiActions.request.build("export-1", "publication", "exportPublication", []), sender: { identifier: "reader-2" } }).toPromise();
        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: "TOAST_OPEN_REQUEST", destination: { identifier: "reader-2" }, payload: expect.objectContaining({ data: "message.notifications.exportFailed" }) }));
        expect(dispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: "API_RESULT", error: true, payload: expect.objectContaining({ message: "Disk full" }) }));
    });
    it("does not notify for a successful operation", async () => {
        function* operation(): SagaGenerator<number> { return 42; }
        const dispatch = jest.fn();
        const result = await runSaga({ dispatch }, withErrorNotification(operation, "message.notifications.exportFailed")).toPromise();
        expect(result).toBe(42);
        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe("nested API operations", () => {
    it("leaves a recoverable internal failure for its parent without a toast", async () => {
        const internalDelete = withErrorNotification(function* (): SagaGenerator<void> { throw new Error("Retry cleanup failed"); }, "message.notifications.deleteFailed");
        function* findAll(): SagaGenerator<string[]> {
            try { yield* internalDelete(); } catch { return ["existing-book"]; }
            return [];
        }
        jest.mocked(diMainGet).mockReturnValue({ findAll } as never);
        const dispatch = jest.fn();
        await runSaga({ dispatch }, processRequest, apiActions.request.build("request-2", "publication", "findAll", [])).toPromise();
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "API_RESULT", error: false, payload: ["existing-book"] }));
    });
});
