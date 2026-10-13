import * as React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";

let Dialog: typeof import("readium-desktop/renderer/common/components/Dialog");
let AlertDialog: typeof import("readium-desktop/renderer/common/components/AlertDialog");
let Popover: typeof import("readium-desktop/renderer/common/components/Popover");
let Menu: typeof import("readium-desktop/renderer/common/components/menu/Menu").default;
let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();

jest.mock("readium-desktop/renderer/assets/styles/components/dropdown.scss", () => ({
    dropdown_menu: "dropdown_menu", dropdown_trigger: "dropdown_trigger", PopoverArrow: "PopoverArrow",
}));

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost" });
    for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "NodeFilter",
        "HTMLInputElement", "HTMLButtonElement", "HTMLTextAreaElement", "HTMLAnchorElement", "SVGElement",
        "MutationObserver", "CustomEvent", "Event", "KeyboardEvent", "MouseEvent", "getComputedStyle",
        "requestAnimationFrame", "cancelAnimationFrame"]) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key as keyof Window] });
    }
    const extraGlobals = {
        IS_REACT_ACT_ENVIRONMENT: true,
        ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
        HTMLSelectElement: dom.window.HTMLSelectElement,
        HTMLFieldSetElement: dom.window.HTMLFieldSetElement,
        HTMLIFrameElement: dom.window.HTMLIFrameElement,
        DocumentFragment: dom.window.DocumentFragment,
        location: dom.window.location,
    };
    for (const [key, value] of Object.entries(extraGlobals)) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    // Load DOM-dependent React Aria modules after creating the browser environment.
    Dialog = require("readium-desktop/renderer/common/components/Dialog");
    AlertDialog = require("readium-desktop/renderer/common/components/AlertDialog");
    Popover = require("readium-desktop/renderer/common/components/Popover");
    Menu = require("readium-desktop/renderer/common/components/menu/Menu").default;
});

beforeEach(() => {
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
        await settle();
    });
    await React.act(settle);
}

async function escape() {
    await React.act(async () => {
        document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await settle();
    });
    await React.act(settle);
}

test("opens, labels, dismisses, and restores focus in a custom portal", async () => {
    const onClose = jest.fn();
    const portal = document.createElement("div");
    document.body.appendChild(portal);
    await React.act(async () => root.render(<Dialog.Root>
        <Dialog.Trigger asChild><button>Open</button></Dialog.Trigger>
        <Dialog.Portal container={portal}>
            <Dialog.Content>
                <Dialog.Title>Book details</Dialog.Title>
                <Dialog.Close asChild onClick={onClose}><button>Close</button></Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>));
    const trigger = host.querySelector("button")!;
    trigger.focus();
    await click(trigger);
    const dialog = portal.querySelector('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("Book details");
    await click(dialog.querySelector("button")!);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(portal.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await click(trigger);
    await escape();
    expect(portal.querySelector('[role="dialog"]')).toBeNull();
    await click(trigger);
    await click(portal.querySelector(".thorium-dialog-overlay")!);
    expect(portal.querySelector('[role="dialog"]')).toBeNull();
    portal.remove();
});

test("confirmation focuses cancel, ignores outside clicks, and runs the action once", async () => {
    const confirm = jest.fn();
    await React.act(async () => root.render(<AlertDialog.Root>
        <AlertDialog.Trigger asChild><button>Delete</button></AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Content>
                <AlertDialog.Title>Delete book?</AlertDialog.Title>
                <AlertDialog.Description>This removes the book.</AlertDialog.Description>
                <AlertDialog.Cancel asChild><button data-cancel>Cancel</button></AlertDialog.Cancel>
                <AlertDialog.Action asChild><button onClick={confirm}>Confirm</button></AlertDialog.Action>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>));
    await click(host.querySelector("button")!);
    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(document.activeElement).toBe(dialog.querySelector("[data-cancel]"));
    expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toBe("This removes the book.");
    await click(document.querySelector(".thorium-dialog-overlay")!);
    expect(document.querySelector('[role="alertdialog"]')).toBe(dialog);
    await click(dialog.querySelector("button:last-child")!);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
});

test("docked panels do not trap focus, block the page, or dismiss on Escape", async () => {
    await React.act(async () => root.render(<Dialog.Root modal={false} defaultOpen>
        <Dialog.Trigger asChild><button>Navigation</button></Dialog.Trigger>
        <Dialog.Portal><div data-panel>
            <Dialog.Close asChild><button data-panel-close>Close</button></Dialog.Close>
        </div></Dialog.Portal>
    </Dialog.Root>));
    expect(document.querySelector("[data-panel]")).toBeTruthy();
    expect(document.querySelector(".thorium-dialog-overlay")).toBeNull();
    host.querySelector("button")!.focus();
    await escape();
    expect(document.querySelector("[data-panel]")).toBeTruthy();
    expect(host.closest('[aria-hidden="true"]')).toBeNull();
    await click(document.querySelector("[data-panel-close]")!);
    expect(document.querySelector("[data-panel]")).toBeNull();
});

test("nested dialogs close independently and return focus to their parent", async () => {
    await React.act(async () => root.render(<Dialog.Root triggerless defaultOpen>
        <Dialog.Portal><Dialog.Content>
            <Dialog.Title>Parent</Dialog.Title>
            <Dialog.Root>
                <Dialog.Trigger asChild><button data-nested-trigger>Cover</button></Dialog.Trigger>
                <Dialog.Portal><Dialog.Content><Dialog.Title>Cover</Dialog.Title></Dialog.Content></Dialog.Portal>
            </Dialog.Root>
        </Dialog.Content></Dialog.Portal>
    </Dialog.Root>));
    const trigger = document.querySelector<HTMLButtonElement>("[data-nested-trigger]")!;
    trigger.focus();
    await click(trigger);
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2);
    await escape();
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(document.activeElement).toBe(trigger);
});

test("RAC popovers stay within the dialog and Escape closes only the popover", async () => {
    await React.act(async () => root.render(<Dialog.Root triggerless defaultOpen>
        <Dialog.Portal><Dialog.Content>
            <Dialog.Title>Settings</Dialog.Title>
            <Popover.Root modal>
                <Popover.Trigger asChild><button data-popover-trigger>Options</button></Popover.Trigger>
                <Popover.Portal><Popover.Content><button data-option>Option</button></Popover.Content></Popover.Portal>
            </Popover.Root>
        </Dialog.Content></Dialog.Portal>
    </Dialog.Root>));
    await click(document.querySelector("[data-popover-trigger]")!);
    const option = document.querySelector<HTMLButtonElement>("[data-option]")!;
    expect(option.closest(".react-aria-Modal")).toBeTruthy();
    await click(option);
    expect(document.querySelector('.react-aria-Dialog[role="dialog"]')).toBeTruthy();
    option.focus();
    await escape();
    expect(document.querySelector("[data-option]")).toBeNull();
    expect(document.querySelector('.react-aria-Dialog[role="dialog"]')).toBeTruthy();
});

test("a dialog opened from a menu stays above the popover and closes independently", async () => {
    await React.act(async () => root.render(<Popover.Root modal>
        <Popover.Trigger asChild><button data-menu-trigger>Menu</button></Popover.Trigger>
        <Popover.Portal><Popover.Content>
            <Dialog.Root>
                <Dialog.Trigger asChild><button data-info-trigger>About publication</button></Dialog.Trigger>
                <Dialog.Portal><Dialog.Content><Dialog.Title>About publication</Dialog.Title></Dialog.Content></Dialog.Portal>
            </Dialog.Root>
        </Popover.Content></Popover.Portal>
    </Popover.Root>));
    await click(document.querySelector("[data-menu-trigger]")!);
    const popover = document.querySelector<HTMLElement>(".react-aria-Popover")!;
    await click(document.querySelector("[data-info-trigger]")!);
    const dialogOverlay = document.querySelector<HTMLElement>(".thorium-dialog-overlay")!;
    expect(Number(popover.style.zIndex)).toBeLessThan(Number(dialogOverlay.style.zIndex));
    expect(document.activeElement?.closest(".react-aria-Dialog")).toBeTruthy();
    await escape();
    expect(document.querySelector(".thorium-dialog-overlay")).toBeNull();
    expect(document.querySelector("[data-info-trigger]")).toBeTruthy();
});

test("popover arrows preserve RAC centering while rotating the SVG toward the trigger", async () => {
    const rotations = { top: "", bottom: "rotate(180deg)", left: "rotate(-90deg)", right: "rotate(90deg)" };
    for (const placement of ["top", "bottom", "left", "right"] as const) {
        await React.act(async () => root.render(<Popover.Root key={placement} modal>
            <Popover.Trigger asChild><button data-arrow-trigger>Open</button></Popover.Trigger>
            <Popover.Portal><Popover.Content side={placement} avoidCollisions={false}>
                <button>Option</button><Popover.Arrow style={{ fill: "blue" }} />
            </Popover.Content></Popover.Portal>
        </Popover.Root>));
        await click(document.querySelector("[data-arrow-trigger]")!);
        const arrow = document.querySelector<HTMLElement>(".react-aria-OverlayArrow")!;
        const svg = arrow.querySelector("svg")!;
        expect(arrow.style.transform).toBe(placement === "top" || placement === "bottom" ? "translateX(-50%)" : "translateY(-50%)");
        expect(arrow.style[placement]).toBe("100%");
        expect(svg.style.transform).toBe(rotations[placement]);
        expect(svg.style.display).toBe("block");
        expect(svg.style.fill).toBe("blue");
    }
});

test("popover focuses the first enabled action and returns focus to its trigger", async () => {
    await React.act(async () => root.render(<Popover.Root modal>
        <Popover.Trigger asChild><button data-trigger>Menu</button></Popover.Trigger>
        <Popover.Portal><Popover.Content>
            <button disabled>Unavailable</button><button data-first>About publication</button><button>Delete</button>
        </Popover.Content></Popover.Portal>
    </Popover.Root>));
    const trigger = document.querySelector<HTMLButtonElement>("[data-trigger]")!;
    trigger.focus();
    await click(trigger);
    expect(document.activeElement).toBe(document.querySelector("[data-first]"));
    await escape();
    expect(document.activeElement).toBe(trigger);
});

test("a menu above its trigger reserves space for the bottom arrow", async () => {
    const height = jest.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(600);
    const width = jest.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1000);
    const offsetParent = jest.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(document.documentElement);
    const rect = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        const isPopover = this.classList.contains("react-aria-Popover");
        const isTrigger = this.classList.contains("dropdown_trigger");
        return { x: 0, y: isTrigger ? 550 : 0, top: isTrigger ? 550 : 0, left: 0,
            width: isPopover ? 182 : 30, height: isPopover ? 242 : 30,
            right: isPopover ? 182 : 30, bottom: isTrigger ? 580 : isPopover ? 242 : 30, toJSON: () => ({}) };
    });
    const offsetWidth = jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
        return this.classList.contains("react-aria-Popover") ? 182 : 30;
    });
    const offsetHeight = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
        return this.classList.contains("react-aria-Popover") ? 242 : 30;
    });
    try {
        await React.act(async () => root.render(<Menu button={<span>Menu</span>}>
            <button data-first>About publication</button>
        </Menu>));
        const trigger = document.querySelector<HTMLButtonElement>(".dropdown_trigger")!;
        trigger.focus();
        await click(trigger);
        const popover = document.querySelector<HTMLElement>(".react-aria-Popover")!;
        expect(popover.getAttribute("data-placement")).toBe("top");
        const gap = Number.parseFloat(popover.style.bottom) - (600 - 550);
        const arrow = popover.querySelector("svg")!;
        expect(gap).toBe(17);
        expect(gap).toBeGreaterThan(Number(arrow.getAttribute("height")));
        expect(document.activeElement).toBe(document.querySelector("[data-first]"));
    } finally {
        height.mockRestore(); width.mockRestore(); offsetParent.mockRestore(); rect.mockRestore(); offsetWidth.mockRestore(); offsetHeight.mockRestore();
    }
});

test("popover close preserves submit handlers that prevent default and restores focus", async () => {
    const onSave = jest.fn((event: React.MouseEvent) => event.preventDefault());
    await React.act(async () => root.render(<Popover.Root modal>
        <Popover.Trigger asChild><button data-trigger>Options</button></Popover.Trigger>
        <Popover.Portal><Popover.Content>
            <form><Popover.Close type="submit" onClick={onSave}>Save</Popover.Close></form>
        </Popover.Content></Popover.Portal>
    </Popover.Root>));
    const trigger = document.querySelector<HTMLButtonElement>("[data-trigger]")!;
    trigger.focus();
    await click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await click(document.querySelector("form button")!);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(document.querySelector("form")).toBeNull();
    expect(document.activeElement).toBe(trigger);
});

test("controlled toolbar popovers use list items as anchors without toggling their checkbox", async () => {
    const onChange = jest.fn();
    const view = (open: boolean) => <Popover.Root modal open={open} onOpenChange={onChange}>
        <Popover.Trigger asChild><li><input type="checkbox" aria-label="Bookmark" /></li></Popover.Trigger>
        <Popover.Portal><Popover.Content><button data-edit>Edit bookmark</button></Popover.Content></Popover.Portal>
    </Popover.Root>;
    await React.act(async () => root.render(view(false)));
    await click(document.querySelector("input")!);
    expect(onChange).not.toHaveBeenCalled();
    await React.act(async () => root.render(view(true)));
    await React.act(settle);
    expect(document.querySelector("[data-edit]")).toBeTruthy();
    document.querySelector<HTMLButtonElement>("[data-edit]")!.focus();
    await escape();
    expect(onChange).toHaveBeenLastCalledWith(false);
});

test("popover preserves per-edge collision space and closes when its anchor detaches", async () => {
    await React.act(async () => root.render(<Popover.Root modal>
        <Popover.Trigger asChild><button data-trigger>Options</button></Popover.Trigger>
        <Popover.Portal><Popover.Content collisionPadding={{ top: 180, bottom: 100 }} hideWhenDetached>
            <button data-option>Option</button>
        </Popover.Content></Popover.Portal>
    </Popover.Root>));
    await click(document.querySelector("[data-trigger]")!);
    const boundary = Array.from(document.body.children).find((element) =>
        (element as HTMLElement).style.visibility === "hidden") as HTMLElement;
    expect(boundary.style.top).toBe("180px");
    expect(boundary.style.left).toBe("0px");
    const trigger = document.querySelector("[data-trigger]")!;
    const parent = trigger.parentElement!;
    await React.act(async () => {
        trigger.remove();
        await settle();
    });
    expect(document.querySelector("[data-option]")).toBeNull();
    expect(boundary.isConnected).toBe(false);
    // Restore React's owned DOM before unmounting the test tree.
    parent.appendChild(trigger);
});

test("controlled dialogs open programmatically and preserve deliberate focus on close", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const onChange = jest.fn();
    const view = (isOpen: boolean) => <Dialog.Root triggerless isOpen={isOpen} onOpenChange={onChange}>
        <Dialog.Portal><Dialog.Content>
            <Dialog.Title>Passphrase</Dialog.Title>
            <input autoFocus data-password />
            <Dialog.Close asChild><button>Close</button></Dialog.Close>
        </Dialog.Content></Dialog.Portal>
    </Dialog.Root>;
    await React.act(async () => root.render(view(false)));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await React.act(async () => root.render(view(true)));
    await React.act(settle);
    expect(document.activeElement).toBe(document.querySelector("[data-password]"));
    await click(document.querySelector('.react-aria-Dialog button')!);
    expect(onChange).toHaveBeenLastCalledWith(false);
    await React.act(async () => root.render(view(false)));
    outside.focus();
    await React.act(settle);
    expect(document.activeElement).toBe(outside);
    outside.remove();
});
