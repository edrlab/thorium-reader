// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app, powerMonitor, session } from "electron";
import { URL_PROTOCOL_OPDS, URL_PROTOCOL_OPDS_MEDIA } from "readium-desktop/common/streamerProtocol";
import { channel as channelSaga, eventChannel } from "redux-saga";
import { customizationStartFileWatcherFromWellKnownFolder } from "readium-desktop/main/customization/watcher";

import { SESSION_PARTITION_AUTH } from "readium-desktop/common/sessions";

import * as debug_ from "debug";
const debug = debug_("readium-desktop:main#redux/sagas/getEventChannel");
debug("_");

export function getAndStartCustomizationWellKnownFileWatchingEventChannel(wellKnownFolder: string) {

    const channel = eventChannel<[string, boolean]>(
        (emit) => {

            const handler = (filePath: string, removed: boolean) => emit([filePath, removed]);

            const watcher = customizationStartFileWatcherFromWellKnownFolder(wellKnownFolder, handler);

            return async () => {
                if (watcher) {
                    await watcher.close();
                }
            };
        },
    );

    return channel;
}

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

// cf src/main/menu.ts:186 - window click
// global reference to this channel
export const getAppActivateEventChannel = (() => {
    const chan = channelSaga<boolean>();

    const handler = () => chan.put(true);
    if (app.listeners("activate").findIndex((v) => v === handler) === -1)
        app.on("activate", handler);

    return () => chan;
})();

export function getShutdownEventChannel() {

    const channel = eventChannel<Electron.Event>(
        (emit) => {

            const handler = (e: Electron.Event) => emit(e);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error TS 2769
            powerMonitor.on("shutdown", handler);

            return () => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error TS 2769
                powerMonitor.removeListener("shutdown", handler);
            };
        },
    );

    return channel;

}

export interface TregisterHttpProtocolHandler {
    request: Electron.ProtocolRequest;
    callback: (response: Electron.ProtocolResponse) => void;
}

export function getOpdsRequestCustomProtocolEventChannel() {

    const channel = eventChannel<TregisterHttpProtocolHandler>(
        (emit) => {
            const authSession = session.fromPartition(SESSION_PARTITION_AUTH, { cache: false });

            if (authSession) {
                const handler = (
                    request: Electron.ProtocolRequest,
                    callback: (response: Electron.ProtocolResponse) => void,
                ) => emit({ request, callback });
                authSession.protocol.registerHttpProtocol(URL_PROTOCOL_OPDS, handler);
            }

            return () => {
                authSession?.protocol.unregisterProtocol(URL_PROTOCOL_OPDS);
            };
        },
    );

    return channel;
}

// HACK!! TODO: FIXME (Electron lifecycle requires this before app.ready, and called only once!)
// see src/main/streamer/streamerNoHttp.ts
// protocol.registerSchemesAsPrivileged([
//     { scheme: URL_PROTOCOL_OPDS_MEDIA, privileges: { bypassCSP: true, corsEnabled: false, stream: true } },
// ]);

export function getOpdsRequestMediaCustomProtocolEventChannel() {

    const channel = eventChannel<TregisterHttpProtocolHandler>(
        (emit) => {

            // Electron.protocol === Electron.session.defaultSession.protocol
            // const xxxSession = session.fromPartition("persist:partitionxxx", { cache: false });

            const handler = (
                request: Electron.ProtocolRequest,
                callback: (response: Electron.ProtocolResponse) => void,
            ) => {
                emit({ request, callback });
            };
            session.defaultSession.protocol.registerStreamProtocol(URL_PROTOCOL_OPDS_MEDIA, handler);

            return () => {
                session.defaultSession.protocol.unregisterProtocol(URL_PROTOCOL_OPDS_MEDIA);
            };
        },
    );

    return channel;
}
