import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { runSaga } from "redux-saga";
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));

jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn() }));
jest.mock("readium-desktop/main/tools/error", () => ({ error: jest.fn() }));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/common/utils/isURL", () => ({ __esModule: true, default: (url: string) => /^https?:\/\//.test(url) }));

import { httpGet } from "readium-desktop/main/network/http";
import { diMainGet } from "readium-desktop/main/di";
import { customizationActions } from "readium-desktop/common/redux/actions";
import { triggerCatalogOpdsAuthentication } from "readium-desktop/main/redux/sagas/opdsAuthentication";

const transform = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const get = jest.mocked(httpGet);
const response = (contentType: string) => ({ contentType }) as Awaited<ReturnType<typeof httpGet>>;
const home = "https://banq.pretnumerique.ca/v1/home.opds2";
const shelf = "https://banq.pretnumerique.ca/v1/my_profile/activity.opds2";

describe("feed card login", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(diMainGet).mockReturnValue({ opdsRequestTransformer: transform } as never);
    });

    it("passes authentication responses to the standard handler and finishes without waiting for login", async () => {
        const auth = response("application/opds-authentication+json");
        get.mockResolvedValue(auth);
        transform.mockResolvedValue({ title: "Unauthorized" });
        await runSaga({ dispatch: () => undefined }, triggerCatalogOpdsAuthentication, customizationActions.triggerOpdsAuth.build(home, shelf)).toPromise();
        expect(get).toHaveBeenCalledWith(shelf);
        expect(transform).toHaveBeenCalledWith(auth);
    });

    it("follows the bookshelf when the badge endpoint returns a public feed", async () => {
        get.mockResolvedValueOnce(response("application/opds+json"));
        get.mockResolvedValueOnce(response("application/opds-authentication+json"));
        transform.mockResolvedValueOnce({ links: { bookshelf: [{ url: shelf }] } });
        transform.mockResolvedValueOnce({ title: "Unauthorized" });
        await runSaga({ dispatch: () => undefined }, triggerCatalogOpdsAuthentication, customizationActions.triggerOpdsAuth.build(home, home)).toPromise();
        expect(get).toHaveBeenNthCalledWith(2, shelf);
        expect(transform).toHaveBeenCalledTimes(2);
    });

    it("surfaces network errors instead of leaving the login watcher blocked", async () => {
        const dispatched: unknown[] = [];
        get.mockRejectedValue(new Error("offline"));
        await runSaga({ dispatch: (action) => dispatched.push(action) }, triggerCatalogOpdsAuthentication,
            customizationActions.triggerOpdsAuth.build(home, shelf)).toPromise();
        expect(dispatched).toHaveLength(1);
    });

    it("prefers an explicit authenticate link over shelf", async () => {
        const auth = "https://example.com/auth";
        get.mockResolvedValue(response("application/opds+json"));
        transform.mockResolvedValueOnce({ links: { authenticate: [{ url: auth }], bookshelf: [{ url: shelf }] } });
        transform.mockResolvedValueOnce({ title: "Unauthorized" });
        await runSaga({ dispatch: () => undefined }, triggerCatalogOpdsAuthentication,
            customizationActions.triggerOpdsAuth.build(home, home)).toPromise();
        expect(get).toHaveBeenNthCalledWith(2, auth);
    });
});
