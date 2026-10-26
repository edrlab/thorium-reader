// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const getFocusTarget = (focusId: string): HTMLElement | undefined => {
    const elementWithFocusId = Array.from(document.querySelectorAll<HTMLElement>("[data-focus-id]"))
        .find((element) => element.dataset.focusId === focusId);
    if (elementWithFocusId) {
        return elementWithFocusId;
    }

    return document.getElementById(focusId) ?? undefined;
};

export const focusElement = (element: HTMLElement): void => {
    // React Aria tab panels omit tabIndex when they contain another tabbable
    // element. The reader shortcuts focus the panel itself, so make these
    // programmatic focus targets focusable without adding them to the tab order.
    if (!element.hasAttribute("tabindex") && element.tabIndex < 0) {
        element.tabIndex = -1;
    }

    element.focus();
};
