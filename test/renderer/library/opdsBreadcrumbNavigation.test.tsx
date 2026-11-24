/* eslint-disable @typescript-eslint/no-require-imports -- DOM-dependent modules load after JSDOM globals. */
import * as React from "react";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, legacy_createStore as createStore, Store } from "redux";
import { createMemoryHistory, History } from "history";
import { createReduxHistoryContext } from "redux-first-history";
import { HistoryRouter } from "redux-first-history/rr6";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { opdsBreadcrumbReducer } from "readium-desktop/renderer/library/redux/reducers/opds";
import { navigationHistoryReducer } from "readium-desktop/renderer/library/redux/reducers/history";
import { browseRequest, breadcrumbTitleUpdate } from "readium-desktop/renderer/library/redux/actions/opds";
import {
    buildOpdsBrowserRoute,
    buildOpdsBrowserRouteWithLink,
    parseOpdsBrowserRoute,
} from "readium-desktop/renderer/library/opds/route";

jest.mock("readium-desktop/renderer/library/routing", () => ({
    routes: { "/opds/browse": { path: "/opds/:opdsId/browse/:level/:name/:url" } },
    resolveDisplayType: () => "list",
    resolveRouterLocationState: (state: unknown) => state,
}));
jest.mock("readium-desktop/renderer/assets/styles/components/catalogs.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/forbidden-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-right.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("readium-desktop/renderer/library/components/opds/BrowserResult", () => ({
    __esModule: true,
    default: () => <div />,
}));
jest.mock("readium-desktop/renderer/library/components/opds/SearchForm", () => ({
    __esModule: true,
    default: () => <div />,
}));
jest.mock("readium-desktop/renderer/library/components/opds/BrowserOptions", () => ({ BrowserOptions: () => <></> }));
jest.mock("readium-desktop/renderer/library/components/layout/LibraryLayout", () => ({
    __esModule: true,
    default: (props: { title: string; catalogHeader: React.ReactNode }) => (
        <>
            <h1>{props.title}</h1>
            {props.catalogHeader}
        </>
    ),
}));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({
    useTranslator: () => [(key: string) => key],
}));
const mockCatalogs = {
    a: { title: "My library", url: "https://example.org/catalog" },
    b: { title: "Another library", url: "https://another.example.org/catalog" },
};
const mockGetCatalog = () => {};
jest.mock("readium-desktop/renderer/common/hooks/useApi", () => ({
    useApi: (id: string) => [
        { data: { result: mockCatalogs[id.split(":")[1] as keyof typeof mockCatalogs] } },
        mockGetCatalog,
    ],
}));

let Browser: typeof import("readium-desktop/renderer/library/components/opds/Browser").Browser;
let EntryList: typeof import("readium-desktop/renderer/library/components/opds/EntryList").default;
let root: Root;
let host: HTMLDivElement;
let store: Store;
let history: History;
let unlisten: () => void;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();
const rootPath = buildOpdsBrowserRoute("a", mockCatalogs.a.title, mockCatalogs.a.url);
const childUrl = "https://example.org/mystery";
const back = () => host.querySelector<HTMLButtonElement>("nav button");
const home = () => host.querySelector<HTMLAnchorElement>("nav a");
const currentTitle = () => host.querySelector("[aria-current=page]")?.textContent;
const visit = (path: string) => React.act(async () => history.push(path, { displayType: "list", feedColor: "blue" }));
const click = (element: HTMLElement) => React.act(async () => element.click());

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
    for (const [key, value] of Object.entries({
        window: dom.window,
        document: dom.window.document,
        navigator: dom.window.navigator,
        HTMLElement: dom.window.HTMLElement,
        IS_REACT_ACT_ENVIRONMENT: true,
    })) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    ({ Browser } = require("readium-desktop/renderer/library/components/opds/Browser"));
    EntryList = require("readium-desktop/renderer/library/components/opds/EntryList").default;
});
beforeEach(async () => {
    const context = createReduxHistoryContext({ history: createMemoryHistory({ initialEntries: [rootPath] }) });
    store = createStore(
        combineReducers({
            router: context.routerReducer,
            navigationHistory: navigationHistoryReducer,
            opds: combineReducers({ browser: combineReducers({ breadcrumb: opdsBreadcrumbReducer }) }),
            settings: () => ({ libraryView: { displayType: "list" } }),
        }),
        applyMiddleware(context.routerMiddleware),
    );
    history = context.createReduxHistory(store);
    // Feed requests and metadata responses are controlled by the test; routing and reducers are real.
    const browse = () => {
        const route = parseOpdsBrowserRoute(history.location.pathname);
        if (route) store.dispatch(browseRequest.build(route.rootFeedIdentifier, route.level, route.title, route.url));
    };
    unlisten = history.listen(browse);
    browse();
    host = document.createElement("div");
    document.body.append(host);
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    await React.act(async () =>
        root.render(
            <Provider store={store}>
                <HistoryRouter history={history}>
                    <Browser />
                    <EntryList entries={[{ title: "Mystery", url: childUrl }]} />
                </HistoryRouter>
            </Provider>,
        ),
    );
});
afterEach(async () => {
    unlisten();
    await React.act(async () => root.unmount());
    host.remove();
});
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("keeps two visible levels through deep list navigation, pagination, home, and repeated history back", async () => {
    expect(back().disabled).toBe(true);
    expect(home()).toBeNull();
    await React.act(async () => {
        store.dispatch(breadcrumbTitleUpdate.build(rootPath, "Online catalog"));
    });
    await click(host.querySelector<HTMLAnchorElement>("section a"));
    const childPath = history.location.pathname;
    expect(parseOpdsBrowserRoute(childPath).level).toBe(3);
    expect(home().textContent).toBe("Online catalog");
    await React.act(async () => {
        store.dispatch(breadcrumbTitleUpdate.build(childPath, "Crime"));
    });
    const deepPath = buildOpdsBrowserRoute("a", "New releases", "https://example.org/new", 4);
    await visit(deepPath);
    expect(home().getAttribute("href")).toBe(rootPath);
    expect(currentTitle()).toBe("New releases");
    expect(host.querySelector("nav").textContent).not.toContain("Crime");
    const pagePath = buildOpdsBrowserRouteWithLink(deepPath)({ url: "https://example.org/new?page=2" });
    await visit(pagePath);
    await click(back());
    expect(history.location.pathname).toBe(deepPath);
    await click(home());
    expect(history.location.pathname).toBe(rootPath);
    expect(history.location.state).toEqual({ displayType: "list", feedColor: "blue" });
    expect(home()).toBeNull();
    await click(back());
    expect(history.location.pathname).toBe(deepPath);
    await click(back());
    expect(history.location.pathname).toBe(childPath);
    await click(back());
    expect(history.location.pathname).toBe(rootPath);
    expect(back().disabled).toBe(true);
});

test("uses the saved home for direct Shelf entry and catalog switches, without stale child titles", async () => {
    await visit(buildOpdsBrowserRoute("a", "Shelf", "https://example.org/shelf"));
    expect(currentTitle()).toBe("Shelf");
    expect(home().getAttribute("href")).toBe(rootPath);
    expect(home().textContent).toBe("My library");
    const otherPath = buildOpdsBrowserRoute("b", "Wishlist", "https://another.example.org/wishlist");
    await visit(otherPath);
    await React.act(async () => {
        store.dispatch(breadcrumbTitleUpdate.build(rootPath, "Late old title"));
    });
    expect(currentTitle()).toBe("Wishlist");
    expect(home().textContent).toBe("Another library");
    await click(home());
    expect(parseOpdsBrowserRoute(history.location.pathname).url).toBe(mockCatalogs.b.url);
    expect(home()).toBeNull();
});

test("retains the loaded root label during root pagination and tracks replace, forward, and a new history branch", async () => {
    await React.act(async () => {
        store.dispatch(breadcrumbTitleUpdate.build(rootPath, "Online catalog"));
    });
    const pagePath = buildOpdsBrowserRouteWithLink(rootPath)({ url: "https://example.org/catalog?page=2" });
    await visit(pagePath);
    expect(home().textContent).toBe("Online catalog");
    await React.act(async () => history.replace(pagePath));
    await click(back());
    expect(history.location.pathname).toBe(rootPath);
    expect(back().disabled).toBe(true);
    await React.act(async () => history.forward());
    expect(history.location.pathname).toBe(pagePath);
    expect(back().disabled).toBe(false);
    await click(back());
    await visit(buildOpdsBrowserRoute("a", "New branch", childUrl, 3));
    await React.act(async () => history.forward());
    expect(currentTitle()).toBe("New branch");
    await click(back());
    expect(back().disabled).toBe(true);
});
