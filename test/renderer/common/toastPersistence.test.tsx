import * as React from "react";
import { afterAll, afterEach, beforeAll, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { clipboard } from "electron";
import { ToastType } from "readium-desktop/common/models/toast";

jest.mock("electron", () => ({ clipboard: { writeText: jest.fn() } }));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
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
    globals.set("Notification", Object.getOwnPropertyDescriptor(globalThis, "Notification"));
    Object.defineProperty(globalThis, "Notification", { configurable: true, writable: true, value: jest.fn() });
    // Load React DOM after installing the browser globals.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ Toast } = require("readium-desktop/renderer/common/components/toast/Toast"));
});

afterEach(async () => {
    if (root) await React.act(async () => root.unmount());
    host?.remove();
    jest.useRealTimers();
    jest.mocked(clipboard.writeText).mockReset();
});
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

async function renderToast(close = jest.fn(), displaySystemNotification = false) {
    host = document.createElement("div");
    document.body.appendChild(host);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    const props = { id: "toast-test", type: ToastType.Error, message: "A notification message", close,
        displaySystemNotification, __: (key: string) => key } as unknown as React.ComponentProps<typeof Toast>;
    await React.act(async () => root.render(<Toast {...props} />));
    return close;
}

test("visible notifications survive timeout, focus and blur until dismissed", async () => {
    jest.useFakeTimers();
    const close = await renderToast();
    const alert = host.querySelector("[role=alert]") as HTMLElement;
    await React.act(async () => {
        alert.focus();
        alert.blur();
        jest.advanceTimersByTime(60000);
    });
    expect(close).not.toHaveBeenCalled();
    expect(host.querySelector("[role=alert]")?.textContent).toBe("A notification message");
});

test("focus transitions do not consume dismissal and close is delivered once", async () => {
    jest.useFakeTimers();
    const close = await renderToast();
    const alert = host.querySelector("[role=alert]") as HTMLElement;
    const container = alert.parentElement;
    await React.act(async () => {
        alert.focus();
        container.dispatchEvent(new dom.window.Event("transitionend", { bubbles: true }));
    });
    expect(close).not.toHaveBeenCalled();
    await React.act(async () => (host.querySelector("button") as HTMLButtonElement).click());
    await React.act(async () => {
        container.dispatchEvent(new dom.window.Event("transitionend", { bubbles: true }));
        container.dispatchEvent(new dom.window.Event("transitionend", { bubbles: true }));
        jest.runOnlyPendingTimers();
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith("toast-test");
});

test("unmount clears a pending dismissal fallback", async () => {
    jest.useFakeTimers();
    const close = await renderToast();
    await React.act(async () => (host.querySelector("button") as HTMLButtonElement).click());
    await React.act(async () => root.unmount());
    await React.act(async () => jest.runOnlyPendingTimers());
    expect(close).not.toHaveBeenCalled();
});

test("system notifications release their unused in-app queue entry", async () => {
    const close = await renderToast(jest.fn(), true);
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith("toast-test");
});
