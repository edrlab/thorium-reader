import * as React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { clipboard } from "electron";
import { Toast } from "readium-desktop/renderer/common/components/toast/Toast";

jest.mock("electron", () => ({ clipboard: { writeText: jest.fn() } }));
jest.mock("readium-desktop/preprocessor-directives", () => ({ _APP_NAME: "Thorium" }));
jest.mock("readium-desktop/renderer/assets/styles/components/toasts.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/baseline-close-24px.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("readium-desktop/renderer/common/components/hoc/translator", () => ({
    withTranslator: (component: unknown) => component,
}));

let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const savedGlobals = new Map<string, PropertyDescriptor | undefined>();
beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>");
    for (const [key, value] of Object.entries({
        window: dom.window,
        document: dom.window.document,
        IS_REACT_ACT_ENVIRONMENT: true,
    })) {
        savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
});
beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(clipboard.writeText).mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
});
afterEach(() => {
    act(() => root.unmount());
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

const translate = (key: string) => key;

test("notifications persist, expose details and copy actions, and dismiss exactly once", () => {
    const close = jest.fn();
    act(() => root.render(<Toast id="notice" message="A long notification" close={close} __={translate} />));
    act(() => jest.advanceTimersByTime(60000));
    expect(close).not.toHaveBeenCalled();
    const buttons = host.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(buttons[0].getAttribute("aria-controls")!)?.textContent).toBe("A long notification");
    act(() => buttons[0].click());
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    act(() => buttons[1].click());
    expect(clipboard.writeText).toHaveBeenCalledWith("A long notification", "clipboard");
    expect(host.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopied");
    act(() => buttons[2].click());
    act(() => buttons[2].click());
    act(() => jest.advanceTimersByTime(400));
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith("notice");
});

test("clipboard failure reports status and pending dismissal is cleaned up on unmount", () => {
    const close = jest.fn();
    jest.mocked(clipboard.writeText).mockImplementation(() => {
        throw new Error("Clipboard unavailable");
    });
    act(() => root.render(<Toast id="notice" message="Message" close={close} __={translate} />));
    act(() => host.querySelectorAll("button")[1].click());
    expect(host.querySelector("[role=status]")?.textContent).toBe("accessibility.notificationCopyFailed");
    act(() => host.querySelectorAll("button")[2].click());
    act(() => root.render(<></>));
    act(() => jest.advanceTimersByTime(400));
    expect(close).not.toHaveBeenCalled();
});
