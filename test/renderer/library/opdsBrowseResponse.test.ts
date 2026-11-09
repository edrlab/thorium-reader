import { expect, jest, test } from "@jest/globals";
import { runSaga, stdChannel } from "redux-saga";
import { take } from "redux-saga/effects";
import { Action } from "history";
import { apiActions } from "readium-desktop/common/redux/actions";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { handOffBrowseResponse, takeBrowseResponse } from "readium-desktop/renderer/library/opds/browseResponse";
import { opdsActions, routerActions } from "readium-desktop/renderer/library/redux/actions";
import { browseWatcher, saga } from "readium-desktop/renderer/library/redux/sagas/opds";
import { libraryApiReducer } from "readium-desktop/renderer/library/redux/reducers/api";
import { opdsBrowse } from "readium-desktop/renderer/common/redux/sagas/httpBrowser";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { replace } from "redux-first-history";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";

jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/renderer/library/opds/route", () => ({
    parseOpdsBrowserRoute: jest.fn(() => ({ rootFeedIdentifier: "catalog", level: 3, title: "Borrow", url: "https://example.org/borrow" })),
    extractParamFromOpdsRoutePathname: () => ({ opdsId: "catalog", level: "2", name: "Qm9ycm93" }),
    buildOpdsBrowserRoute: () => "/opds/catalog/browse/3/borrow/url",
}));
jest.mock("readium-desktop/renderer/library/routing", () => ({ dispatchHistoryPush: () => jest.fn() }));
jest.mock("readium-desktop/renderer/common/analytics", () => ({ logEvent: jest.fn() }));
jest.mock("readium-desktop/renderer/common/redux/sagas/httpBrowser", () => ({ opdsBrowse: jest.fn() }));

test.each(["feed", "authentication", "html"])("reuses the %s response during navigation without a second Borrow request", async (kind) => {
    const path = "/opds/catalog/browse/3/borrow/url";
    const response: THttpGetBrowserResultView = {
        url: "https://example.org/borrow", isSuccess: kind !== "authentication", isFailure: kind === "authentication",
        contentType: kind === "html" ? "text/html" : kind === "authentication" ? "application/opds-authentication+json" : "application/opds+json",
        data: { opds: { title: "Result", publications: [] } },
    };
    dispatchOpdsLink((action) => action)({ url: response.url.toString(), type: "application/opds-publication+json" },
        { pathname: "/opds/catalog/browse/2/feed/url", search: "", hash: "", key: "feed", state: undefined },
        "Borrow", response);
    const dispatched: unknown[] = [];
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action) }, browseWatcher,
        routerActions.locationChanged.build({ pathname: path, search: "", hash: "", state: undefined, key: "borrow" }, Action.Push),
    ).toPromise();
    expect(opdsBrowse).not.toHaveBeenCalled();
    expect(dispatched).toContainEqual(apiActions.result.build({
        requestId: "browseOpdsApiResult", moduleId: "httpbrowser", methodId: "browse",
    }, response));
    expect(takeBrowseResponse(path)).toBeUndefined();
});

test("does not hand a response to a different route", () => {
    handOffBrowseResponse("/opds/first", { url: "https://example.org/borrow", isSuccess: true, isFailure: false });
    expect(takeBrowseResponse("/opds/other")).toBeUndefined();
    expect(takeBrowseResponse("/opds/first")).toBeUndefined();
});

test("still fetches ordinary navigation without a handed-off response", async () => {
    const result = apiActions.result.build({ requestId: "browseOpdsApiResult", moduleId: "httpbrowser", methodId: "browse" },
        { url: "https://example.org/borrow", isSuccess: true, isFailure: false, data: { opds: { title: "Feed" } } });
    jest.mocked(opdsBrowse).mockImplementationOnce(function*() { return result; });
    await runSaga({ dispatch: () => undefined }, browseWatcher, routerActions.locationChanged.build({
        pathname: "/opds/catalog/browse/3/ordinary/url", search: "", hash: "", state: undefined, key: "ordinary",
    }, Action.Push)).toPromise();
    expect(opdsBrowse).toHaveBeenCalledTimes(1);
    expect(opdsBrowse).toHaveBeenCalledWith("https://example.org/borrow", expect.stringMatching(/^opds-navigation:/));
});

test("only publishes the active catalog response when an earlier request finishes late", async () => {
    const channel = stdChannel();
    const dispatched: unknown[] = [];
    const requests: string[] = [];
    const respond = (requestId: string, title: string) => apiActions.result.build(
        { requestId, moduleId: "httpbrowser", methodId: "browse" },
        { isSuccess: true, isFailure: false, data: { opds: { title } } },
    );
    const waitForResponse: typeof opdsBrowse = function*(_url, requestId) {
        requests.push(requestId);
        while (true) {
            const action: apiActions.result.TAction = yield take(apiActions.result.ID);
            if (action.meta.api.requestId === requestId) {
                return action;
            }
        }
    };
    jest.mocked(opdsBrowse).mockImplementationOnce(waitForResponse).mockImplementationOnce(waitForResponse);
    const task = await runSaga({ channel, dispatch: (action: unknown) => dispatched.push(action) }, function*() {
        return yield saga();
    }).toPromise();
    const navigate = (catalog: string) => {
        const pathname = `/opds/${catalog}/browse/1/name/url`;
        channel.put(routerActions.locationChanged.build({
            pathname, search: "", hash: "", state: undefined, key: catalog,
        }, Action.Push));
        return pathname;
    };
    try {
        navigate("old");
        const activePath = navigate("new");
        expect(requests).toHaveLength(2);
        expect(requests[0]).not.toBe(requests[1]);
        const stale = respond(requests[0], "Old catalog");
        const initialState = libraryApiReducer(undefined, { type: "@@INIT" });
        expect(libraryApiReducer(initialState, stale)).toBe(initialState);
        channel.put(respond(requests[1], "New catalog"));
        channel.put(stale);
        expect(dispatched.filter(action => (action as { type: string }).type === apiActions.result.ID)).toEqual([
            respond("browseOpdsApiResult", "New catalog"),
        ]);
        expect(dispatched.filter(action => (action as { type: string }).type === opdsActions.breadcrumbTitleUpdate.ID)).toEqual([
            opdsActions.breadcrumbTitleUpdate.build(activePath, "New catalog"),
        ]);
    } finally {
        task.cancel();
    }
});

test("returns to catalogs without browsing an invalid route", async () => {
    jest.mocked(parseOpdsBrowserRoute).mockReturnValueOnce(undefined);
    jest.mocked(opdsBrowse).mockClear();
    const dispatched: unknown[] = [];
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action) }, browseWatcher,
        routerActions.locationChanged.build({
            pathname: "/opds/catalog/browse/1/Books/dW5kZWZpbmVk", search: "", hash: "", state: undefined, key: "invalid",
        }, Action.Push)).toPromise();
    expect(opdsBrowse).not.toHaveBeenCalled();
    expect(dispatched).toContainEqual(replace("/opds"));
});

test.each([
    ["Server title", true], ["", true], ["   ", true], ["Unauthorized", false],
] as const)("updates the breadcrumb from feed metadata %s (success: %s), even without links", async (title, success) => {
    const path = "/opds/catalog/browse/3/title/url";
    const result = apiActions.result.build({ requestId: "browseOpdsApiResult", moduleId: "httpbrowser", methodId: "browse" },
        { url: "https://example.org/borrow", isSuccess: success, isFailure: !success, data: { opds: { title } } });
    jest.mocked(opdsBrowse).mockImplementationOnce(function*() { return result; });
    const dispatched: unknown[] = [];
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action) }, browseWatcher, routerActions.locationChanged.build({
        pathname: path, search: "", hash: "", state: undefined, key: "title",
    }, Action.Push)).toPromise();
    const updates = dispatched.filter(action => (action as { type: string }).type === opdsActions.breadcrumbTitleUpdate.ID);
    expect(updates).toEqual(success && title.trim() ? [opdsActions.breadcrumbTitleUpdate.build(path, title)] : []);
});
