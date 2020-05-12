// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app, powerMonitor } from "electron";
import { eventChannel } from "redux-saga";

export function getWindowAllClosedEventChannel() {

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            app.on("window-all-closed", handler);

            return () => {
                app.removeListener("window-all-closed", handler);
            };
        },
    );

    return channel;
}

export function getQuitEventChannel() {

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            app.on("quit", handler);

            return () => {
                app.removeListener("quit", handler);
            };
        },
    );

    return channel;
}

export function getBeforeQuitEventChannel() {

    const channel = eventChannel<Electron.Event>(
        (emit) => {

            const handler = (e: Electron.Event) => emit(e);

            app.on("before-quit", handler);

            return () => {
                app.removeListener("before-quit", handler);
            };
        },
    );

    return channel;
}

export function getAppActivateEventChannel() {

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);
            app.on("activate", handler);

            return () => {
                app.removeListener("activate", handler);
            };
        },
    );

    return channel;
}

export function getShutdownEventChannel() {

    const channel = eventChannel<Electron.Event>(
        (emit) => {

            const handler = (e: Electron.Event) => emit(e);
            powerMonitor.on("shutdown", handler);

            return () => {
                powerMonitor.removeListener("shutdown", handler);
            };
        },
    );

    return channel;

}
