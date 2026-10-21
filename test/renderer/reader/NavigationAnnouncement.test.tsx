import * as React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import type { NavigationAnnouncementHandle } from "readium-desktop/renderer/reader/components/NavigationAnnouncement";

let dom: JSDOM;
let root: Root;
let host: HTMLDivElement;
let announcement: React.RefObject<NavigationAnnouncementHandle>;
let NavigationAnnouncement: typeof import("readium-desktop/renderer/reader/components/NavigationAnnouncement").NavigationAnnouncement;
const savedGlobals = new Map<string, PropertyDescriptor | undefined>();

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
    for (const [key, value] of Object.entries({
        window: dom.window,
        document: dom.window.document,
        navigator: dom.window.navigator,
        HTMLElement: dom.window.HTMLElement,
        HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
        HTMLInputElement: dom.window.HTMLInputElement,
        HTMLSelectElement: dom.window.HTMLSelectElement,
        SVGElement: dom.window.SVGElement,
        Event: dom.window.Event,
        KeyboardEvent: dom.window.KeyboardEvent,
        Element: dom.window.Element,
        Node: dom.window.Node,
        IS_REACT_ACT_ENVIRONMENT: true,
    })) {
        savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ NavigationAnnouncement } = require("readium-desktop/renderer/reader/components/NavigationAnnouncement"));
});

beforeEach(async () => {
    jest.useFakeTimers();
    host = document.createElement("div");
    document.body.appendChild(host);
    announcement = React.createRef<NavigationAnnouncementHandle>();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
    await render(true);
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

async function render(enabled: boolean) {
    await React.act(async () => root.render(<NavigationAnnouncement ref={announcement} enabled={enabled} />));
}

async function announce(message: string) {
    await React.act(async () => announcement.current!.announce(message));
}

async function advance(milliseconds: number) {
    await React.act(async () => jest.advanceTimersByTime(milliseconds));
}

const alert = () => host.querySelector("[role=alert]")!;

test("announces navigation after 800 ms without creating notification controls or moving focus", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    try {
        expect(alert().textContent).toBe("");
        expect(alert().getAttribute("aria-atomic")).toBe("true");
        await announce("Screen next");
        await advance(799);
        expect(alert().textContent).toBe("");
        await advance(1);
        expect(alert().textContent).toBe("Screen next");
        expect(host.querySelector("button, [role=alertdialog]")).toBeNull();
        expect(document.activeElement).toBe(outside);
    } finally {
        outside.remove();
    }
});

test("rapid navigation announces only the final direction after the full debounce", async () => {
    await announce("Screen next");
    await advance(400);
    await announce("Screen previous");
    await advance(799);
    expect(alert().textContent).toBe("");
    await advance(1);
    expect(alert().textContent).toBe("Screen previous");
});

test.each(["Screen next", "Screen previous"])(
    "identical %s navigation clears and restores the same alert",
    async (message) => {
        const region = alert();
        await announce(message);
        await advance(800);
        expect(region.textContent).toBe(message);
        await announce(message);
        expect(alert()).toBe(region);
        expect(region.textContent).toBe("");
        await advance(799);
        expect(region.textContent).toBe("");
        await advance(1);
        expect(region.textContent).toBe(message);
    },
);

test("disabling enhanced mode cancels pending feedback, clears the alert, and ignores navigation", async () => {
    await announce("Screen next");
    await advance(400);
    await render(false);
    await advance(800);
    expect(alert().textContent).toBe("");
    await announce("Screen previous");
    await advance(800);
    expect(alert().textContent).toBe("");
    await render(true);
    await announce("Screen previous");
    await advance(800);
    expect(alert().textContent).toBe("Screen previous");
    await render(false);
    expect(alert().textContent).toBe("");
});

test("unmounting cancels the pending announcement timer", async () => {
    await announce("Screen next");
    await React.act(async () => root.render(null));
    expect(jest.getTimerCount()).toBe(0);
});
