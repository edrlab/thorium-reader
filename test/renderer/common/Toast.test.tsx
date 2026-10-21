import * as React from "react";
import { afterAll, afterEach, beforeAll, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { ToastType } from "readium-desktop/common/models/toast";

jest.mock("electron", () => ({ clipboard: { writeText: jest.fn() } }));
jest.mock("readium-desktop/renderer/assets/styles/components/toasts.scss", () => ({ toast: "toast", closeButton: "closeButton" }));
jest.mock("readium-desktop/renderer/assets/icons/baseline-close-24px.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-down.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/hoc/translator", () => ({ withTranslator: (component: unknown) => component }));

let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
let Toast: typeof import("readium-desktop/renderer/common/components/toast/Toast").Toast;
const globals = new Map<string, PropertyDescriptor | undefined>();

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
    for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent"]) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key as keyof Window] });
    }
    globals.set("IS_REACT_ACT_ENVIRONMENT", Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT"));
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, writable: true, value: true });
    // Load React DOM after installing the browser globals.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ Toast } = require("readium-desktop/renderer/common/components/toast/Toast"));
});

afterEach(async () => {
    if (root) await React.act(async () => root.unmount());
    host?.remove();
});
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("a focus transition does not prevent closing the toast", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    const close = jest.fn();
    const props = { id: "toast-1", type: ToastType.Error, message: "Download failed", close, __: (key: string) => key } as unknown as React.ComponentProps<typeof Toast>;
    await React.act(async () => root.render(<Toast {...props} />));
    const alert = host.querySelector("[role=alert]") as HTMLElement;
    const container = alert.parentElement;
    await React.act(async () => {
        alert.focus();
        container.dispatchEvent(new dom.window.Event("transitionend", { bubbles: true }));
    });
    expect(close).not.toHaveBeenCalled();
    await React.act(async () => (host.querySelector("button") as HTMLButtonElement).click());
    await React.act(async () => container.dispatchEvent(new dom.window.Event("transitionend", { bubbles: true })));
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith("toast-1");
    await React.act(async () => container.dispatchEvent(new dom.window.Event("transitionend", { bubbles: true })));
    expect(close).toHaveBeenCalledTimes(1);
});
