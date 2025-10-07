// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { customizationActions, historyActions, readerActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    getOpenUrlWithOpdsSchemeEventChannel, getOpenUrlWithThoriumSchemeEventChannel,
    getOpdsNewCatalogsStringUrlChannel,
    getOpenFileFromCliChannel, getOpenTitleFromCliChannel,
} from "readium-desktop/main/event";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put, spawn } from "redux-saga/effects";
import { call as callTyped, take as takeTyped, select as selectTyped, put as putTyped /*race as raceTyped, delay as delayTyped*/ } from "typed-redux-saga/macro";
import { opdsApi } from "./api";
import { browse } from "./api/browser/browse";
import { addFeed } from "./api/opds/feed";

import { importFromFs, importFromLink } from "./api/publication/import";
import { search } from "./api/publication/search";
import { appActivate } from "./win/library";
import { getAndStartCustomizationWellKnownFileWatchingEventChannel } from "./getEventChannel";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { customizationPackageProvisioningAccumulator, customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";
import * as path from "path";
import { ICustomizationProfileError, ICustomizationProfileProvisioned } from "readium-desktop/common/redux/states/customization";

// Logger
const debug = debug_("readium-desktop:main:saga:event");

export function saga() {
    return all([
        spawn(function*() {

            const chan = getAndStartCustomizationWellKnownFileWatchingEventChannel(customizationWellKnownFolder);

            while (true) {

                try {
                    const [packageFileName, removed] = yield* takeTyped(chan);

                    const customizationState = yield* selectTyped((state: ICommonRootState) => state.customization);
                    let packagesArray = customizationState.provision;
                    const errorPackages: ICustomizationProfileError[] = [];

                    if (removed) {
                        const packageFound = packagesArray.find(({ fileName }) => fileName === packageFileName);
                        if (packageFound && packageFound.id === customizationState.activate.id && packageFound.fileName === packageFileName) {
                            debug("rollback to thorium vanilla profile");
                            yield* putTyped(customizationActions.activating.build("")); // no profile
                        }
                        packagesArray = packagesArray.filter(({ fileName }) => fileName !== packageFileName);
                    } else {
                        const profileProvisioned = yield* callTyped(() => customizationPackageProvisioningAccumulator(packagesArray, packageFileName));
                        if ((profileProvisioned as ICustomizationProfileError).error) {
                            debug("ERROR: Profile not provisioned, due to error :", (profileProvisioned as ICustomizationProfileError).message);
                            errorPackages.push((profileProvisioned as ICustomizationProfileError));
                        } else {
                            packagesArray = [
                                ...packagesArray.filter(({ id }) => (profileProvisioned as ICustomizationProfileProvisioned).id !== id),
                                profileProvisioned as ICustomizationProfileProvisioned,
                            ];
                        }
                    }

                    debug("dispatch provisionning action with ", JSON.stringify(packagesArray));
                    yield* putTyped(customizationActions.provisioning.build(customizationState.provision, packagesArray, errorPackages));

                    // TODO: how to warn user of potentially a new version of the packages id, we have to put a diff between version for a same id !
                    // And mostly a technical issue, how to update the view with the update. package streamer follow a package id 
                    

                } catch (e) {

                    debug("ERROR to importFromFs and to open the publication");
                    debug(e);
                }
            }


        }),
        spawn(function*() {

            const chan = getOpenFileFromCliChannel();

            while (true) {

                try {
                    const filePath = yield* takeTyped(chan);

                    const fileName = path.basename(filePath);
                    const extension = path.extname(fileName);
                    if (extension === ".thorium") {
                    
                        yield put(customizationActions.acquire.build(filePath));
                        return ;
                    }

                    const pubViewArray = yield* callTyped(importFromFs, filePath);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield* callTyped(appActivate);
                        yield put(readerActions.openRequest.build(pubView.identifier));
                        yield put(readerActions.detachModeRequest.build());


                    }

                } catch (e) {

                    debug("ERROR to importFromFs and to open the publication");
                    debug(e);
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
                    if (url.startsWith("thorium://customization-profile/")) {
                        const profileUrl = url.replace(/^thorium:\/\/customization-profile\//, "http://");
                        debug("THORIUM customization-profile url", profileUrl);
                        yield* putTyped(customizationActions.acquire.build(profileUrl));
                        continue ;
                    }

                    const openUrl = url.replace("thorium://", "http://"); // HTTP to HTTPS redirect should be handled by the server

                    const link: IOpdsLinkView = {
                        url: openUrl,
                    };

                    const pubViewArray = (yield* callTyped(importFromLink, link)) as PublicationView | PublicationView[];
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield* callTyped(appActivate);

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to importFromLink and to open the publication");
                    debug(e);
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenUrlWithOpdsSchemeEventChannel();

            while (true) {

                try {
                    const url = yield* takeTyped(chan);

                    const feed = yield* callTyped(opdsApi.addFeed, { title : url, url});
                    if (feed) {

                        yield* callTyped(appActivate);

                        debug("Feed added ", feed);
                        debug("Open in library catalogs");
                        // open the feed in libraryWindow
                        yield put(historyActions.pushFeed.build(feed));
                    }

                } catch (e) {

                    debug("ERROR to importFromLink and to open the publication");
                    debug(e);
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
