import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { JSDOM } from "jsdom";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { DialogRAC } from "readium-desktop/renderer/common/components/DialogComponent";

jest.mock("readium-desktop/renderer/assets/styles/components/modals.scss", () => ({}));

describe("dialog trigger interactions", () => {
    let dom: JSDOM;
    let root: Root;
    let container: HTMLDivElement;
    const originalGlobals = new Map<string, PropertyDescriptor | undefined>();

    beforeEach(() => {
        dom = new JSDOM("<!doctype html><html><body></body></html>");
        for (const [key, value] of Object.entries({
            window: dom.window,
            document: dom.window.document,
            navigator: dom.window.navigator,
            IS_REACT_ACT_ENVIRONMENT: true,
        })) {
            originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
            Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
        }
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(() => {
        React.act(() => root.unmount());
        dom.window.close();
        for (const [key, descriptor] of originalGlobals) {
            if (descriptor) {
                Object.defineProperty(globalThis, key, descriptor);
            } else {
                Reflect.deleteProperty(globalThis, key);
            }
        }
        originalGlobals.clear();
    });

    const clickTrigger = () => React.act(() => {
        container.querySelector("button").dispatchEvent(new dom.window.MouseEvent("click", {
            bubbles: true, cancelable: true,
        }));
    });

    it("preserves the trigger's click handler before opening the dialog", () => {
        const calls: string[] = [];
        React.act(() => root.render(<DialogRAC
            isOpen={false}
            onOpenChange={() => calls.push("open")}
            trigger={<button onClick={() => calls.push("trigger")}>Open</button>}
        />));
        clickTrigger();
        expect(calls).toEqual(["trigger", "open"]);
        expect(container.querySelector("button").getAttribute("aria-haspopup")).toBe("dialog");
        expect(container.querySelector("button").getAttribute("aria-expanded")).toBe("false");
    });

    it("lets a docked panel trigger toggle without reopening a modal", () => {
        const openDialog = jest.fn();
        function DockedPanel() {
            const [open, setOpen] = React.useState(false);
            return <DialogRAC
                isOpen={false}
                onOpenChange={openDialog}
                trigger={<button aria-pressed={open} aria-expanded={open} aria-haspopup={false} onClick={(event) => {
                    event.preventDefault();
                    setOpen(!open);
                }}>Navigation</button>}
            />;
        }
        React.act(() => root.render(<DockedPanel />));
        clickTrigger();
        expect(container.querySelector("button").getAttribute("aria-pressed")).toBe("true");
        expect(container.querySelector("button").getAttribute("aria-expanded")).toBe("true");
        expect(container.querySelector("button").getAttribute("aria-haspopup")).toBe("false");
        clickTrigger();
        expect(container.querySelector("button").getAttribute("aria-pressed")).toBe("false");
        expect(openDialog).not.toHaveBeenCalled();
    });
});
