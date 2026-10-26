import { beforeEach, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/main/analytics/catalog", () => ({ logCatalogAdd: jest.fn(), logCatalogEvent: jest.fn() }));
jest.mock("readium-desktop/main/network/http", () => ({ httpGetWithAuth: jest.fn() }));
jest.mock("readium-desktop/main/services/opdsCatalogUrl", () => ({ findDeeplinkCatalog: jest.fn() }));
import { diMainGet } from "readium-desktop/main/di";
import { findDeeplinkCatalog } from "readium-desktop/main/services/opdsCatalogUrl";
import { addFeed } from "readium-desktop/main/redux/sagas/api/opds/feed";

const existing = { identifier: "existing", url: "https://example.com/feed", title: "My title", color: "blue" as const, favorite: true, icon: "saved-icon" };
const repository = {
    findAll: jest.fn(async () => [existing]),
    delete: jest.fn(async () => undefined),
    save: jest.fn(async (value: unknown) => value),
    update: jest.fn(async (_identifier: string, patch: object) => ({ ...existing, ...patch })),
};
beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(diMainGet).mockImplementation(((key: string) => key === "opds-feed-repository" ? repository :
        { convertDocumentToView: async (value: unknown) => value }) as typeof diMainGet);
    jest.mocked(findDeeplinkCatalog).mockResolvedValue({ url: existing.url, feed: existing });
});

it("reuses a redirected catalog without duplicate errors or overwriting its settings", async () => {
    const actions: unknown[] = [];
    const result = await runSaga({ dispatch: (action) => actions.push(action) }, addFeed,
        { url: "http://example.com/feed", title: "Badge title", color: "red" }, "deeplink").toPromise();
    expect(result).toEqual(existing);
    expect(repository.save).not.toHaveBeenCalled();
    expect(actions).toEqual([]);
});

it("updates the bookshelf on an equivalent catalog while preserving metadata", async () => {
    const actions: unknown[] = [];
    const authenticationUrl = "https://example.com/shelf";
    const result = await runSaga({ dispatch: (action) => actions.push(action) }, addFeed,
        { url: "http://example.com/feed", title: "Badge title", authenticationUrl }, "deeplink").toPromise();
    expect(result).toEqual({ ...existing, authenticationUrl });
    expect(repository.update).toHaveBeenCalledWith(existing.identifier, { authenticationUrl });
    expect(actions).toHaveLength(1);
});
