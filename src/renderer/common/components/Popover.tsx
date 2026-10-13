// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { DialogPortalContext, DialogPopoverContext } from "./Dialog";

export { Root, Trigger, Anchor, Close, Arrow } from "@radix-ui/react-popover";

/** Keep existing popovers inside the owning RAC modal's focus and dismissal scope. */
export function Portal(props: Popover.PopoverPortalProps) {
    const dialogContainer = React.useContext(DialogPortalContext);
    return <Popover.Portal {...props} container={dialogContainer ?? props.container} />;
}

function ActivePopover(): React.ReactNode {
    const registerPopover = React.useContext(DialogPopoverContext);
    React.useEffect(() => registerPopover?.(), [registerPopover]);
    return undefined;
}

// RAC and Radix register Escape independently. While a child popover is open,
// let Radix dismiss it before enabling Escape on the parent dialog again.
export const Content = React.forwardRef<HTMLDivElement, Popover.PopoverContentProps>((props, ref) =>
    <Popover.Content {...props} ref={ref}><ActivePopover />{props.children}</Popover.Content>,
);
Content.displayName = "PopoverContent";
