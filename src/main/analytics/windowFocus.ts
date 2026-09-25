// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { BrowserWindow } from "electron";
import { performance } from "node:perf_hooks";

import { TAnalyticsWindowName } from "readium-desktop/common/analytics/window";

const debug = debug_("readium-desktop:main:analytics:window-focus");

export type TLogWindowFocusTime = (
    windowName: TAnalyticsWindowName,
    focusTimeMs: number,
) => void | Promise<void>;

interface IActiveWindowFocus {
    browserWindow: BrowserWindow;
    windowName: TAnalyticsWindowName;
    startedAt: number;
    logWindowFocusTime: TLogWindowFocusTime;
}

let activeWindowFocus: IActiveWindowFocus | undefined;
const registeredWindows = new WeakSet<BrowserWindow>();
const pendingWindowFocusOperations = new Set<Promise<void>>();

const finishActiveWindowFocus = async (): Promise<void> => {
    if (!activeWindowFocus) {
        return;
    }

    const completedWindowFocus = activeWindowFocus;
    activeWindowFocus = undefined;

    const focusTimeMs = Math.round(performance.now() - completedWindowFocus.startedAt);
    if (focusTimeMs <= 0) {
        return;
    }

    await completedWindowFocus.logWindowFocusTime(
        completedWindowFocus.windowName,
        focusTimeMs,
    );
};

const finishWindowFocus = (browserWindow: BrowserWindow): Promise<void> => {
    if (activeWindowFocus?.browserWindow !== browserWindow) {
        return Promise.resolve();
    }

    return finishActiveWindowFocus();
};

const startWindowFocus = (
    browserWindow: BrowserWindow,
    windowName: TAnalyticsWindowName,
    logWindowFocusTime: TLogWindowFocusTime,
): Promise<void> => {
    if (activeWindowFocus?.browserWindow === browserWindow) {
        return Promise.resolve();
    }

    const previousWindowFocusCompletion = finishActiveWindowFocus();

    activeWindowFocus = {
        browserWindow,
        windowName,
        startedAt: performance.now(),
        logWindowFocusTime,
    };

    return previousWindowFocusCompletion;
};

const handleFocusOperation = (operation: Promise<void>): void => {
    const trackedOperation = operation
        .catch((err) => debug("Window focus analytics operation failed", err));

    pendingWindowFocusOperations.add(trackedOperation);
    trackedOperation
        .then(() => pendingWindowFocusOperations.delete(trackedOperation))
        .catch(() => { /* trackedOperation already handles failures */ });
};

export const registerWindowFocusTracking = (
    browserWindow: BrowserWindow,
    windowName: TAnalyticsWindowName,
    logWindowFocusTime: TLogWindowFocusTime,
): void => {
    if (registeredWindows.has(browserWindow)) {
        return;
    }
    registeredWindows.add(browserWindow);

    browserWindow.on("focus", () => {
        handleFocusOperation(
            startWindowFocus(browserWindow, windowName, logWindowFocusTime),
        );
    });
    browserWindow.on("blur", () => {
        handleFocusOperation(finishWindowFocus(browserWindow));
    });
    browserWindow.on("closed", () => {
        handleFocusOperation(finishWindowFocus(browserWindow));
    });

    if (!browserWindow.isDestroyed() && browserWindow.isFocused()) {
        handleFocusOperation(
            startWindowFocus(browserWindow, windowName, logWindowFocusTime),
        );
    }
};

export const flushActiveWindowFocus = async (): Promise<void> => {
    const activeWindowFocusCompletion = finishActiveWindowFocus();
    const pendingOperations = Array.from(pendingWindowFocusOperations);

    await Promise.all([
        ...pendingOperations,
        activeWindowFocusCompletion,
    ]);
};
