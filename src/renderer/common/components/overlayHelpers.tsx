// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { OverlayArrow } from "react-aria-components";

// Default portals share a layer; later-mounted overlays appear above their parents.
export const OVERLAY_Z_INDEX = 102;

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
