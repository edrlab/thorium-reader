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

test("native details and close controls have accessible names and disclosure state", async () => {
    await renderToast();
    const buttons = host.querySelectorAll("button");
    expect(buttons[0].type).toBe("button");
    expect(buttons[0].textContent).toBe("accessibility.notificationDetails");
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(buttons[0].getAttribute("aria-controls")!)?.textContent).toBe("A notification message");
    await React.act(async () => buttons[0].click());
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect(buttons[2].getAttribute("aria-label")).toBe("accessibility.closeDialog");
});

test("copy action announces success without creating a system notification", async () => {
    await renderToast();
    const notifications = jest.mocked(globalThis.Notification);
    notifications.mockClear();
    await React.act(async () => (host.querySelectorAll("button")[1] as HTMLButtonElement).click());
    expect(clipboard.writeText).toHaveBeenCalledWith("A notification message", "clipboard");
    expect(host.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopied");
    expect(notifications).not.toHaveBeenCalled();
});

test("copy failures produce accessible feedback", async () => {
    await renderToast();
    jest.mocked(clipboard.writeText).mockImplementationOnce(() => { throw new Error("Clipboard unavailable"); });
    await React.act(async () => (host.querySelectorAll("button")[1] as HTMLButtonElement).click());
    expect(host.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopyFailed");
});

test("message text is no longer an implicit copy control", async () => {
    await renderToast();
    const alert = host.querySelector("[role=alert]") as HTMLElement;
    await React.act(async () => alert.click());
    expect(clipboard.writeText).not.toHaveBeenCalled();
    expect(alert.hasAttribute("tabindex")).toBe(false);
});

test("moving between controls preserves details and pauses the existing timeout", async () => {
    jest.useFakeTimers();
    const close = await renderToast();
    const buttons = host.querySelectorAll("button");
    await React.act(async () => { buttons[0].focus(); buttons[0].click(); });
    await React.act(async () => buttons[1].focus());
    await React.act(async () => jest.advanceTimersByTime(60000));
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect(close).not.toHaveBeenCalled();
    const outside = document.createElement("button");
    host.appendChild(outside);
    await React.act(async () => outside.focus());
    await React.act(async () => jest.advanceTimersByTime(5000));
    await React.act(async () => jest.advanceTimersByTime(400));
    expect(close).toHaveBeenCalledTimes(1);
});
