import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn() }));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/main/tools/error", () => ({ error: jest.fn() }));
jest.mock("readium-desktop/common/services/translator", () => ({ getTranslator: () => ({ translate: (key: string) => key }) }));
import { httpGet } from "readium-desktop/main/network/http";
import { error } from "readium-desktop/main/tools/error";
import { customizationActions } from "readium-desktop/common/redux/actions";
import { triggerCatalogOpdsAuthentication } from "readium-desktop/main/redux/sagas/opdsAuthentication";

describe("catalog authentication notifications", () => {
    beforeEach(() => { jest.clearAllMocks(); });
    it("reports an authentication failure with one toast and no modal", async () => {
        jest.mocked(httpGet).mockRejectedValue(new Error("Offline"));
        const dispatch = jest.fn();
        await runSaga({ dispatch }, triggerCatalogOpdsAuthentication, customizationActions.triggerOpdsAuth.build("https://example.org/catalog", undefined)).toPromise();
        expect(error).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "TOAST_OPEN_REQUEST", payload: expect.objectContaining({ data: "message.notifications.authenticationFailed" }) }));
    });
});
