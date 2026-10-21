// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { VisuallyHidden } from "react-aria-components";

export interface NavigationAnnouncementHandle {
    announce: (message: string) => void;
}

export const NavigationAnnouncement = React.forwardRef<NavigationAnnouncementHandle, { enabled: boolean }>(
    function NavigationAnnouncement({ enabled }, ref) {
        const [message, setMessage] = React.useState("");
        const timer = React.useRef<number | undefined>(undefined);

        React.useEffect(() => {
            if (!enabled) setMessage("");
            return () => window.clearTimeout(timer.current);
        }, [enabled]);

        React.useImperativeHandle(ref, () => ({
            announce: (nextMessage) => {
                if (!enabled) return;
                window.clearTimeout(timer.current);
                // Clear before the debounce so identical navigation messages produce
                // another live-region update, without creating notification cards.
                setMessage("");
                timer.current = window.setTimeout(() => {
                    timer.current = undefined;
                    setMessage(nextMessage);
                }, 800);
            },
        }), [enabled]);

        return (
            <VisuallyHidden>
                <div role="alert" aria-atomic="true">{message}</div>
            </VisuallyHidden>
        );
    },
);
