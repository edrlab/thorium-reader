import * as React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { Slider } from "readium-desktop/renderer/reader/components/ReaderSettings/Slider";

jest.mock("readium-desktop/renderer/assets/styles/components/settings.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/clock-reverse-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/Minus-Bold.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/Plus-bold.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({
    useTranslator: () => [(key: string, args?: { setting: string }) => (args ? `${key}: ${args.setting}` : key)],
}));

let dom: JSDOM;
let root: Root;
let host: HTMLDivElement;
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
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
});
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of savedGlobals) {
        if (descriptor) {
            Object.defineProperty(globalThis, key, descriptor);
        } else {
            Reflect.deleteProperty(globalThis, key);
        }
    }
});

const option = {
    title: "Word spacing",
    defaultValue: "0",
    parameter: "wordSpacing" as const,
    altParameter: "0",
    rem: true,
};

test("spacing buttons advance repeatedly, respect bounds, reset, and expose accessible values", () => {
    const save = jest.fn();
    act(() => root.render(<Slider value="0" option={option} set={save} />));
    const range = host.querySelector("input")!;
    const buttons = host.querySelectorAll("button");
    act(() => buttons[1].click());
    expect(save).not.toHaveBeenCalled();
    act(() => buttons[2].click());
    act(() => buttons[2].click());
    expect(range.value).toBe("2");
    expect(range.getAttribute("aria-valuetext")).toBe("0.125rem");
    expect(save).toHaveBeenLastCalledWith({ wordSpacing: "0.125rem" });
    expect(document.getElementById(range.getAttribute("aria-labelledby")!)?.textContent).toBe("Word spacing");
    expect(buttons[1].getAttribute("aria-label")).toContain("Word spacing");
    expect(buttons[2].getAttribute("aria-label")).toContain("Word spacing");
    for (let i = 0; i < 12; i++) {
        act(() => buttons[2].click());
    }
    expect(range.value).toBe(range.max);
    const callsAtMaximum = save.mock.calls.length;
    act(() => buttons[2].click());
    expect(save).toHaveBeenCalledTimes(callsAtMaximum);
    act(() => buttons[0].click());
    expect(range.value).toBe("0");
    expect(range.getAttribute("aria-valuetext")).toBe("reader.settings.column.auto");
    expect(save).toHaveBeenLastCalledWith({ wordSpacing: "0" });
});

test("unknown values fall back to a valid index and external values resync without saving", () => {
    const save = jest.fn();
    act(() => root.render(<Slider value="unknown" option={{ ...option, defaultValue: "unknown" }} set={save} />));
    expect(host.querySelector("input")!.value).toBe("0");
    expect(host.querySelector("input")!.getAttribute("aria-valuetext")).toBe("reader.settings.column.auto");
    act(() => root.render(<Slider value="0.25rem" option={option} set={save} />));
    expect(host.querySelector("input")!.value).toBe("4");
    expect(save).not.toHaveBeenCalled();
    act(() => host.querySelectorAll("button")[1].click());
    expect(save).toHaveBeenLastCalledWith({ wordSpacing: "0.1875rem" });
});
