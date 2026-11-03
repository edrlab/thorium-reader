/* eslint-disable @typescript-eslint/no-require-imports -- DOM-dependent modules load after JSDOM globals. */
import * as React from "react";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import type { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import type { IOpdsNavigationLink } from "readium-desktop/common/views/opds";
import { historyActions } from "readium-desktop/common/redux/actions";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/library/opds/constants";

const mockApi = jest.fn<(method: string, ...args: unknown[]) => Promise<unknown>>();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockLink = jest.fn();
let mockLocation = { pathname: "", state: { displayType: "list" } };
let mockResult: THttpGetBrowserResultView;
const catalog = "https://example.org/catalog";
const shelf = { url: "https://example.org/loans", type: "application/opds+json" };
const wishlist = { url: "https://example.org/wishlist", type: "application/opds+json" };
const profile = { url: "https://example.org/profile", type: "application/opds-profile+json" };
const mockState = () => ({ api: { [BROWSE_OPDS_API_REQUEST_ID]: { data: { result: mockResult } } },
    opds: { browser: { header: {}, breadcrumb: [{}, { name: "My catalog" }] } } });
jest.mock("readium-desktop/renderer/library/apiAction", () => ({ apiAction: mockApi }));
jest.mock("readium-desktop/renderer/common/hooks/useSelector", () => ({ useSelector: (select: (state: unknown) => unknown) => select(mockState()) }));
jest.mock("readium-desktop/renderer/common/hooks/useDispatch", () => ({ useDispatch: () => mockDispatch }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [(key: string) => key] }));
jest.mock("react-router-dom", () => ({ useLocation: () => mockLocation, useNavigate: () => mockNavigate }));
jest.mock("readium-desktop/renderer/library/routing", () => ({ routes: {} }));
jest.mock("readium-desktop/renderer/library/opds/handleLink", () => ({ dispatchOpdsLink: () => mockLink }));
jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("readium-desktop/renderer/assets/styles/components/dropdown.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/opdsBrowserOptions.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/menu.svg", () => ({}));

let BrowserOptions: typeof import("readium-desktop/renderer/library/components/opds/BrowserOptions").BrowserOptions;
let buildRoute: typeof import("readium-desktop/renderer/library/opds/route").buildOpdsBrowserRoute;
let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();
const render = () => React.act(async () => root.render(<BrowserOptions />));
const feed = (url: string, links: Partial<IOpdsNavigationLink> = {}) => {
    mockResult = { url, isSuccess: true, isFailure: false, data: { opds: { title: "Catalog", links } } } as THttpGetBrowserResultView;
};
const item = (id: string) => document.querySelector<HTMLElement>('[role="menuitem"][data-key="' + id + '"]');
async function activate(element: HTMLElement) {
    expect(element).not.toBeNull();
    await React.act(async () => {
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
        element.click();
    });
}
const open = () => activate(host.querySelector("button"));
beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost" });
    const keys = ["window", "document", "navigator", "HTMLElement", "Element", "Node", "NodeFilter", "HTMLInputElement",
        "HTMLButtonElement", "HTMLTextAreaElement", "HTMLAnchorElement", "HTMLSelectElement", "HTMLFieldSetElement", "HTMLIFrameElement",
        "SVGElement", "MutationObserver", "CustomEvent", "Event", "KeyboardEvent", "MouseEvent", "getComputedStyle",
        "requestAnimationFrame", "cancelAnimationFrame", "DocumentFragment"];
    for (const key of keys) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key as keyof Window] });
    }
    for (const [key, value] of Object.entries({ IS_REACT_ACT_ENVIRONMENT: true,
        CSS: { escape: require("css.escape") }, ResizeObserver: class { observe() {} unobserve() {} disconnect() {} } })) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    ({ BrowserOptions } = require("readium-desktop/renderer/library/components/opds/BrowserOptions"));
    ({ buildOpdsBrowserRoute: buildRoute } = require("readium-desktop/renderer/library/opds/route"));
});
beforeEach(async () => {
    jest.resetAllMocks();
    mockApi.mockResolvedValue({ catalogUrl: catalog, links: {}, authenticated: false });
    mockLocation = { pathname: buildRoute("catalog-a", "My catalog", catalog), state: { displayType: "list" } };
    feed(catalog);
    host = document.createElement("div"); document.body.append(host);
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    await render();
});
afterEach(async () => { await React.act(async () => root.unmount()); host.remove(); });
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("shows advertised destinations and refresh, and preserves link dispatch behavior", async () => {
    feed(catalog, { bookshelf: [shelf], wishlist: [wishlist], history: [{ url: "https://example.org/history" }],
        profile: [{ url: "https://example.org/account", type: "text/html" }] });
    await render(); await open();
    expect(Array.from(document.querySelectorAll('[role="menuitem"]')).map(element => element.textContent)).toEqual([
        "opds.shelf", "opds.browserMenu.wishlist", "opds.browserMenu.history", "opds.browserMenu.profile", "header.refreshTitle",
    ]);
    expect(mockApi.mock.calls.every(call => call[0] === "opds/getBrowserOptions")).toBe(true);
    await activate(item("wishlist"));
    expect(mockLink).toHaveBeenCalledWith(wishlist, mockLocation, "opds.browserMenu.wishlist");
    await open(); await activate(item("refresh"));
    expect(mockDispatch).toHaveBeenCalledWith(historyActions.refresh.build());
});

test("retains discovered links across feeds and never carries them into another catalog", async () => {
    feed(catalog, { bookshelf: [shelf], wishlist: [wishlist] }); await render();
    mockLocation.pathname = buildRoute("catalog-a", "Child", "https://example.org/child", 3);
    feed("https://example.org/child"); await render(); await open();
    expect(item("shelf")).not.toBeNull(); expect(item("wishlist")).not.toBeNull();
    mockLocation.pathname = buildRoute("catalog-b", "Other", "https://other.example/catalog");
    // The previous response is still in Redux while the new catalog starts loading.
    await render(); await open();
    expect(item("shelf")).toBeNull(); expect(item("wishlist")).toBeNull(); expect(item("logout")).toBeNull();
});

test("opens a discovered custom feed by its title after navigating within the catalog", async () => {
    const custom = { url: "https://example.org/recommendations", title: "Staff Picks", type: "application/opds+json" };
    feed(catalog, { custom: [custom, custom] });
    await render();

    const child = "https://example.org/child";
    mockLocation.pathname = buildRoute("catalog-a", "Child", child, 3);
    feed(child);
    await render();
    await open();

    const entries = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
        .filter(element => element.textContent === custom.title);
    expect(entries).toHaveLength(1);
    await activate(entries[0]);
    expect(mockLink).toHaveBeenCalledWith(custom, mockLocation, custom.title);

    mockLocation.pathname = buildRoute("catalog-b", "Other", "https://other.example/catalog");
    await render();
    await open();
    expect(item(`custom:${custom.url}`)).toBeNull();
});

test("offers logout only on a successful authenticated view and returns to root after clearing credentials", async () => {
    mockApi.mockResolvedValue({ catalogUrl: catalog, links: { shelf }, authenticated: true });
    mockLocation.pathname = buildRoute("catalog-a", "Shelf", shelf.url, 3); feed(shelf.url);
    await render(); await open(); expect(item("logout")).not.toBeNull();
    let finish: () => void;
    mockApi.mockImplementation(method => method === "opds/logoutCatalog" ? new Promise<void>(resolve => { finish = resolve; }) :
        Promise.resolve({ catalogUrl: catalog, links: { shelf }, authenticated: true }));
    await activate(item("logout"));
    expect(mockApi).toHaveBeenLastCalledWith("opds/logoutCatalog", "catalog-a", shelf.url);
    expect(mockNavigate).not.toHaveBeenCalled();
    await React.act(async () => finish());
    expect(mockNavigate).toHaveBeenCalledWith(buildRoute("catalog-a", "My catalog", catalog), { state: mockLocation.state });
});

test("hides logout on an authentication challenge even if credentials are stored", async () => {
    mockApi.mockResolvedValue({ catalogUrl: catalog, links: {}, authenticated: true });
    mockResult = { url: catalog, isSuccess: false, isFailure: true, data: { opds: { title: "Login", auth: {} } } } as THttpGetBrowserResultView;
    await render(); await open(); expect(item("logout")).toBeNull(); expect(item("refresh")).not.toBeNull();
});

test("fetches a JSON profile only when selected and displays an unavailable result safely", async () => {
    feed(catalog, { profile: [profile] }); await render(); await open();
    expect(mockApi.mock.calls.some(call => call[0] === "opds/getUserProfile")).toBe(false);
    mockApi.mockResolvedValue(undefined);
    await activate(item("profile"));
    expect(mockApi).toHaveBeenLastCalledWith("opds/getUserProfile", "catalog-a", profile.url);
    expect(document.querySelector('[role="dialog"]').textContent).toContain("catalog.userProfile.unavailable");
});

test("supports keyboard opening, dismissing, and restoring focus to the options button", async () => {
    const button = host.querySelector("button");
    await React.act(async () => {
        button.focus();
        button.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    await React.act(async () => {
        document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 40)); });
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(button);
});

test("shows Logout when IPC serializes the authenticated request URL as an empty object", async () => {
    mockApi.mockResolvedValue({ catalogUrl: catalog, links: { shelf }, authenticated: true });
    mockLocation.pathname = buildRoute("catalog-a", "Shelf", shelf.url, 3);
    feed(shelf.url);
    mockResult = { ...mockResult, url: {} as URL, responseUrl: shelf.url };
    await render(); await open();
    expect(item("logout")).not.toBeNull();
});
