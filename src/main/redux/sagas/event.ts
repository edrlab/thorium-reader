// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import debug_ from "debug";
import { customizationActions, historyActions, readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    getOpenUrlWithOpdsSchemeEventChannel, getOpenUrlWithThoriumSchemeEventChannel,
    getOpdsNewCatalogsStringUrlChannel,
    getOpenFileFromCliChannel, getOpenTitleFromCliChannel,
} from "readium-desktop/main/event";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put, spawn } from "redux-saga/effects";
import { call as callTyped, take as takeTyped, /*select as selectTyped*/ put as putTyped /*race as raceTyped, delay as delayTyped*/ } from "typed-redux-saga/macro";
import { opdsApi } from "./api";
import { browse } from "./api/browser/browse";
import { addFeed } from "./api/opds/feed";

import { importFromFs, importFromLink } from "./api/publication/import";
import { search } from "./api/publication/search";
import { appActivate } from "./win/library";
import { getAndStartCustomizationWellKnownFileWatchingEventChannel } from "./getEventChannel";
// import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
// import { customizationPackageProvisioning, customizationPackageProvisioningCheckVersion, customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";
// import { ICustomizationProfileError, ICustomizationProfileProvisioned, ICustomizationProfileProvisionedWithError } from "readium-desktop/common/redux/states/customization";
import { URL_HOST_CUSTOMPROFILE, URL_HOST_OPDS_AUTH, URL_PROTOCOL_APP_HANDLER_THORIUM, URL_PROTOCOL_OPDS } from "readium-desktop/common/streamerProtocol";
import { EXT_THORIUM } from "readium-desktop/common/extension";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";
import { getTranslator } from "readium-desktop/common/services/translator";

import * as path from "path";
import * as fs from "fs";import { fileProvisionning } from "./customization";
import { customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";
import { FORCE_PROD_DB_IN_DEV, USER_DATA_FOLDER } from "readium-desktop/common/constant";
import { ToastType } from "readium-desktop/common/models/toast";

// Logger
const debug = debug_("readium-desktop:main:saga:event");

// TODO: check electron app.getPath('logs') instead
// same as main/cli/index
const folderPath = path.join(
    USER_DATA_FOLDER,
    !FORCE_PROD_DB_IN_DEV && (__TH__IS_DEV__ || __TH__IS_CI__) ? "app-logs-dev" : "app-logs",
);
const PROCESS_LOGS = "processLogs.txt";
const appLogs = path.join(
    folderPath,
    PROCESS_LOGS,
);

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
};

export function saga() {
    return all([
        spawn(function*() {

            const chan = getAndStartCustomizationWellKnownFileWatchingEventChannel(customizationWellKnownFolder);

            while (true) {

                try {
                    const [packageFileName, removed] = yield* takeTyped(chan);

                    yield* callTyped(fileProvisionning, packageFileName, removed);
                } catch (e) {

                    debug("ERROR to importFromFs and to open the publication");
                    debug(e);
                }
            }


        }),
        spawn(function*() {

            const chan = getOpenFileFromCliChannel();

            debug(`openFileFromCliChannel loaded and ready, ${chan}, ${typeof chan}`);

            while (true) {

                debug("Wait an event from the queue openFileFromCliChannel ...");

                try {
                    const filePath = yield* takeTyped(chan);

                    debug(`Receive ${filePath} from openFileFromCliChannel`);

                    const fileName = path.basename(filePath);
                    const extension = path.extname(fileName);
                    if (extension === EXT_THORIUM) {

                        debug("It's a custom profile extension");
                        debug("AppActivate Thorium and acquire (provision/activate) the profile");

                        yield* callTyped(appActivate);
                        yield put(customizationActions.acquire.build(filePath));
                        continue ;
                    }

                    const pubViewArray = yield* callTyped(importFromFs, filePath, true /* willBeImmediatelyFollowedByOpen */);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {
                        yield* callTyped(appActivate);
                        yield put(readerActions.openRequest.build(pubView.identifier));
                        yield put(readerActions.detachModeRequest.build());
                    }

                } catch (e) {

                    debug("ERROR to importFromFs and to open the publication");
                    debug(e);
                    yield* putTyped(toastActions.openRequest.build(ToastType.Error, `CLI open file ${e}`));
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenTitleFromCliChannel();

            while (true) {

                try {
                    const title = yield* takeTyped(chan);

                    const pubViewArray = yield* callTyped(search, title);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield* callTyped(appActivate);

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to search the title in db and to open the publication");
                    debug(e);
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenUrlWithThoriumSchemeEventChannel();

            while (true) {

                try {
                    const url = yield* takeTyped(chan);

                    // const prom = new Promise<boolean>(
                    //     (res, _rej) => {

                    //         const request = net.request({ method: "HEAD", url });
                    //         request.on("response", (response) => {
                    //             debug(`URL: ${url}`);
                    //             debug(`STATUS: ${response.statusCode}`);
                    //             debug(`HEADERS: ${JSON.stringify(response.headers)}`);

                    //             if (response.headers["content-type"] === mimeTypes["thorium"]) {
                    //                 debug("This is a thorium custom profile extension");

                    //                 res(true);
                    //             }
                    //         });
                    //     });

                    // debug("THORIUM event custom url scheme received :");
                    // debug("HEAD request to ", url);
                    // const {a: __isATimeout, b: isAProfileExtension} = yield* raceTyped({ a: delayTyped(10000), b: callTyped(() => prom) });
                    // if (isAProfileExtension) {
                    //     yield* putTyped(customizationActions.acquire.build(url));
                    //     return ;
                    // }

                    // handle thorium://<token>/...
                    if (url.startsWith(`${URL_PROTOCOL_APP_HANDLER_THORIUM}://${URL_HOST_CUSTOMPROFILE}/`)) {
                        const profileUrl = url.replace(`${URL_PROTOCOL_APP_HANDLER_THORIUM}://${URL_HOST_CUSTOMPROFILE}/`, "http://");
                        debug("THORIUM customization-profile url", profileUrl);
                        yield* putTyped(customizationActions.acquire.build(profileUrl));
                        continue ;
                    }

                    const openUrl = url.replace(`${URL_PROTOCOL_APP_HANDLER_THORIUM}://`, "http://"); // HTTP to HTTPS redirect should be handled by the server

                    const link: IOpdsLinkView = {
                        url: openUrl,
                    };

                    const pubViewArray = (yield* callTyped(importFromLink, link, true /* willBeImmediatelyFollowedByOpen */)) as PublicationView | PublicationView[];
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield* callTyped(appActivate);

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to importFromLink and to open the publication");
                    debug(e);
                    yield* putTyped(toastActions.openRequest.build(ToastType.Error, `THORIUM Deep link ${e}`));
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenUrlWithOpdsSchemeEventChannel();

            while (true) {

                let dump = "";
                try {
                    const url = yield* takeTyped(chan);


                    dump = "#############################################\n";
                    dump += `take opds url from channel: URL="${url}"\n`;
                    dump += `Date: ${(new Date()).toISOString()}\n`;
                    // dump +=

                    if (url.startsWith(`${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`)) {
                        debug("OPDS AUTH: ", `${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`);
                        dump += "This is an authentication flow\n";
                        // ===> opdsAuthFlow
                        const libWin = getLibraryWindowFromDi();
                        const children = libWin.getChildWindows(); // TODO: make sure this is the OPDS AUTH BrowserWindow!!
                        if (children?.length) {
                            debug("OPDS AUTH: sub win?");
                            const win = children[0];
                            dump += "child win from libwin\n";
                            if (win.title === getTranslator().translate("catalog.opds.auth.login")) {
                                debug("OPDS AUTH: sub win OK, load...", url);
                                dump += "OPDS AUTH: sub win OK, load...\n";
                                try {
                                    yield* callTyped(() => win.loadURL(url));
                                } catch (e) {
                                    dump += `error to load '${url}' in auth child window => e=${JSON.stringify(e, null, 4)}\n`;
                                    debug(`error to load '${url}' in auth child window => e=${JSON.stringify(e, null, 4)}`);
                                }
                            } else {
                                debug("This is not an auth login window");
                                dump += "This is not an auth login window\n";
                            }
                        } else {
                            debug("No child window on library window");
                            dump += "No child window on library window\n";
                        }

                    } else {

                        const feed = yield* callTyped(opdsApi.addFeed, { title: url, url });
                        if (feed) {

                            yield* callTyped(appActivate);

                            debug("Feed added ", feed);
                            dump += `feed added: ${feed}\n`;
                            debug("Open in library catalogs");
                            // open the feed in libraryWindow
                            yield put(historyActions.pushFeed.build(feed));
                        }
                    }
                    dump += "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$44\n";
                    
                } catch (e) {
                    debug("OPDS Deep link error");
                    debug(e);
                    yield* putTyped(toastActions.openRequest.build(ToastType.Error, `OPDS Deep link ${e}`));
                } finally {
                    try { fs.appendFileSync(appLogs, dump); } catch { }
                }
            }

        }),
        spawn(function*() {

            const chan = getOpdsNewCatalogsStringUrlChannel();

            while (true) {

                try {
                    const catalogsUrl = yield* takeTyped(chan);

                    const u = new URL(catalogsUrl);
                    if (!u) continue;

                    debug("CATALOGS URL CHANNEL ", catalogsUrl);
                    debug("start to import each feed from the 'catalogs' key");

                    // call api opds/browse in saga

                    const httpOpdsResult = yield* callTyped(browse, catalogsUrl);

                    if (httpOpdsResult.isFailure) continue;

                    const catalogs = httpOpdsResult.data?.opds?.catalogs;

                    if (!Array.isArray(catalogs)) continue;

                    for (const feed of catalogs) {

                        try {

                            const feedUrl = feed.catalogLinkView[0].url;
                            const u = new URL(feedUrl);
                            if (!u) continue;

                            debug("import the feed", feed.documentTitle, feedUrl);

                            // addFeed has a security to not duplicate a feed
                            yield* callTyped(addFeed, {
                                title: feed.documentTitle,
                                url: feedUrl,
                            });

                        } catch (e) {
                            debug("loop into catalogs list: Wrong feed format:", feed);
                            debug(e);
                        }

                    }

                } catch (e) {

                    debug("ERROR to import an opds catalogs from an OPDSFeed");
                    debug(e);
                }
            }

        }),
    ]);
}
