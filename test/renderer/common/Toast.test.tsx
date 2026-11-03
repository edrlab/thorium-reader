import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { clipboard, ipcRenderer } from "electron";
import { JSDOM } from "jsdom";
import * as React from "react";
import type { Root } from "react-dom/client";
import { ToastType } from "readium-desktop/common/models/toast";
import { build as openToast } from "readium-desktop/common/redux/actions/toast/openRequest";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";

jest.mock("electron", () => {
    const { EventEmitter } = jest.requireActual<typeof import("events")>("events");
    return { clipboard: { writeText: jest.fn() }, ipcRenderer: Object.assign(new EventEmitter(), { send: jest.fn() }) };
});
jest.mock("readium-desktop/renderer/assets/styles/components/toasts.scss", () => ({
    toast: "toast",
    closeButton: "closeButton",
    message: "message",
    toast_open: "toast_open",
    leave: "leave",
    copyStatus: "copyStatus",
    messageButton: "messageButton",
}));
jest.mock("readium-desktop/renderer/assets/icons/baseline-close-24px.svg", () => ({}));
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
const initialToast: ToastState = { open: false, data: "", type: ToastType.Info, publicationIdentifier: undefined };

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
    for (const key of [
        "window",
        "document",
        "navigator",
        "HTMLElement",
        "HTMLButtonElement",
        "HTMLInputElement",
        "HTMLTextAreaElement",
        "HTMLSelectElement",
        "SVGElement",
        "DOMRect",
        "Element",
        "Node",
        "NodeFilter",
        "MutationObserver",
        "Event",
        "CustomEvent",
        "MouseEvent",
        "KeyboardEvent",
        "getComputedStyle",
        "requestAnimationFrame",
        "cancelAnimationFrame",
    ]) {
        savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value: dom.window[key as keyof Window],
        });
    }
    for (const [key, value] of Object.entries({ IS_REACT_ACT_ENVIRONMENT: true, Notification: jest.fn() })) {
        savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    Object.defineProperty(dom.window.navigator, "clipboard", { configurable: true, value: {
        writeText: (text: string) => Promise.resolve(clipboard.writeText(text)),
    } });
    dom.window.HTMLElement.prototype.scrollIntoView = jest.fn();
    // Load React Aria and React DOM after installing the browser globals.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ ToastManager } = require("readium-desktop/renderer/common/components/toast/ToastManager"));
});

beforeEach(async () => {
    jest.useFakeTimers();
    jest.mocked(clipboard.writeText).mockReset();
    jest.mocked(Notification).mockClear();
    jest.mocked(ipcRenderer.send).mockImplementation((channel) => {
        if (channel === "accessibility-support-query") ipcRenderer.emit("accessibility-support-changed", {}, false);
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    await render(initialToast);
});

afterEach(async () => {
    await React.act(async () => root.unmount());
    host.remove();
    jest.restoreAllMocks();
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
    await React.act(async () =>
        root.render(<ToastManager toast={toast} locale="en" pubId={pubId} __={(key) => key} />),
    );
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
const messageAction = () => document.querySelector<HTMLButtonElement>("button.messageButton")!;
const closeButton = () => document.querySelector<HTMLButtonElement>("button.closeButton")!;
const expanded = () => document.querySelector(".message")?.classList.contains("toast_open");

test("F6 enters the native toast region without redirecting focus to a toast or action", async () => {
    const outside = document.createElement("button");
    host.appendChild(outside);
    outside.focus();
    await notify();
    const container = dialogs()[0];
    const tabStops = [container, ...Array.from(container.querySelectorAll<HTMLElement>("button, [tabindex]"))].filter(
        (element) => element.tabIndex >= 0,
    );
    expect(container.tabIndex).toBe(0);
    expect(tabStops).toEqual([container, messageAction(), closeButton()]);
    expect(messageAction().tagName).toBe("BUTTON");
    expect(messageAction().type).toBe("button");
    expect(messageAction().getAttribute("aria-label")).toBe("accessibility.copyNotificationInstruction");
    const alert = document.querySelector("[role=alert]")!;
    expect(alert.textContent).toBe("Download failed");
    expect(alert.querySelector("button, [aria-expanded]")).toBeNull();
    expect(container.querySelectorAll("button")).toHaveLength(2);
    expect(container.querySelector("[aria-expanded]")).toBeNull();
    expect(alert.contains(messageAction())).toBe(false);
    expect(messageAction().hasAttribute("aria-describedby")).toBe(false);
    expect(closeButton().getAttribute("aria-label")).toBe("accessibility.closeNotification");
    expect(document.activeElement).toBe(outside);
    await press(outside, "F6");
    expect(document.activeElement).toBe(document.querySelector("[role=region]"));
    await press(closeButton(), "Enter");
    expect(clipboard.writeText).not.toHaveBeenCalled();
    await advance(500);
    expect(dialogs()).toHaveLength(0);
    expect(document.activeElement).toBe(outside);
});

test("Enter, Space and clicking copy and expand with accessible confirmation while focus remains on the message button", async () => {
    await notify();
    const action = messageAction();
    await press(action, "Enter");
    expect(expanded()).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledWith("Download failed");
    expect(document.querySelector(".copyStatus")?.textContent).toBe("accessibility.notificationCopied");
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopied");
    expect(action.hasAttribute("aria-describedby")).toBe(false);
    expect(action.getAttribute("aria-label")).toBe("accessibility.copyNotificationInstruction");
    expect(action.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(action);
    await press(action, " ");
    expect(expanded()).toBe(false);
    expect(clipboard.writeText).toHaveBeenCalledTimes(2);
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopied");
    expect(action.hasAttribute("aria-describedby")).toBe(false);
    await React.act(async () => (document.querySelector(".message") as HTMLElement).click());
    expect(expanded()).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledTimes(3);
    expect(document.activeElement).toBe(action);
    await React.act(async () => dialogs()[0].click());
    expect(expanded()).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledTimes(3);
    expect(document.activeElement).toBe(action);
    await React.act(async () => closeButton().focus());
    expect(expanded()).toBe(false);
    expect(Notification).not.toHaveBeenCalled();
});

test("dismissing a focused toast restores focus to the remaining toast dialog", async () => {
    await notify(ToastType.Error, "First failure");
    const remainingToast = dialogs()[0];
    await notify(ToastType.Error, "Second failure");
    await press(closeButton(), "Enter");
    await advance(500);
    expect(dialogs()).toHaveLength(1);
    expect(document.activeElement).toBe(remainingToast);
});

test.each([ToastType.Success, ToastType.Info, ToastType.Error])(
    "%s notifications expire after five seconds regardless of screen-reader support",
    async (type) => {
        await React.act(async () => {
            ipcRenderer.emit("accessibility-support-changed", {}, true);
        });
        await notify(type, "Notification");
        await advance(2000);
        await React.act(async () => {
            ipcRenderer.emit("accessibility-support-changed", {}, false);
            ipcRenderer.emit("accessibility-support-changed", {}, true);
        });
        await advance(2999);
        expect(dialogs()).toHaveLength(1);
        await advance(1);
        expect(dialogs()).toHaveLength(0);
    },
);

test("the no-selection hint uses the fixed five-second timeout after Redux", async () => {
    const action = openToast(ToastType.Info, "Select text before creating an annotation.");
    const state = toastReducer(undefined, action);
    await render(state);
    await advance(4999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);

    // Errors use the same timeout after an informational toast expires.
    await render(toastReducer(state, openToast(ToastType.Error, "Failed")));
    await advance(4999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);
});

test("success timers pause while focused and resume with the remaining time", async () => {
    await notify(ToastType.Success, "Saved");
    await advance(2000);
    await React.act(async () => messageAction().focus());
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
    await React.act(async () =>
        region.dispatchEvent(new dom.window.MouseEvent("mouseout", { bubbles: true, relatedTarget: host })),
    );
    await advance(2999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);
});

test("success confirmations arriving while the region is focused also pause", async () => {
    await notify();
    await React.act(async () => messageAction().focus());
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
    jest.mocked(clipboard.writeText).mockImplementation(() => {
        throw new Error("Clipboard unavailable");
    });
    await notify();
    await press(messageAction(), "Enter");
    expect(expanded()).toBe(true);
    expect(document.querySelector(".copyStatus")?.textContent).toBe("accessibility.notificationCopyFailed");
    expect(messageAction().getAttribute("aria-label")).toBe("accessibility.copyNotificationInstruction");
    expect(messageAction().getAttribute("aria-disabled")).toBe("false");
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopyFailed");
    expect(document.activeElement).toBe(messageAction());
    expect(Notification).not.toHaveBeenCalled();
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

test("independent notices do not block later notices and another publication is filtered", async () => {
    await notify(ToastType.Error, "First failure");
    await notify(ToastType.Error, "Second failure");
    expect(dialogs()).toHaveLength(2);
    await render({ open: true, type: ToastType.Error, data: "Other book", publicationIdentifier: "book-2" }, "book-1");
    expect(dialogs()).toHaveLength(2);
});

test("repeated accessibility responses cannot dismiss a focused toast", async () => {
    await notify(ToastType.Success, "Saved");
    await advance(2000);
    await React.act(async () => {
        ipcRenderer.emit("accessibility-support-changed", {}, false);
        ipcRenderer.emit("accessibility-support-changed", {}, false);
    });
    await React.act(async () => messageAction().focus());
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


test("copies diagnostic text without rendering or announcing it", async () => {
    const copyText = "Safe message\nError: internal failure\n    at importBook (main.js:12:4)";
    const action = openToast(ToastType.Error, "Safe message", undefined, undefined, copyText);
    const state = toastReducer(undefined, JSON.parse(JSON.stringify(action)));
    await render(state);
    expect(document.body.textContent).not.toContain("internal failure");
    await press(messageAction(), "Enter");
    expect(clipboard.writeText).toHaveBeenCalledWith(copyText);
    expect(document.body.textContent).not.toContain("internal failure");
    await render(toastReducer(state, openToast(ToastType.Info, "Ordinary notice")));
    expect(toastReducer(state, openToast(ToastType.Info, "Ordinary notice")).copyText).toBeUndefined();
});

test("reports asynchronous clipboard rejection and permits retry", async () => {
    const write = jest.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("Permission denied"))
        .mockResolvedValueOnce(undefined);
    await notify();
    await press(messageAction(), "Enter");
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopyFailed");
    expect(messageAction().getAttribute("aria-disabled")).toBe("false");
    await press(messageAction(), "Enter");
    expect(write).toHaveBeenCalledTimes(2);
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopied");
});

test("waits for clipboard completion before announcing success", async () => {
    let complete: () => void;
    jest.spyOn(navigator.clipboard, "writeText").mockImplementation(() => new Promise<void>(resolve => { complete = resolve; }));
    await notify();
    await press(messageAction(), "Enter");
    expect(document.querySelector("[role=status]")?.textContent).toBe("");
    await React.act(async () => complete());
    expect(document.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopied");
});

test("a duplicate failure keeps its focus and timer but copies the latest diagnostics", async () => {
    const first: ToastState = { open: true, type: ToastType.Error, data: "Failed", copyText: "First stack", publicationIdentifier: undefined };
    await render(first);
    await advance(2000);
    const button = messageAction();
    await press(button, "Enter");
    await render({ ...first, copyText: "Latest stack" });
    expect(dialogs()).toHaveLength(1);
    expect(messageAction()).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(first.copyText).toBe("First stack");
    await press(button, "Enter");
    expect(clipboard.writeText).toHaveBeenLastCalledWith("Latest stack");
    const outside = document.createElement("button");
    host.appendChild(outside);
    await React.act(async () => outside.focus());
    await advance(2999);
    expect(dialogs()).toHaveLength(1);
    await advance(1);
    expect(dialogs()).toHaveLength(0);
});
