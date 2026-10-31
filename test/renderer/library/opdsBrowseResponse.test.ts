import { expect, jest, test } from "@jest/globals";
import { runSaga } from "redux-saga";
import { Action } from "history";
import { apiActions, authActions, historyActions } from "readium-desktop/common/redux/actions";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { handOffBrowseResponse, takeBrowseResponse } from "readium-desktop/renderer/library/opds/browseResponse";
import { routerActions } from "readium-desktop/renderer/library/redux/actions";
import { authenticationDone, browseWatcher, presentAuthentication } from "readium-desktop/renderer/library/redux/sagas/opds";
import { opdsBrowse } from "readium-desktop/renderer/common/redux/sagas/httpBrowser";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { goBack, push, replace } from "redux-first-history";
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
    expect(opdsBrowse).toHaveBeenCalledWith("https://example.org/borrow", "browseOpdsApiResult");
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


test("presents a background credential challenge without fetching it again and restores the previous page", async () => {
    const path = "/opds/catalog/browse/3/borrow/url";
    const dispatched: unknown[] = [];
    const state = { router: { location: { pathname: "/catalog" } } };
    jest.mocked(parseOpdsBrowserRoute).mockReturnValueOnce(undefined);
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action), getState: () => state },
        presentAuthentication, authActions.present.build("https://example.org/login", { title: "Login" })).toPromise();
    expect(dispatched).toContainEqual(push(path));
    expect(takeBrowseResponse(path).data.opds.title).toBe("Login");
    state.router.location.pathname = path;
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action), getState: () => state }, authenticationDone).toPromise();
    expect(dispatched).toContainEqual(goBack());
});

test("refreshes an inline challenge already shown in the OPDS browser", async () => {
    const dispatched: unknown[] = [];
    const state = { router: { location: { pathname: "/opds/catalog/browse/3/borrow/url" } } };
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action), getState: () => state },
        presentAuthentication, authActions.present.build("https://example.org/borrow", { title: "Login" })).toPromise();
    expect(dispatched).toEqual([]);
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action), getState: () => state }, authenticationDone).toPromise();
    expect(dispatched).toContainEqual(historyActions.refresh.build());
});


test("does not redirect the user if they leave the inline authentication page", async () => {
    const dispatched: unknown[] = [];
    const state = { router: { location: { pathname: "/opds/catalog/browse/3/borrow/url" } } };
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action), getState: () => state },
        presentAuthentication, authActions.present.build("https://example.org/borrow", { title: "Login" })).toPromise();
    state.router.location.pathname = "/catalog";
    await runSaga({ dispatch: (action: unknown) => dispatched.push(action), getState: () => state }, authenticationDone).toPromise();
    expect(dispatched).toEqual([]);
});
