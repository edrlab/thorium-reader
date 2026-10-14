// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { createPortal } from "react-dom";
import { OverlayArrow, OverlayTriggerStateContext, PopoverContext, useSlottedContext } from "react-aria-components";

// Default portals share a layer; later-mounted overlays appear above their parents.
export const OVERLAY_Z_INDEX = 102;

/** A CSS-sized viewport rectangle for overlays that must leave room for toolbars. */
export function ViewportBoundary({
    top = 0,
    bottom = 0,
    children,
}: {
    top?: number;
    bottom?: number;
    children: (boundary: HTMLElement | undefined) => React.ReactNode;
}) {
    const [boundary, setBoundary] = React.useState<HTMLDivElement>();
    return (
        <>
            {createPortal(
                <div
                    ref={setBoundary}
                    aria-hidden="true"
                    data-overlay-boundary
                    style={{
                        position: "fixed",
                        visibility: "hidden",
                        pointerEvents: "none",
                        top,
                        bottom,
                        left: 0,
                        right: 0,
                    }}
                />,
                document.body,
            )}
            {children(boundary)}
        </>
    );
}

/** Mounted inside a native popover only while open, for virtualized/scrolled lists. */
export function CloseOnAnchorRemoval(): undefined {
    const context = useSlottedContext(PopoverContext);
    const state = React.useContext(OverlayTriggerStateContext);
    React.useEffect(() => {
        const trigger = context?.triggerRef?.current;
        if (!trigger || !state) {
            return undefined;
        }
        const observer = new MutationObserver(() => {
            if (!trigger.isConnected) {
                state.close();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [context?.triggerRef, state]);
    return undefined;
}

/** The shared artwork; positioning and centering belong to RAC's OverlayArrow. */
export function PopoverArrow({ width = 10, height = 5, style, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <OverlayArrow>
            {({ placement }) => (
                <svg
                    {...props}
                    width={width}
                    height={height}
                    viewBox="0 0 30 10"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    style={{
                        display: "block",
                        ...style,
                        transform:
                            placement === "bottom"
                                ? "rotate(180deg)"
                                : placement === "left"
                                  ? "rotate(-90deg)"
                                  : placement === "right"
                                    ? "rotate(90deg)"
                                    : undefined,
                    }}
                >
                    <polygon points="0,0 30,0 15,10" />
                </svg>
            )}
        </OverlayArrow>
    );
}
