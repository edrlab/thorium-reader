import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { expect, jest, test } from "@jest/globals";
import PageNavigation from "readium-desktop/renderer/library/components/opds/PageNavigation";

jest.mock("react-redux", () => ({ connect: () => (component: unknown) => component }));
jest.mock("readium-desktop/renderer/common/components/hoc/translator", () => ({
    withTranslator: (component: unknown) => component,
}));
jest.mock("readium-desktop/renderer/library/routing", () => ({ dispatchHistoryPush: jest.fn() }));
jest.mock("readium-desktop/common/keyboard", () => ({ keyboardShortcutsMatch: () => true }));
jest.mock("readium-desktop/renderer/common/keyboard", () => ({
    ensureKeyboardListenerIsInstalled: jest.fn(),
    registerKeyboardListener: jest.fn(),
    unregisterKeyboardListener: jest.fn(),
}));
jest.mock("readium-desktop/renderer/library/opds/route", () => ({
    buildOpdsBrowserRouteWithLink: () => (link: { url: string }) => `/browse/${link.url}`,
}));
jest.mock("readium-desktop/renderer/assets/styles/components/allPublicationsPage.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/arrowFirst-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/arrowLast-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-right.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));

test("pagination uses standalone native buttons, preserves route state, and disables absent destinations", () => {
    const dom = new JSDOM("<!doctype html><html><body><div></div></body></html>");
    const previous = new Map<string, PropertyDescriptor | undefined>();
    for (const [key, value] of Object.entries({
        window: dom.window,
        document: dom.window.document,
        IS_REACT_ACT_ENVIRONMENT: true,
    })) {
        previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    const host = document.querySelector("div")!;
    const root = createRoot(host);
    const historyPush = jest.fn();
    const location = { pathname: "/opds/browse", search: "?keep=1", state: { displayType: "grid" } };
    const Component = PageNavigation as unknown as React.ComponentType<Record<string, unknown>>;
    try {
        act(() =>
            root.render(
                <Component
                    location={location}
                    keyboardShortcuts={{}}
                    historyPush={historyPush}
                    __={(key: string) => key}
                    pageLinks={{ first: [{ url: "first" }], next: [{ url: "next" }], last: [{ url: "last" }] }}
                />,
            ),
        );
        const buttons = host.querySelectorAll("button");
        expect(buttons).toHaveLength(4);
        expect(host.querySelector("button a")).toBeNull();
        expect(buttons[1].disabled).toBe(true);
        expect(buttons[2].getAttribute("aria-label")).toBe("opds.next");
        expect(buttons[2].tabIndex).toBe(0);
        for (const index of [0, 2, 3]) {
            act(() => buttons[index].click());
        }
        expect(historyPush.mock.calls.map((call) => call[0])).toEqual(
            ["first", "next", "last"].map((destination) => ({ ...location, pathname: `/browse/${destination}` })),
        );
        expect(historyPush).toHaveBeenLastCalledWith({ ...location, pathname: "/browse/last" }, location.state);
    } finally {
        act(() => root.unmount());
        dom.window.close();
        for (const [key, descriptor] of previous) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    }
});
