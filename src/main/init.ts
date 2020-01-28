// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END=

// import * as debug_ from "debug";
// import { syncIpc, winIpc } from "readium-desktop/common/ipc";
// import { ReaderMode } from "readium-desktop/common/models/reader";
// import { AppWindow, AppWindowType } from "readium-desktop/common/models/win";
// import { i18nActions, readerActions } from "readium-desktop/common/redux/actions";
// // import { NetStatus } from "readium-desktop/common/redux/states/net";
// import { diMainGet } from "readium-desktop/main/di";
// import { streamerActions } from "readium-desktop/main/redux/actions/";

// // Logger
// const debug = debug_("readium-desktop:main:init");
// debug("_");

// // Callback called when a window is opened
// export const winOpenCallback = (appWindow: AppWindow) => {
//     // Send information to the new window

//     const store = diMainGet("store");
//     const state = store.getState();
//     const webContents = appWindow.browserWindow.webContents;

//     // Send the id to the new window
//     webContents.send(winIpc.CHANNEL, {
//         type: winIpc.EventType.IdResponse,
//         payload: {
//             winId: appWindow.identifier,
//         },
//     } as winIpc.EventPayload);

//     // // Init network on window
//     // let actionNet = null;

//     // switch (state.net.status) {
//     //     case NetStatus.Online:
//     //         actionNet = netActions.online.build();
//     //         break;
//     //     case NetStatus.Offline:
//     //     default:
//     //         actionNet = netActions.offline.build();
//     //         break;
//     // }

//     // // Send network status
//     // webContents.send(syncIpc.CHANNEL, {
//     //     type: syncIpc.EventType.MainAction,
//     //     payload: {
//     //         action: actionNet,
//     //     },
//     // } as syncIpc.EventPayload);

//     // Send reader information
//     // even for library view , just it's undefined
//     webContents.send(syncIpc.CHANNEL, {
//         type: syncIpc.EventType.MainAction,
//         payload: {
//             action: readerActions.openSuccess.build(state.reader.readers[appWindow.identifier]),
//         },
//     } as syncIpc.EventPayload);

//     // Send reader config
//     webContents.send(syncIpc.CHANNEL, {
//         type: syncIpc.EventType.MainAction,
//         payload: {
//             action: readerActions.configSetSuccess.build(state.reader.config),
//         },
//     } as syncIpc.EventPayload);

//     // Send reader mode
//     webContents.send(syncIpc.CHANNEL, {
//         type: syncIpc.EventType.MainAction,
//         payload: {
//             action: readerActions.detachModeSuccess.build(state.reader.mode),
//         },
//     } as syncIpc.EventPayload);

//     // Send locale
//     webContents.send(syncIpc.CHANNEL, {
//         type: syncIpc.EventType.MainAction,
//         payload: {
//             action: i18nActions.setLocale.build(state.i18n.locale),
//         },
//     } as syncIpc.EventPayload);

//     // // Send update info
//     // webContents.send(syncIpc.CHANNEL, {
//     //     type: syncIpc.EventType.MainAction,
//     //     payload: {
//     //         action: {
//     //             type: updateActions.latestVersion.ID,
//     //             payload: updateActions.latestVersion.build(
//     //                 state.update.status,
//     //                 state.update.latestVersion,
//     //                 state.update.latestVersionUrl),
//     //         },
//     //     },
//     // } as syncIpc.EventPayload);
// };

// // Callback called when a window is closed
// export const winCloseCallback = (appWindow: AppWindow) => {
//     const store = diMainGet("store");

//     const winRegistry = diMainGet("win-registry");
//     const readerWindows = winRegistry.getReaderWindows();

//     // library window was closed and unregistered
//     // => all reader windows must now be closed too (effectively exiting the app)
//     if (appWindow.type === AppWindowType.Library) {
//         readerWindows.forEach((w) => w.browserWindow.close());
//         return;
//     }

//     // else: appWindow.type === AppWindowType.Reader
//     const state = store.getState();
//     if (state.reader?.readers) {
//         const readers = Object.values(state.reader.readers);
//         const reader = readers.find((r) => {
//             return r.browserWindowID === appWindow.browserWindowID;
//         });
//         if (reader) {
//             store.dispatch(streamerActions.publicationCloseRequest.build(reader.publicationIdentifier));
//         }
//     }

//     // if there is at least one remaining reader, then leave it/them alone
//     // (it is / they are in detached mode, the library view is visible)
//     if (readerWindows.length > 0) {
//         return;
//     }

//     // else, there is one window left, it is the library
//     // we ensure return to "attached" mode
//     store.dispatch(readerActions.detachModeSuccess.build(ReaderMode.Attached));

//     // if the library is in fact no visible
//     // (i.e. the sole closed reader was in attached mode)
//     // then we close the app
//     const libraryWindow = winRegistry.getLibraryWindow();
//     if (libraryWindow) {
//         if (libraryWindow.browserWindow.isMinimized()) {
//             libraryWindow.browserWindow.restore();
//         } else if (!libraryWindow.browserWindow.isVisible()) {
//             libraryWindow.browserWindow.close();
//             return;
//         }
//         libraryWindow.browserWindow.show(); // focuses as well
//     }
// };
