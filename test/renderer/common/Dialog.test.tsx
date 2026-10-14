/* eslint-disable @typescript-eslint/no-require-imports -- DOM-dependent modules must load after JSDOM globals. */
import * as React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";

let Dialog: typeof import("readium-desktop/renderer/common/components/Dialog");
let AlertDialog: typeof import("readium-desktop/renderer/common/components/AlertDialog");
let DialogTrigger: typeof import("react-aria-components").DialogTrigger;
let Pressable: typeof import("react-aria-components").Pressable;
let Popover: typeof import("react-aria-components").Popover;
let PopoverDialog: typeof import("react-aria-components").Dialog;
let OverlayTriggerStateContext: typeof import("react-aria-components").OverlayTriggerStateContext;
let useOverlayTriggerState: typeof import("react-stately").useOverlayTriggerState;
let Button: typeof import("react-aria-components").Button;
let FocusScope: typeof import("react-aria").FocusScope;
let PopoverArrow: typeof import("readium-desktop/renderer/common/components/overlayHelpers").PopoverArrow;
let CloseOnAnchorRemoval: typeof import("readium-desktop/renderer/common/components/overlayHelpers").CloseOnAnchorRemoval;
let OVERLAY_Z_INDEX: typeof import("readium-desktop/renderer/common/components/overlayHelpers").OVERLAY_Z_INDEX;
let ViewportBoundary: typeof import("readium-desktop/renderer/common/components/overlayHelpers").ViewportBoundary;
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
    // Load DOM-dependent React Aria modules after creating the browser environment.
    Dialog = require("readium-desktop/renderer/common/components/Dialog");
    ({
        DialogTrigger,
        Pressable,
        Popover,
        Dialog: PopoverDialog,
        Button,
        OverlayTriggerStateContext,
    } = require("react-aria-components"));
    ({ useOverlayTriggerState } = require("react-stately"));
    ({ FocusScope } = require("react-aria"));
    ({
        PopoverArrow,
        CloseOnAnchorRemoval,
        ViewportBoundary,
        OVERLAY_Z_INDEX,
    } = require("readium-desktop/renderer/common/components/overlayHelpers"));
    AlertDialog = require("readium-desktop/renderer/common/components/AlertDialog");
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

test("opens, labels, dismisses, and restores focus using the default portal", async () => {
    const onClose = jest.fn();
    await React.act(async () =>
        root.render(
            <Dialog.Root>
                <Dialog.Trigger asChild>
                    <button>Open</button>
                </Dialog.Trigger>
                <Dialog.Portal>
                    <Dialog.Content>
                        <Dialog.Title>Book details</Dialog.Title>
                        <Dialog.Close asChild onClick={onClose}>
                            <button>Close</button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>,
        ),
    );
    const trigger = host.querySelector("button")!;
    trigger.focus();
    await click(trigger);
    const dialog = document.querySelector("[role=\"dialog\"]")!;
    expect(dialog).toBeTruthy();
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("Book details");
    await click(dialog.querySelector("button")!);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[role=\"dialog\"]")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await click(trigger);
    await escape();
    expect(document.querySelector("[role=\"dialog\"]")).toBeNull();
    await click(trigger);
    await click(document.querySelector(".thorium-dialog-overlay")!);
    expect(document.querySelector("[role=\"dialog\"]")).toBeNull();
});

test("confirmation focuses cancel, ignores outside clicks, and runs the action once", async () => {
    const confirm = jest.fn();
    await React.act(async () =>
        root.render(
            <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                    <button>Delete</button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                    <AlertDialog.Content>
                        <AlertDialog.Title>Delete book?</AlertDialog.Title>
                        <AlertDialog.Description>This removes the book.</AlertDialog.Description>
                        <AlertDialog.Cancel asChild>
                            <button data-cancel>Cancel</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button onClick={confirm}>Confirm</button>
                        </AlertDialog.Action>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>,
        ),
    );
    await click(host.querySelector("button")!);
    const dialog = document.querySelector("[role=\"alertdialog\"]")!;
    expect(document.activeElement).toBe(dialog.querySelector("[data-cancel]"));
    expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toBe(
        "This removes the book.",
    );
    await click(document.querySelector(".thorium-dialog-overlay")!);
    expect(document.querySelector("[role=\"alertdialog\"]")).toBe(dialog);
    await click(dialog.querySelector("button:last-child")!);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[role=\"alertdialog\"]")).toBeNull();
});

test("docked panels do not trap focus, block the page, or dismiss on Escape", async () => {
    await React.act(async () =>
        root.render(
            <Dialog.Root modal={false} defaultOpen>
                <Dialog.Trigger asChild>
                    <button>Navigation</button>
                </Dialog.Trigger>
                <Dialog.Portal>
                    <div data-panel>
                        <Dialog.Close asChild>
                            <button data-panel-close>Close</button>
                        </Dialog.Close>
                    </div>
                </Dialog.Portal>
            </Dialog.Root>,
        ),
    );
    expect(document.querySelector("[data-panel]")).toBeTruthy();
    expect(document.querySelector(".thorium-dialog-overlay")).toBeNull();
    host.querySelector("button")!.focus();
    await escape();
    expect(document.querySelector("[data-panel]")).toBeTruthy();
    expect(host.closest("[aria-hidden=\"true\"]")).toBeNull();
    await click(document.querySelector("[data-panel-close]")!);
    expect(document.querySelector("[data-panel]")).toBeNull();
});

test("nested dialogs close independently and return focus to their parent", async () => {
    await React.act(async () =>
        root.render(
            <Dialog.Root triggerless defaultOpen>
                <Dialog.Portal>
                    <Dialog.Content>
                        <Dialog.Title>Parent</Dialog.Title>
                        <Dialog.Root>
                            <Dialog.Trigger asChild>
                                <button data-nested-trigger>Cover</button>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Content>
                                    <Dialog.Title>Cover</Dialog.Title>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>,
        ),
    );
    const trigger = document.querySelector<HTMLButtonElement>("[data-nested-trigger]")!;
    trigger.focus();
    await click(trigger);
    expect(document.querySelectorAll("[role=\"dialog\"]")).toHaveLength(2);
    await escape();
    expect(document.querySelectorAll("[role=\"dialog\"]")).toHaveLength(1);
    expect(document.activeElement).toBe(trigger);
});

test("default-portalled popovers preserve their parent dialog and close independently", async () => {
    await React.act(async () =>
        root.render(
            <Dialog.Root triggerless defaultOpen>
                <Dialog.Portal>
                    <Dialog.Content>
                        <Dialog.Title>Settings</Dialog.Title>
                        <DialogTrigger>
                            <Pressable>
                                <button data-popover-trigger>Options</button>
                            </Pressable>
                            <Popover placement="bottom" offset={0} crossOffset={0} containerPadding={0} style={{ zIndex: OVERLAY_Z_INDEX }}>
                                <PopoverDialog>
                                    <FocusScope autoFocus>
                                        <button data-option>Option</button>
                                    </FocusScope>
                                </PopoverDialog>
                            </Popover>
                        </DialogTrigger>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>,
        ),
    );
    const trigger = document.querySelector<HTMLButtonElement>("[data-popover-trigger]")!;
    await React.act(async () => trigger.focus());
    await click(trigger);
    const option = document.querySelector<HTMLButtonElement>("[data-option]")!;
    expect(option.closest(".react-aria-Modal")).toBeNull();
    const parentOverlay = document.querySelector<HTMLElement>(".thorium-dialog-overlay")!;
    const popover = option.closest<HTMLElement>(".react-aria-Popover")!;
    expect(popover.style.zIndex).toBe(parentOverlay.style.zIndex);
    expect(parentOverlay.compareDocumentPosition(popover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelectorAll("[role=\"dialog\"]")).toHaveLength(2);
    await click(option);
    expect(document.querySelector(".react-aria-Dialog[role=\"dialog\"]")).toBeTruthy();
    option.focus();
    await escape();
    expect(document.querySelector("[data-option]")).toBeNull();
    expect(document.querySelector(".react-aria-Dialog[role=\"dialog\"]")).toBeTruthy();
    expect(document.activeElement).toBe(trigger);
    await click(trigger);
    await click(parentOverlay);
    expect(document.querySelector("[data-option]")).toBeNull();
    expect(parentOverlay.isConnected).toBe(true);
    expect(document.activeElement).toBe(trigger);
});

test("a dialog opened from a menu stays above the popover and closes independently", async () => {
    await React.act(async () =>
        root.render(
            <DialogTrigger>
                <Pressable>
                    <button data-menu-trigger>Menu</button>
                </Pressable>
                <Popover placement="bottom" offset={0} crossOffset={0} containerPadding={0} style={{ zIndex: OVERLAY_Z_INDEX }}>
                    <PopoverDialog>
                        <FocusScope autoFocus>
                            <Dialog.Root>
                                <Dialog.Trigger asChild>
                                    <button data-info-trigger>About publication</button>
                                </Dialog.Trigger>
                                <Dialog.Portal>
                                    <Dialog.Content>
                                        <Dialog.Title>About publication</Dialog.Title>
                                    </Dialog.Content>
                                </Dialog.Portal>
                            </Dialog.Root>
                        </FocusScope>
                    </PopoverDialog>
                </Popover>
            </DialogTrigger>,
        ),
    );
    await click(document.querySelector("[data-menu-trigger]")!);
    const popover = document.querySelector<HTMLElement>(".react-aria-Popover")!;
    await click(document.querySelector("[data-info-trigger]")!);
    const dialogOverlay = document.querySelector<HTMLElement>(".thorium-dialog-overlay")!;
    expect(Number(popover.style.zIndex)).toBe(Number(dialogOverlay.style.zIndex));
    expect(popover.compareDocumentPosition(dialogOverlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.activeElement?.closest(".react-aria-Dialog")).toBeTruthy();
    await escape();
    expect(document.querySelector(".thorium-dialog-overlay")).toBeNull();
    expect(document.querySelector("[data-info-trigger]")).toBeTruthy();
});

test("popover arrows preserve RAC centering while rotating the SVG toward the trigger", async () => {
    const rotations = { top: "", bottom: "rotate(180deg)", left: "rotate(-90deg)", right: "rotate(90deg)" };
    for (const placement of ["top", "bottom", "left", "right"] as const) {
        await React.act(async () =>
            root.render(
                <DialogTrigger key={placement}>
                    <Pressable>
                        <button data-arrow-trigger>Open</button>
                    </Pressable>
                    <Popover
                        placement={placement}
                        offset={0}
                        crossOffset={0}
                        containerPadding={0}
                        shouldFlip={false}
                        style={{ zIndex: OVERLAY_Z_INDEX }}
                    >
                        <PopoverDialog>
                            <FocusScope autoFocus>
                                <button>Option</button>
                                <PopoverArrow style={{ fill: "blue" }} />
                            </FocusScope>
                        </PopoverDialog>
                    </Popover>
                </DialogTrigger>,
            ),
        );
        await click(document.querySelector("[data-arrow-trigger]")!);
        const arrow = document.querySelector<HTMLElement>(".react-aria-OverlayArrow")!;
        const svg = arrow.querySelector("svg")!;
        expect(arrow.style.transform).toBe(
            placement === "top" || placement === "bottom" ? "translateX(-50%)" : "translateY(-50%)",
        );
        expect(arrow.style[placement]).toBe("100%");
        expect(svg.style.transform).toBe(rotations[placement]);
        expect(svg.style.display).toBe("block");
        expect(svg.style.fill).toBe("blue");
    }
});

test("native close buttons run their action once and restore focus", async () => {
    const onSave = jest.fn();
    await React.act(async () =>
        root.render(
            <DialogTrigger>
                <Pressable>
                    <button data-trigger>Options</button>
                </Pressable>
                <Popover placement="bottom" offset={0} crossOffset={0} containerPadding={0} style={{ zIndex: OVERLAY_Z_INDEX }}>
                    <PopoverDialog>
                        <FocusScope autoFocus>
                            <form>
                                <Button slot="close" type="button" onPress={onSave}>
                                    Save
                                </Button>
                            </form>
                        </FocusScope>
                    </PopoverDialog>
                </Popover>
            </DialogTrigger>,
        ),
    );
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
    const bookmarkPopoverTriggerRef = React.createRef<HTMLLIElement>();
    function Toolbar({ open }: { open: boolean }) {
        const state = useOverlayTriggerState({ isOpen: open, onOpenChange: onChange });
        return (
            <OverlayTriggerStateContext.Provider value={state}>
                <li ref={bookmarkPopoverTriggerRef}>
                    <input type="checkbox" aria-label="Bookmark" />
                </li>
                <Popover triggerRef={bookmarkPopoverTriggerRef} placement="bottom end" offset={18}>
                    <PopoverDialog aria-label="Bookmark">
                        <FocusScope autoFocus>
                            <Button slot="close" data-edit>
                                Edit bookmark
                            </Button>
                        </FocusScope>
                    </PopoverDialog>
                </Popover>
            </OverlayTriggerStateContext.Provider>
        );
    }
    const view = (open: boolean) => <Toolbar open={open} />;
    await React.act(async () => root.render(view(false)));
    await click(document.querySelector("input")!);
    expect(onChange).not.toHaveBeenCalled();
    await React.act(async () => root.render(view(true)));
    await React.act(settle);
    expect(document.querySelector("[data-edit]")).toBeTruthy();
    expect(document.activeElement).toBe(document.querySelector("[data-edit]"));
    await click(document.querySelector("[data-edit]")!);
    expect(onChange).toHaveBeenLastCalledWith(false);
    onChange.mockClear();
    await React.act(async () => document.querySelector<HTMLButtonElement>("[data-edit]")!.focus());
    await escape();
    expect(onChange).toHaveBeenLastCalledWith(false);
});

test("popover preserves per-edge collision space and closes when its anchor detaches", async () => {
    await React.act(async () =>
        root.render(
            <DialogTrigger>
                <Pressable>
                    <button data-trigger>Options</button>
                </Pressable>
                <ViewportBoundary top={180} bottom={100}>
                    {(boundaryElement) => (
                        <Popover
                            boundaryElement={boundaryElement}
                            placement="bottom"
                            offset={0}
                            crossOffset={0}
                            containerPadding={0}
                            style={{ zIndex: OVERLAY_Z_INDEX }}
                        >
                            <PopoverDialog>
                                <FocusScope autoFocus>
                                    <CloseOnAnchorRemoval />
                                    <button data-option>Option</button>
                                </FocusScope>
                            </PopoverDialog>
                        </Popover>
                    )}
                </ViewportBoundary>
            </DialogTrigger>,
        ),
    );
    await click(document.querySelector("[data-trigger]")!);
    const boundary = Array.from(document.body.children).find(
        (element) => (element as HTMLElement).style.visibility === "hidden",
    ) as HTMLElement;
    expect(boundary.style.top).toBe("180px");
    expect(boundary.style.left).toBe("0px");
    const trigger = document.querySelector("[data-trigger]")!;
    const parent = trigger.parentElement!;
    await React.act(async () => {
        trigger.remove();
        await settle();
    });
    expect(document.querySelector("[data-option]")).toBeNull();
    expect(boundary.style.bottom).toBe("100px");
    // Restore React's owned DOM before unmounting the test tree.
    parent.appendChild(trigger);
});

test("controlled dialogs open programmatically and preserve deliberate focus on close", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const onChange = jest.fn();
    const view = (isOpen: boolean) => (
        <Dialog.Root triggerless isOpen={isOpen} onOpenChange={onChange}>
            <Dialog.Portal>
                <Dialog.Content>
                    <Dialog.Title>Passphrase</Dialog.Title>
                    <input autoFocus data-password />
                    <Dialog.Close asChild>
                        <button>Close</button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
    await React.act(async () => root.render(view(false)));
    expect(document.querySelector("[role=\"dialog\"]")).toBeNull();
    await React.act(async () => root.render(view(true)));
    await React.act(settle);
    expect(document.activeElement).toBe(document.querySelector("[data-password]"));
    await click(document.querySelector(".react-aria-Dialog button")!);
    expect(onChange).toHaveBeenLastCalledWith(false);
    await React.act(async () => root.render(view(false)));
    outside.focus();
    await React.act(settle);
    expect(document.activeElement).toBe(outside);
    outside.remove();
});

test("native popovers support keyboard opening, tab navigation, and focus restoration", async () => {
    await React.act(async () =>
        root.render(
            <DialogTrigger>
                <Button data-keyboard-trigger>Options</Button>
                <Popover style={{ zIndex: OVERLAY_Z_INDEX }}>
                    <PopoverDialog>
                        <FocusScope autoFocus>
                            <button data-first>First</button>
                            <Button slot="close" data-last>
                                Close
                            </Button>
                        </FocusScope>
                    </PopoverDialog>
                </Popover>
            </DialogTrigger>,
        ),
    );
    const trigger = document.querySelector<HTMLButtonElement>("[data-keyboard-trigger]")!;
    await React.act(async () => trigger.focus());
    await React.act(async () => {
        trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
        trigger.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true }));
        await settle();
    });
    await React.act(settle);
    const first = document.querySelector<HTMLButtonElement>("[data-first]")!;
    const last = document.querySelector<HTMLButtonElement>("[data-last]")!;
    expect(document.activeElement).toBe(first);
    await React.act(async () => {
        first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", code: "Tab", bubbles: true, cancelable: true }));
        await settle();
    });
    expect(document.activeElement).toBe(last);
    await escape();
    expect(document.querySelector("[data-first]")).toBeNull();
    expect(document.activeElement).toBe(trigger);
});
