// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Popover, PopoverProps, OverlayArrow, Pressable } from "react-aria-components";
import { mergeProps } from "react-aria";
import { useOverlayTriggerState } from "react-stately";
import { DialogPortalContext } from "./Dialog";

interface RootProps extends React.PropsWithChildren {
    modal?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}
interface ContextValue {
    state: ReturnType<typeof useOverlayTriggerState>;
    triggerRef: React.RefObject<HTMLElement>;
    modal: boolean;
}
const Context = React.createContext<ContextValue | undefined>(undefined);
const PortalContext = React.createContext<HTMLElement | undefined>(undefined);

/** Shared popover composition for library and reader renderers, backed by RAC. */
export function Root({ children, modal = false, open, defaultOpen, onOpenChange }: RootProps) {
    const state = useOverlayTriggerState({ isOpen: open, defaultOpen, onOpenChange });
    const triggerRef = React.useRef<HTMLElement>(null);
    return <Context.Provider value={{ state, triggerRef, modal }}>{children}</Context.Provider>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean };
type TriggerElement = React.DOMElement<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement> & {
    "data-state"?: "open" | "closed";
}, HTMLElement>;
function buttonChild({ asChild, children, ...props }: ButtonProps): TriggerElement {
    return asChild
        ? (() => {
            const child = React.Children.only(children) as TriggerElement;
            return React.cloneElement(child, mergeProps(child.props, props));
        })()
        : React.createElement("button", { type: "button", ...props }, children);
}

export function Trigger(props: ButtonProps) {
    const { state, triggerRef } = React.useContext(Context)!;
    const child = buttonChild(props);
    // Reader toolbar checkboxes manage opening themselves; the list item is only an anchor.
    if (child.type === "li") {
        return React.cloneElement(child, { ref: triggerRef });
    }
    return <Pressable onPress={() => state.toggle()}>
        {React.cloneElement(child, { ref: triggerRef, "aria-haspopup": "dialog", "aria-expanded": state.isOpen,
            "data-state": state.isOpen ? "open" : "closed" })}
    </Pressable>;
}

export function Close(props: ButtonProps) {
    const { state } = React.useContext(Context)!;
    const child = buttonChild(props);
    // Close even when a submit handler prevents the form's default action.
    return React.cloneElement(child, mergeProps(child.props, { onClick: () => state.close() }));
}

export function Portal({ children, container }: React.PropsWithChildren<{ container?: HTMLElement }>) {
    const dialogContainer = React.useContext(DialogPortalContext);
    return <PortalContext.Provider value={dialogContainer ?? container}>{children}</PortalContext.Provider>;
}

interface ContentProps extends Omit<PopoverProps, "children"> {
    children?: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    alignOffset?: number;
    collisionBoundary?: Element;
    collisionPadding?: number | Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    avoidCollisions?: boolean;
    hideWhenDetached?: boolean;
}

export const Content = React.forwardRef<HTMLElement, ContentProps>(({
    side = "bottom", align = "center", sideOffset = 0, alignOffset = 0, collisionBoundary,
    collisionPadding = 0, avoidCollisions = true, hideWhenDetached, children, ...props
}, ref) => {
    const { state, triggerRef, modal } = React.useContext(Context)!;
    const container = React.useContext(PortalContext);
    const trigger = triggerRef.current;
    const [insetBoundary, setInsetBoundary] = React.useState<HTMLElement>();
    const { top = 0, right = 0, bottom = 0, left = 0 } = typeof collisionPadding === "number" ? {} : collisionPadding;
    const asymmetricPadding = typeof collisionPadding !== "number";
    // RAC accepts a uniform inset. An invisible boundary preserves per-edge reserved toolbar space.
    React.useLayoutEffect(() => {
        if (!state.isOpen || !asymmetricPadding) {
            return undefined;
        }
        const boundary = document.createElement("div");
        boundary.setAttribute("aria-hidden", "true");
        Object.assign(boundary.style, { position: "fixed", visibility: "hidden", pointerEvents: "none" });
        const update = () => {
            const rect = collisionBoundary?.getBoundingClientRect();
            Object.assign(boundary.style, {
                top: `${(rect?.top ?? 0) + top}px`, left: `${(rect?.left ?? 0) + left}px`,
                width: `${Math.max(0, (rect?.width ?? document.documentElement.clientWidth) - left - right)}px`,
                height: `${Math.max(0, (rect?.height ?? document.documentElement.clientHeight) - top - bottom)}px`,
            });
        };
        update();
        document.body.appendChild(boundary);
        setInsetBoundary(boundary);
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
            boundary.remove();
            setInsetBoundary(undefined);
        };
    }, [state.isOpen, asymmetricPadding, collisionBoundary, top, right, bottom, left]);
    React.useEffect(() => {
        if (!hideWhenDetached || !state.isOpen || !trigger) {
            return undefined;
        }
        const observer = new MutationObserver(() => {
            if (!trigger.isConnected) {
                state.close();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [hideWhenDetached, state, trigger]);
    const placement: PopoverProps["placement"] = align === "center" ? side
        : side === "top" || side === "bottom" ? `${side} ${align}`
            : `${side} ${align === "start" ? "top" : "bottom"}`;
    return <Popover {...props} ref={ref} triggerRef={triggerRef} isOpen={state.isOpen} onOpenChange={state.setOpen}
        isNonModal={!modal} UNSTABLE_portalContainer={container}
        placement={placement} offset={sideOffset} crossOffset={alignOffset}
        boundaryElement={insetBoundary ?? collisionBoundary ?? undefined}
        containerPadding={typeof collisionPadding === "number" ? collisionPadding : 0} shouldFlip={avoidCollisions}
        aria-label={props["aria-label"] ?? trigger?.getAttribute("aria-label") ?? trigger?.getAttribute("title") ?? trigger?.textContent ?? undefined}>
        {children}
    </Popover>;
});
Content.displayName = "PopoverContent";

export function Arrow({ width = 10, height = 5, ...props }: React.SVGProps<SVGSVGElement>) {
    return <OverlayArrow style={({ placement }) => ({
        transform: placement === "bottom" ? "rotate(180deg)" : placement === "left" ? "rotate(-90deg)" : placement === "right" ? "rotate(90deg)" : undefined,
    })}>
        <svg {...props} width={width} height={height} viewBox="0 0 30 10" preserveAspectRatio="none" aria-hidden="true">
            <polygon points="0,0 30,0 15,10" />
        </svg>
    </OverlayArrow>;
}
