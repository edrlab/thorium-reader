/* eslint-disable @typescript-eslint/no-require-imports -- DOM-dependent modules load after JSDOM globals. */
import * as React from "react";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";

const searchResults = [
    { id: "library-a", name: "Library A", address: "Paris", url: "https://a.example" },
    { id: "library-b", name: "Library B", address: "Lyon", url: "https://b.example" },
];
const addFeed = jest.fn();
const search = jest.fn();
jest.mock("readium-desktop/renderer/common/hooks/useApi", () => ({
    useApi: (_id: unknown, method: string) =>
        method === "apiapp/search" ? [{ data: { result: searchResults } }, search] : [undefined, addFeed],
}));
jest.mock("readium-desktop/renderer/common/hooks/useSelector", () => ({
    useSelector: (selector: (state: unknown) => unknown) =>
        selector({ i18n: { locale: "en" }, settings: { enableAPIAPP: true } }),
}));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({
    useTranslator: () => [(key: string) => key],
}));
jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/inputs.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/modals.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/baseline-close-24px.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/magnifying_glass.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/add-alone.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/outline-info-24px.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-down.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-up.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/followLink-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/library-icon.svg", () => ({}));

let ApiappAddFormDialog: typeof import("readium-desktop/renderer/library/components/dialog/ApiappAddForm").ApiappAddFormDialog;
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
    ({ ApiappAddFormDialog } = require("readium-desktop/renderer/library/components/dialog/ApiappAddForm"));
});

beforeEach(async () => {
    addFeed.mockClear();
    host = document.createElement("div");
    document.body.append(host);
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    await React.act(async () => root.render(<ApiappAddFormDialog />));
    await activate(host.querySelector("button")!);
    // JSDOM does not implement the browser's default form submission.
    document.querySelector("form")!.addEventListener("submit", (event) => event.preventDefault());
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

async function activate(element: HTMLElement) {
    await React.act(async () => {
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
        element.click();
    });
}

test("selecting any result moves focus to Add without submitting, including reselection", async () => {
    // Find the action by its label, independently of the dialog wrapper's button type.
    const add = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (button) => button.textContent === "opds.addForm.addButton",
    )!;
    expect(add).toBeDefined();
    for (const name of ["Library A", "Library B", "Library B"]) {
        const result = Array.from(document.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")).find(
            (button) => button.querySelector("strong")?.textContent === name,
        )!;
        await React.act(async () => result.focus());
        await activate(result);
        expect(document.activeElement).toBe(add);
        expect(document.querySelector("button[aria-pressed=true] strong")?.textContent).toBe(name);
        expect(addFeed).not.toHaveBeenCalled();
    }
    await activate(add);
    expect(addFeed).toHaveBeenCalledTimes(1);
    expect(addFeed).toHaveBeenCalledWith({ title: "Library B", url: "apiapp://library-b:apiapp:https://b.example" });
    expect(document.querySelector("[role=dialog]")).toBeNull();
});
