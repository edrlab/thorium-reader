/* eslint-disable @typescript-eslint/no-require-imports -- DOM-dependent modules must load after JSDOM globals. */
import * as React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";

jest.mock("readium-desktop/renderer/assets/styles/components/modals.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/close-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/Tooltippy", () => ({
    ToolTippy: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock("readium-desktop/renderer/reader/components/dialog/publicationInfos/TagManager", () => ({
    __esModule: true, default: (): null => null,
}));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({
    useTranslator: () => [(key: string) => key],
}));
// Exercise the reader dialog wiring independently of publication metadata rendering.
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent", () => ({
    PublicationInfoContent: ({ closeDialogCb, handleLinkUrl }: { closeDialogCb: () => void; handleLinkUrl: (url: string) => void }) =>
        <a href="#heading" onClick={(event) => {
            event.preventDefault();
            closeDialogCb();
            handleLinkUrl("https://publication.test/chapter.xhtml#heading");
        }}>Chapter heading</a>,
}));

let publicationInfo: typeof import("readium-desktop/renderer/reader/components/dialog/publicationInfos/PublicationInfo");
let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost" });
    for (const key of [
        "window",
        "document",
        "navigator",
        "HTMLElement",
        "Element",
        "Node",
        "NodeFilter",
        "HTMLInputElement",
        "HTMLButtonElement",
        "HTMLTextAreaElement",
        "HTMLAnchorElement",
        "SVGElement",
        "MutationObserver",
        "CustomEvent",
        "Event",
        "KeyboardEvent",
        "MouseEvent",
        "getComputedStyle",
        "requestAnimationFrame",
        "cancelAnimationFrame",
    ]) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value: dom.window[key as keyof Window],
        });
    }
    const extraGlobals = {
        IS_REACT_ACT_ENVIRONMENT: true,
        CSS: { escape: require("css.escape") as (value: string) => string },
        ResizeObserver: class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
        HTMLSelectElement: dom.window.HTMLSelectElement,
        HTMLFieldSetElement: dom.window.HTMLFieldSetElement,
        HTMLIFrameElement: dom.window.HTMLIFrameElement,
        DocumentFragment: dom.window.DocumentFragment,
    };
    for (const [key, value] of Object.entries(extraGlobals)) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    publicationInfo = require("readium-desktop/renderer/reader/components/dialog/publicationInfos/PublicationInfo");
});

beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
});

afterEach(async () => {
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


test("heading navigation restores reader controls before loading the target", async () => {
    let shortcutsEnabled = false;
    const navigate = jest.fn((_url: string) => {
        // Restoring shortcuts must not depend on a successful webview load callback.
        expect(shortcutsEnabled).toBe(true);
    });
    const initialState = {
        dialog: {
            open: true,
            type: DialogTypeName.PublicationInfoReader,
            data: { publication: {}, handleLinkUrl: navigate },
        },
        reader: { info: {} },
    };
    const store = createStore((state: typeof initialState = initialState, action: { type: string }) =>
        action.type === "close" ? { ...state, dialog: { ...state.dialog, open: false } } : state,
    );
    const handlePublicationInfo = jest.fn((open: boolean) => {
        shortcutsEnabled = !open;
        if (!open) store.dispatch({ type: "close" });
    });
    const { PublicationInfoReaderWithRAC, PublicationInfoReaderWithRACContent, PublicationInfoReaderWithRACTrigger } = publicationInfo;
    await React.act(async () => root.render(
        <Provider store={store}>
            <PublicationInfoReaderWithRAC handlePublicationInfo={handlePublicationInfo}>
                <PublicationInfoReaderWithRACTrigger>Publication information</PublicationInfoReaderWithRACTrigger>
                <PublicationInfoReaderWithRACContent />
            </PublicationInfoReaderWithRAC>
        </Provider>,
    ));
    expect(document.querySelector("[role=dialog]")).not.toBeNull();
    await React.act(async () => document.querySelector<HTMLAnchorElement>("a[href='#heading']")!.click());
    expect(handlePublicationInfo).toHaveBeenCalledWith(false);
    expect(store.getState().dialog.open).toBe(false);
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(navigate).toHaveBeenCalledWith("https://publication.test/chapter.xhtml#heading");
    expect(shortcutsEnabled).toBe(true);
});
