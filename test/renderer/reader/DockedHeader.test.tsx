/* eslint-disable @typescript-eslint/no-require-imports -- DOM-dependent modules must load after JSDOM globals. */
import * as React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";

jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/popoverDialog.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/combobox.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/close-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/dockleft-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/dockright-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/dockmodal-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-down.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("readium-desktop/renderer/common/hooks/useReaderConfig", () => ({ useSaveReaderConfig: () => () => {} }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({
    useTranslator: () => [(key: string) => key],
}));
jest.mock("readium-desktop/renderer/common/components/ComboBox", () => ({
    ComboBoxItem: require("react-aria-components").ListBoxItem,
}));

let DockedHeader: typeof import("readium-desktop/renderer/reader/components/DockedHeader").DockedHeader;
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
});

beforeEach(() => {
    ({ DockedHeader } = require("readium-desktop/renderer/reader/components/DockedHeader"));
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

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 50));

async function click(element: Element) {
    await React.act(async () => {
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    });
    await React.act(settle);
}

async function escape() {
    await React.act(async () => {
        document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await React.act(settle);
}

const options = [
    { id: 1, value: "tab-toc", name: "Table of contents", disabled: false, svg: {} },
    { id: 2, value: "tab-bookmark", name: "Bookmarks", disabled: false, svg: {} },
];

function ReaderPanel({ panel }: { panel: "menu" | "settings" }) {
    const [section, setSection] = React.useState("tab-toc");
    const trigger = React.useRef<HTMLButtonElement>(null);
    return (
        <>
            <button>Reader toolbar</button>
            <DockedHeader
                dockedMode
                dockingMode="right"
                isEpub
                panel={panel}
                setSection={setSection}
                dockedModeRef={trigger}
                options={options}
                optionSelected={options.find((option) => option.value === section)!.id}
                section={section}
            />
            <section
                tabIndex={-1}
                data-section={section}
                data-focus-id={panel === "menu" ? `reader-menu-${section}` : `readerSettings_tabs-${section}`}
            >
                <button>Section content</button>
            </section>
        </>
    );
}

async function press(key: string, code: string) {
    await React.act(async () => {
        const target = document.activeElement!;
        target.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true }));
        target.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true }));
    });
    await React.act(settle);
}

test.each(["menu", "settings"] as const)("%s dropdown restores focus after mouse selection", async (panel) => {
    await React.act(async () => root.render(<ReaderPanel panel={panel} />));
    const trigger = document.querySelector<HTMLButtonElement>("button[aria-haspopup=listbox]")!;
    await React.act(async () => trigger.focus());
    await click(trigger);
    await click(
        Array.from(document.querySelectorAll("[role=option]")).find((option) => option.textContent === "Bookmarks")!,
    );
    expect(document.querySelector("[data-section]")?.getAttribute("data-section")).toBe("tab-bookmark");
    expect(document.querySelector("[role=listbox]")).toBeNull();
    expect(document.activeElement).toBe(trigger);
});

test.each(["menu", "settings"] as const)(
    "%s dropdown restores focus after Space selection and Escape",
    async (panel) => {
        await React.act(async () => root.render(<ReaderPanel panel={panel} />));
        const trigger = document.querySelector<HTMLButtonElement>("button[aria-haspopup=listbox]")!;
        await React.act(async () => trigger.focus());
        await press(" ", "Space");
        await press("ArrowDown", "ArrowDown");
        await press(" ", "Space");
        expect(document.querySelector("[data-section]")?.getAttribute("data-section")).toBe("tab-bookmark");
        expect(document.querySelector("[role=listbox]")).toBeNull();
        expect(document.activeElement).toBe(trigger);
        await press(" ", "Space");
        await escape();
        expect(document.activeElement).toBe(trigger);
        expect(document.querySelector("[data-section]")?.getAttribute("data-section")).toBe("tab-bookmark");
    },
);
