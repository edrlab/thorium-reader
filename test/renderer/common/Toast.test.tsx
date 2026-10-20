import * as React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { clipboard } from "electron";
import { ToastType } from "readium-desktop/common/models/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { build as openToast } from "readium-desktop/common/redux/actions/toast/openRequest";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";

jest.mock("electron", () => ({ clipboard: { writeText: jest.fn() } }));
jest.mock("readium-desktop/renderer/assets/styles/components/toasts.scss", () => ({
    toast: "toast", closeButton: "closeButton", messageButton: "messageButton", leave: "leave",
}));
jest.mock("readium-desktop/renderer/assets/icons/baseline-close-24px.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-down.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/hoc/translator", () => ({
    withTranslator: (component: React.ComponentType<{ __: (key: string) => string }>) => (props: object) =>
        React.createElement(component, { ...props, __: (key: string) => key }),
}));

let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
let ToastManager: typeof import("readium-desktop/renderer/common/components/toast/ToastManager").ToastManager;
const savedGlobals = new Map<string, PropertyDescriptor | undefined>();
const initialToast: ToastState = { open: false, data: "", type: ToastType.Default, publicationIdentifier: undefined };

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
    for (const key of [
        "window", "document", "navigator", "HTMLElement", "HTMLButtonElement", "HTMLInputElement",
        "HTMLTextAreaElement", "HTMLSelectElement", "SVGElement", "DOMRect",
        "Element", "Node", "NodeFilter", "MutationObserver", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent",
        "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame",
    ]) {
        savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key as keyof Window] });
    }
    for (const [key, value] of Object.entries({ IS_REACT_ACT_ENVIRONMENT: true, Notification: jest.fn() })) {
        savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    dom.window.HTMLElement.prototype.scrollIntoView = jest.fn();
    // Load React Aria and React DOM after installing the browser globals.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ ToastManager } = require("readium-desktop/renderer/common/components/toast/ToastManager"));
});

beforeEach(async () => {
    jest.useFakeTimers();
    jest.mocked(clipboard.writeText).mockReset();
    host = document.createElement("div");
    document.body.appendChild(host);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    await render(initialToast);
});

afterEach(async () => {
    await React.act(async () => root.unmount());
    host.remove();
    jest.useRealTimers();
});

afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of savedGlobals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

async function render(toast: ToastState, pubId?: string) {
    await React.act(async () => root.render(<ToastManager toast={toast} locale="en" pubId={pubId} __={(key) => key} />));
}

async function notify(type = ToastType.Error, data = "Download failed", publicationIdentifier?: string) {
    await render({ open: true, type, data, publicationIdentifier });
}

async function advance(milliseconds: number) {
    await React.act(async () => jest.advanceTimersByTime(milliseconds));
}

async function press(element: HTMLElement, key: string) {
    await React.act(async () => {
        element.focus();
        element.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
        element.dispatchEvent(new dom.window.KeyboardEvent("keyup", { key, bubbles: true, cancelable: true }));
    });
}

const dialogs = () => document.querySelectorAll<HTMLElement>("[role=alertdialog]");
const messageButton = () => document.querySelector<HTMLButtonElement>("button[aria-expanded]")!;
const closeButton = () => document.querySelector<HTMLButtonElement>("button.closeButton")!;

test("Enter, Space, and clicking preserve copying and expansion, with accessible names and states", async () => {
    await notify();
    expect(document.querySelector("[role=region]")?.getAttribute("aria-label")).toBeTruthy();
    const alert = document.querySelector("[role=alert]")!;
    expect(alert.textContent).toBe("Download failed");
    const button = messageButton();
    const label = button.getAttribute("aria-labelledby")!.split(" ")
        .map((id) => document.getElementById(id)?.textContent).join(" ");
    expect(label).toBe("Download failed accessibility.copyNotificationAndToggleDetails");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    const message = document.getElementById(button.getAttribute("aria-controls")!);
    expect(message?.textContent).toBe("Download failed");
    expect(document.getElementById(dialogs()[0].getAttribute("aria-labelledby")!)?.textContent).toBe("Download failed");
    await press(button, "Enter");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(clipboard.writeText).toHaveBeenCalledWith("Download failed", "clipboard");
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopied");
    await press(button, " ");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(clipboard.writeText).toHaveBeenCalledTimes(2);
    await React.act(async () => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(clipboard.writeText).toHaveBeenCalledTimes(3);
});

test.each([ToastType.Error, ToastType.Default])("%s notifications persist until explicitly dismissed", async (type) => {
    await notify(type);
    await advance(60000);
    expect(dialogs()).toHaveLength(1);
    await press(closeButton(), "Enter");
    await advance(500);
    expect(dialogs()).toHaveLength(0);
});

test("success confirmations expire after five seconds", async () => {
    await notify(ToastType.Success, "Saved");
    await advance(4999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);
});

test("the no-selection hint carries its explicit five-second timeout through Redux", async () => {
    const action = openToast(ToastType.Default, "Select text before creating an annotation.", undefined, undefined, 5000);
    const state = toastReducer(undefined, action);
    await render(state);
    await advance(4999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);

    // A later prerequisite notice must not inherit the previous hint's timeout.
    await render(toastReducer(state, openToast(ToastType.Default, "Stop playback first")));
    await advance(60000);
    expect(dialogs()).toHaveLength(1);
});

test("error notifications remain persistent even if a timeout is requested", async () => {
    await render(toastReducer(undefined, openToast(ToastType.Error, "Failed", undefined, undefined, 5000)));
    await advance(60000);
    expect(dialogs()).toHaveLength(1);
});

test("success timers pause while focused and resume with the remaining time", async () => {
    await notify(ToastType.Success, "Saved");
    await advance(2000);
    await React.act(async () => messageButton().focus());
    await advance(60000);
    expect(dialogs()).toHaveLength(1);
    const outside = document.createElement("button");
    host.appendChild(outside);
    await React.act(async () => outside.focus());
    await advance(2999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);
});

test("success timers pause on hover without a shortened mouse-exit timeout", async () => {
    await notify(ToastType.Success, "Saved");
    const region = document.querySelector("[role=region]")!;
    await advance(2000);
    await React.act(async () => region.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true })));
    await advance(60000);
    expect(dialogs()).toHaveLength(1);
    await React.act(async () => region.dispatchEvent(new dom.window.MouseEvent("mouseout", { bubbles: true, relatedTarget: host })));
    await advance(2999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);
});

test("success confirmations arriving while the region is focused also pause", async () => {
    await notify();
    await React.act(async () => messageButton().focus());
    await notify(ToastType.Success, "Saved");
    await advance(60000);
    expect(dialogs()).toHaveLength(2);
});

test("success confirmations arriving while the region is hovered also pause", async () => {
    await notify();
    const region = document.querySelector("[role=region]")!;
    await React.act(async () => region.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true })));
    await notify(ToastType.Success, "Saved");
    await advance(60000);
    expect(dialogs()).toHaveLength(2);
});

test("clipboard failures are announced without preventing expansion", async () => {
    jest.mocked(clipboard.writeText).mockImplementation(() => { throw new Error("Clipboard unavailable"); });
    await notify();
    await press(messageButton(), "Enter");
    expect(messageButton().getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopyFailed");
});

test("duplicate errors are suppressed while visible and can appear again after dismissal", async () => {
    await notify();
    await notify();
    expect(dialogs()).toHaveLength(1);
    await press(closeButton(), " ");
    await advance(500);
    expect(dialogs()).toHaveLength(0);
    await notify();
    expect(dialogs()).toHaveLength(1);
});

test("closing a focused toast restores focus to the original control", async () => {
    const outside = document.createElement("button");
    host.appendChild(outside);
    outside.focus();
    await notify();
    await press(closeButton(), "Enter");
    await advance(500);
    expect(document.activeElement).toBe(outside);
});

test("persistent notices do not block later notices and another publication is filtered", async () => {
    await notify(ToastType.Error, "First failure");
    await notify(ToastType.Error, "Second failure");
    expect(dialogs()).toHaveLength(2);
    await render({ open: true, type: ToastType.Error, data: "Other book", publicationIdentifier: "book-2" }, "book-1");
    expect(dialogs()).toHaveLength(2);
});
