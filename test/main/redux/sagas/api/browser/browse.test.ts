import { expect, jest, test } from "@jest/globals";
import { runSaga } from "redux-saga";
import { ContentType } from "readium-desktop/utils/contentType";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));

const mockTransform = jest.fn<() => Promise<unknown>>();
jest.mock("readium-desktop/main/di", () => ({ diMainGet: () => ({ opdsRequestTransformer: mockTransform }) }));
jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn(), httpDeleteWithAuth: jest.fn() }));
jest.mock("readium-desktop/main/services/opds", () => ({}));
jest.mock("readium-desktop/main/redux/sagas/apiapp", () => ({}));
import { browse } from "readium-desktop/main/redux/sagas/api/browser/browse";
import { httpGet, httpDeleteWithAuth } from "readium-desktop/main/network/http";

const url = "https://example.org/hold";
test.each([undefined, "GET", "DELETE"] as const)("browse uses %s and transforms the returned publication", async (method) => {
    jest.mocked(httpGet).mockReset();
    jest.mocked(httpDeleteWithAuth).mockReset();
    const opds = { title: "Updated", publications: [{ documentTitle: "Updated publication" }] };
    mockTransform.mockResolvedValue(opds);
    const request = jest.fn(async (_url: unknown, _options: unknown, callback: any) => callback({
        url, contentType: ContentType.Opds2Pub, isSuccess: true, isFailure: false,
    }));
    jest.mocked(method === "DELETE" ? httpDeleteWithAuth : httpGet).mockImplementation(request);
    const result = await runSaga({}, browse, url, method).toPromise();
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.data.opds).toEqual(opds);
    expect(jest.mocked(method === "DELETE" ? httpGet : httpDeleteWithAuth)).not.toHaveBeenCalled();
});
test("rejects non-HTTP DELETE URLs", async () => {
    await expect(runSaga({ onError: () => undefined }, browse, "apiapp://loans", "DELETE").toPromise()).rejects.toThrow();
});
